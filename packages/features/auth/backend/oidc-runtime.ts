/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { IsNull, Not } from 'typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import type { Config } from '@/config.js';
import type { Redis } from 'ioredis';
import type { MiMeta } from '@features/instance/backend/models/Meta.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiRegistrationTicket } from './models/RegistrationTicket.js';
import { MiUserSecurityKey } from './models/UserSecurityKey.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiOidcProvider } from './models/OidcProvider.js';
import { MiOidcIdentity } from './models/OidcIdentity.js';
import { OidcTransactionStore } from './oidc-transaction-store.js';
import { OidcFlowStore, oidcHash, oidcOpaque } from './oidc-flow-store.js';
import type { OidcFlow } from './oidc-flow-store.js';
import { createOidcDiscovery } from './oidc-discovery.js';
import { createOidcTokenExchange } from './oidc-token-exchange.js';
import { createSigninAssurance, signinPolicyStamp } from './signin-assurance.js';
import { readMfaPolicy } from './mfa-policy.js';
import { normalizedPasskeyPublicKey } from './passkey-public-key.js';
import type { BrowserSessionIdentity, ApiToken } from '@features/api/backend/transport/context.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { EmailService } from '@features/email/backend/services/EmailService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { SignupService } from './services/SignupService.js';
import type { BrowserSessionService } from './services/BrowserSessionService.js';
import type { SigninService } from './transport/SigninService.js';
import type { UserAuthService } from './services/UserAuthService.js';
import type { WebAuthnService } from './services/WebAuthnService.js';
import type { AuthSessionRequest, AuthSessionEffects } from './session.effects.js';
import type { CaptchaService } from './services/CaptchaService.js';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { ClientMetadataNetwork } from './oauth/ClientMetadataFetcher.js';

export interface OidcLocalIdentity { userId: string; browserSession: BrowserSessionIdentity; accessToken?: ApiToken | null }
export interface OidcLocalAuthorization {
	transaction<T>(identity: OidcLocalIdentity, run: (locked: { manager: EntityManager; user: MiUser; profile: MiUserProfile; keys: MiUserSecurityKey[]; session: MiBrowserSession }) => Promise<T>): Promise<T>;
}
export interface OidcRuntimeDependencies {
	db: Pick<DataSource, 'getRepository' | 'transaction'>;
	redis: Redis;
	config: Pick<Config, 'url' | 'allowedPrivateNetworks'>;
	meta: MiMeta;
	idService: Pick<IdService, 'gen'>;
	email: Pick<EmailService, 'validateEmailForAccount' | 'sendEmail'>;
	roles: Pick<RoleService, 'getUserRoles'>;
	signup: Pick<SignupService, 'signup' | 'completeSignup'>;
	sessions: Pick<BrowserSessionService, 'issue' | 'isActive'>;
	signin: Pick<SigninService, 'signin'>;
	totp: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	webauthn: Pick<WebAuthnService, 'initiateAuthentication' | 'verifyOidcAuthenticationWithProof'>;
	captcha: CaptchaService;
	local: OidcLocalAuthorization;
	/** Synthetic network tests only; production uses pinned DNS/TLS adapters. */
	network?: ClientMetadataNetwork;
}
export interface OidcRegistration { username: string; password: string; email: string; agree: boolean; invitationCode?: string; captcha?: Record<string, string> }

/** OIDC identity never substitutes for local sudo, nor for a required local second factor. */
export class OidcRuntime {
	private transactions: OidcTransactionStore;
	private flows: OidcFlowStore;
	private discover: ReturnType<typeof createOidcDiscovery>;
	private exchange: ReturnType<typeof createOidcTokenExchange>;
	constructor(private deps: OidcRuntimeDependencies) {
		this.transactions = new OidcTransactionStore(deps.redis);
		this.flows = new OidcFlowStore(deps.redis);
		this.discover = createOidcDiscovery(deps.network, deps.config.allowedPrivateNetworks);
		this.exchange = createOidcTokenExchange(deps.network, deps.config.allowedPrivateNetworks);
	}
	redirectUri(id: string) { return `${this.deps.config.url}/auth/oidc/callback/${encodeURIComponent(id)}`; }
	private providers(manager?: EntityManager) { return (manager ?? this.deps.db).getRepository(MiOidcProvider); }
	private async provider(id: string) {
		const provider = await this.providers().findOneOrFail({ where: { id }, select: { id: true, name: true, version: true, enabled: true, issuer: true, clientId: true, clientSecret: true } });
		if (!provider.enabled || !provider.clientSecret) throw new Error('OIDC provider unavailable');
		return provider;
	}
	private async currentProvider(flow: Pick<OidcFlow, 'providerId' | 'providerVersion' | 'issuer'>, manager?: EntityManager) {
		const provider = await this.providers(manager).findOne({ where: { id: flow.providerId }, ...(manager ? { lock: { mode: 'pessimistic_read' as const } } : {}) });
		if (!provider?.enabled || provider.version !== flow.providerVersion || provider.issuer !== flow.issuer) throw new Error('OIDC provider changed');
		return provider;
	}
	async listProviders(admin: true): Promise<{ id: string; name: string; version: string; enabled: boolean; issuer: string; clientId: string; redirectUri: string }[]>;
	async listProviders(admin?: false): Promise<{ id: string; name: string }[]>;
	async listProviders(admin = false) {
		const providers = await this.providers().find({ ...(admin ? {} : { where: { enabled: true } }), order: { name: 'ASC', id: 'ASC' } });
		return providers.map(provider => ({ id: provider.id, name: provider.name, ...(admin ? { version: provider.version, enabled: provider.enabled, issuer: provider.issuer, clientId: provider.clientId, redirectUri: this.redirectUri(provider.id) } : {}) }));
	}
	private async admin(user: MiUser) {
		if (this.deps.meta.rootUserId !== user.id && !(await this.deps.roles.getUserRoles(user.id, true)).some(role => role.isAdministrator)) throw new Error('Administrator required');
	}
	async createProvider(identity: OidcLocalIdentity, name: string) {
		return this.deps.local.transaction(identity, async ({ manager, user }) => {
			await this.admin(user);
			const id = this.deps.idService.gen();
			await this.providers(manager).insert({ id, name, version: oidcOpaque(), enabled: false, issuer: '', clientId: '', clientSecret: null });
			return { id, redirectUri: this.redirectUri(id) };
		});
	}
	async updateProvider(identity: OidcLocalIdentity, input: { id: string; version: string; name: string; issuer: string; clientId: string; clientSecret?: string; clearClientSecret?: true; enabled: boolean }) {
		// Network verification never holds local account locks. Version is rechecked inside sudo.
		if (input.enabled) await this.discover({ ...input, version: input.version });
		return this.deps.local.transaction(identity, async ({ manager, user }) => {
			await this.admin(user);
			const provider = await this.providers(manager).findOneOrFail({ where: { id: input.id }, select: { id: true, issuer: true, clientId: true, clientSecret: true, enabled: true, version: true }, lock: { mode: 'pessimistic_write' } });
			if (provider.version !== input.version) throw new Error('OIDC settings changed');
			if (provider.issuer !== input.issuer && await manager.getRepository(MiOidcIdentity).existsBy({ providerId: input.id })) throw new Error('Unlink identities before changing issuer');
			if (input.clearClientSecret && (provider.enabled || input.enabled || input.clientSecret !== undefined || await manager.getRepository(MiOidcIdentity).existsBy({ providerId: input.id }))) throw new Error('Disable provider and unlink all identities before explicitly clearing secret');
			const clientSecret = input.clearClientSecret ? null : input.clientSecret === undefined ? provider.clientSecret : input.clientSecret;
			if (input.enabled && (!clientSecret || !input.clientId)) throw new Error('OIDC client details required');
			const version = oidcOpaque();
			await this.providers(manager).update({ id: input.id }, { name: input.name, issuer: input.issuer, clientId: input.clientId, clientSecret, enabled: input.enabled, version });
			return { version };
		});
	}
	async begin(providerId: string, identity?: OidcLocalIdentity) {
		const provider = await this.provider(providerId);
		if (identity && (identity.accessToken != null || identity.userId !== identity.browserSession.userId || !await this.deps.sessions.isActive(identity.browserSession.id, identity.userId))) throw new Error('Individual local session required');
		const authority = identity ? await this.deps.local.transaction(identity, async ({ session }) => {
			if (!session.sudoGrantId || !session.sudoUntil) throw new Error('Local authentication required');
			return { grantId: session.sudoGrantId, until: session.sudoUntil.getTime() };
		}) : null;
		// Do not hold account locks while contacting the provider.
		const metadata = await this.discover(provider);
		const purpose = identity ? { mode: 'link' as const, localUserId: identity.userId, localSessionId: identity.browserSession.id } : { mode: 'login' as const };
		const started = await this.transactions.create(provider, purpose, this.redirectUri(providerId));
		const url = new URL(metadata.authorization_endpoint);
		// Disallow preconfigured authorization arguments overriding server-owned bindings.
		url.search = new URLSearchParams({ response_type: 'code', client_id: provider.clientId, redirect_uri: this.redirectUri(providerId), scope: 'openid', state: started.state, nonce: started.nonce, code_challenge: started.codeChallenge, code_challenge_method: 'S256' }).toString();
		if (identity && authority) await this.deps.local.transaction(identity, async ({ session }) => {
			if (session.sudoGrantId !== authority.grantId || session.sudoUntil?.getTime() !== authority.until) throw new Error('Local authentication changed');
		});
		return { url: url.href, state: started.state, browserSecret: started.browserSecret };
	}
	async callback(providerId: string, state: string, browserSecret: string, code?: string) {
		const provider = await this.provider(providerId);
		const bound = await this.transactions.lookup(state, browserSecret);
		if (!bound || bound.providerId !== providerId) throw new Error('OIDC transaction unavailable');
		const transaction = await this.transactions.consume(provider, bound.purpose, state, browserSecret);
		if (!transaction) throw new Error('OIDC transaction unavailable');
		if (!code) return { canceled: true as const };
		if (!transaction.redirectUri || !transaction.codeChallenge) throw new Error('Missing OIDC redirect binding');
		const metadata = await this.discover(provider);
		const identity = await this.exchange({ ...provider, redirectUri: this.redirectUri(providerId) }, metadata, { ...transaction, redirectUri: transaction.redirectUri, codeChallenge: transaction.codeChallenge }, code, provider.clientSecret!);
		const flow: OidcFlow = { providerId, providerVersion: provider.version, issuer: identity.issuer, subject: identity.subject, purpose: transaction.purpose };
		await this.currentProvider(flow);
		if (flow.purpose.mode === 'link') {
			if (!await this.deps.sessions.isActive(flow.purpose.localSessionId, flow.purpose.localUserId)) throw new Error('Link session expired');
		} else {
			const linked = await this.deps.db.getRepository(MiOidcIdentity).findOneBy({ issuer: identity.issuer, subject: identity.subject, providerId });
			if (linked) {
				const { user, profile, keys } = await this.account(linked.userId);
				flow.userId = user.id;
				flow.identityId = linked.id;
				flow.policyStamp = signinPolicyStamp(user, profile, keys);
			}
		}
		const ticket = await this.flows.create(flow, browserSecret, state);
		return { ticket, ...await this.describe(flow, ticket) };
	}
	private async account(userId: string) {
		const user = await this.deps.db.getRepository(MiUser).findOneByOrFail({ id: userId, host: IsNull(), isDeleted: false, isSuspended: false });
		const profile = await this.deps.db.getRepository(MiUserProfile).findOneByOrFail({ userId });
		const keys = await this.deps.db.getRepository(MiUserSecurityKey).findBy({ userId });
		return { user, profile, keys };
	}
	private async describe(flow: OidcFlow, ticket: string) {
		if (flow.purpose.mode === 'link') return { next: 'link' as const, providerId: flow.providerId, issuer: flow.issuer, subject: flow.subject };
		if (!flow.userId) return { next: 'onboarding' as const, emailSent: !!flow.registration, termsUrl: this.deps.meta.termsOfServiceUrl };
		const { user, profile, keys } = await this.account(flow.userId);
		if (signinPolicyStamp(user, profile, keys) !== flow.policyStamp) throw new Error('Authentication policy changed');
		const policy = readMfaPolicy(profile, keys.length);
		const factors: ('totp' | 'recovery' | 'passkey')[] = [];
		if (policy.totp) factors.push('totp');
		if (policy.required && profile.twoFactorBackupSecret?.length) factors.push('recovery');
		if (policy.passkey) factors.push('passkey');
		return { next: 'login' as const, factors, ...(policy.passkey ? { options: await this.deps.webauthn.initiateAuthentication(user.id, ticket, false) } : {}) };
	}
	async status(ticket: string, browserSecret: string) {
		const pending = await this.flows.read(ticket, browserSecret);
		if (!pending) throw new Error('OIDC continuation unavailable');
		await this.currentProvider(pending.flow);
		return this.describe(pending.flow, ticket);
	}
	async cancel(ticket: string, browserSecret: string) { await this.flows.consume(ticket, browserSecret); }
	async login(ticket: string, browserSecret: string, request: AuthSessionRequest, reply: AuthSessionEffects, token?: string, credential?: AuthenticationResponseJSON) {
		const started = performance.now();
		const claimed = await this.flows.consume(ticket, browserSecret);
		if (!claimed || claimed.flow.purpose.mode !== 'login' || !claimed.flow.userId || !claimed.flow.identityId || !claimed.flow.policyStamp) throw new Error('OIDC login unavailable');
		const flow = claimed.flow;
		const deadline = Math.min(started + claimed.remainingMs, performance.now() + 90_000);
		await this.currentProvider(flow);
		const { user, profile, keys } = await this.account(flow.userId!);
		if (signinPolicyStamp(user, profile, keys) !== flow.policyStamp) throw new Error('Authentication policy changed');
		const policy = readMfaPolicy(profile, keys.length);
		let factor: 'none' | 'totp' | 'recovery' | 'passkey' = 'none';
		let key;
		if (policy.required) {
			if (token) {
				factor = profile.twoFactorBackupSecret?.includes(token) ? 'recovery' : 'totp';
				if (factor === 'totp' && !policy.totp) throw new Error('Local factor required');
				await this.deps.totp.twoFactorAuthenticate(profile, token);
			} else if (credential && policy.passkey) {
				const verified = await this.deps.webauthn.verifyOidcAuthenticationWithProof(user.id, ticket, credential, async candidate => {
					if (candidate.userId !== user.id || !keys.some(stored => stored.id === candidate.id && normalizedPasskeyPublicKey(stored.publicKey) === candidate.publicKey)) throw new Error('Local factor changed');
					return flow.policyStamp;
				});
				if (!verified || verified.expected !== flow.policyStamp) throw new Error('Local factor failed');
				factor = 'passkey'; key = verified.key;
			} else throw new Error('Local factor required');
		}
		const proof = createSigninAssurance({ userId: user.id, policyStamp: flow.policyStamp!, mode: 'oidc', passwordVerified: false, factor, key, deadline, external: { identityId: flow.identityId!, providerId: flow.providerId, providerVersion: flow.providerVersion, issuer: flow.issuer, subject: flow.subject } });
		return this.deps.signin.signin(request, reply, user, proof);
	}
	async links(userId: string) {
		return (await this.deps.db.getRepository(MiOidcIdentity).find({ where: { userId }, relations: { provider: true } })).map(row => ({ id: row.id, providerId: row.providerId, providerName: row.provider.name, issuer: row.issuer, createdAt: row.createdAt.toISOString() }));
	}
	async link(ticket: string, browserSecret: string, identity: OidcLocalIdentity, agree: boolean) {
		if (!agree) throw new Error('Explicit link consent required');
		const pending = await this.flows.read(ticket, browserSecret);
		if (!pending || pending.flow.purpose.mode !== 'link' || pending.flow.purpose.localUserId !== identity.userId || pending.flow.purpose.localSessionId !== identity.browserSession.id) throw new Error('Link session mismatch');
		const started = performance.now(); const claimed = await this.flows.consume(ticket, browserSecret);
		const flow = claimed?.flow;
		if (!claimed || !flow || flow.purpose.mode !== 'link' || flow.purpose.localUserId !== identity.userId || flow.purpose.localSessionId !== identity.browserSession.id) throw new Error('Link session mismatch');
		const deadline = started + claimed.remainingMs;
		await this.deps.local.transaction(identity, async ({ manager }) => {
			await this.currentProvider(flow, manager);
			if (performance.now() >= deadline) throw new Error('Link expired');
			await manager.getRepository(MiOidcIdentity).insert({ id: this.deps.idService.gen(), userId: identity.userId, providerId: flow.providerId, issuer: flow.issuer, subject: flow.subject, createdAt: new Date() });
			if (performance.now() >= deadline) throw new Error('Link expired');
		});
	}
	async unlink(id: string, identity: OidcLocalIdentity) {
		await this.deps.local.transaction(identity, async ({ manager, profile, keys }) => {
			// The initial onboarding always creates a password; also protect future passwordless accounts.
			const passwordEnabled = !!profile.password && !(profile as MiUserProfile & { passwordLoginDisabled?: boolean }).passwordLoginDisabled;
			const localLogin = passwordEnabled || (profile.usePasswordLessLogin && keys.length > 0 && !profile.passkeyMfaEnabled);
			const otherExternal = await manager.getRepository(MiOidcIdentity).exists({ where: { id: Not(id), userId: identity.userId, provider: { enabled: true } } });
			if (!localLogin && !otherExternal) throw new Error('Keep a login method before unlinking');
			const result = await manager.getRepository(MiOidcIdentity).delete({ id, userId: identity.userId });
			if (result.affected !== 1) throw new Error('OIDC identity unavailable');
		});
	}
	private termsStamp() { return oidcHash(JSON.stringify([this.deps.meta.termsOfServiceUrl, this.deps.meta.privacyPolicyUrl, this.deps.meta.serverRules])); }
	private async captchas(values: Record<string, string> = {}) {
		const m = this.deps.meta;
		if (m.enableHcaptcha && m.hcaptchaSecretKey) await this.deps.captcha.verifyHcaptcha(m.hcaptchaSecretKey, values['hcaptcha-response']);
		if (m.enableRecaptcha && m.recaptchaSecretKey) await this.deps.captcha.verifyRecaptcha(m.recaptchaSecretKey, values['g-recaptcha-response']);
		if (m.enableTurnstile && m.turnstileSecretKey) await this.deps.captcha.verifyTurnstile(m.turnstileSecretKey, values['turnstile-response']);
		if (m.enableMcaptcha && m.mcaptchaSecretKey && m.mcaptchaSitekey && m.mcaptchaInstanceUrl) await this.deps.captcha.verifyMcaptcha(m.mcaptchaSecretKey, m.mcaptchaSitekey, m.mcaptchaInstanceUrl, values['m-captcha-response']);
		if (m.enableTestcaptcha) await this.deps.captcha.verifyTestcaptcha(values['testcaptcha-response']);
	}
	async register(ticket: string, browserSecret: string, input: OidcRegistration) {
		const pending = await this.flows.read(ticket, browserSecret);
		if (!pending || pending.flow.purpose.mode !== 'login' || pending.flow.userId || !input.agree || !this.deps.meta.rootUserId) throw new Error('OIDC onboarding unavailable');
		await this.currentProvider(pending.flow);
		await this.captchas(input.captcha);
		if (!(await this.deps.email.validateEmailForAccount(input.email)).available) throw new Error('Email unavailable');
		const code = randomBytes(16).toString('hex');
		const registration = { username: input.username, passwordHash: await bcrypt.hash(input.password, 8), email: input.email, codeHash: oidcHash(code), termsStamp: this.termsStamp(), invitationCode: input.invitationCode };
		if (!await this.flows.update(ticket, browserSecret, pending.version, { ...pending.flow, registration })) throw new Error('Onboarding changed');
		// Original continuation TTL is preserved. SMTP failure does not invent a verified email.
		await this.deps.email.sendEmail(input.email, 'Email verification', `Verification code: ${code}`, `Verification code: ${code}`);
	}
	async finishRegistration(ticket: string, browserSecret: string, code: string) {
		const pending = await this.flows.read(ticket, browserSecret);
		const registration = pending?.flow.registration;
		if (!registration || !/^[a-f0-9]{32}$/.test(code) || !timingSafeEqual(Buffer.from(oidcHash(code)), Buffer.from(registration.codeHash))) throw new Error('Email verification failed');
		const started = performance.now(); const claimed = await this.flows.consume(ticket, browserSecret);
		const flow = claimed?.flow;
		if (!claimed || !flow || flow.userId || flow.purpose.mode !== 'login' || JSON.stringify(flow.registration) !== JSON.stringify(registration)) throw new Error('Onboarding changed');
		const deadline = started + claimed.remainingMs;
		if (registration.termsStamp !== this.termsStamp() || !(await this.deps.email.validateEmailForAccount(registration.email)).available) throw new Error('Registration policy changed');
		const result = await this.deps.db.transaction(async manager => {
			await this.currentProvider(flow, manager);
			if (performance.now() >= deadline || registration.termsStamp !== this.termsStamp()) throw new Error('Onboarding expired');
			let invitation: MiRegistrationTicket | null = null;
			if (this.deps.meta.disableRegistration) {
				if (!registration.invitationCode) throw new Error('Invitation required');
				invitation = await manager.getRepository(MiRegistrationTicket).findOne({ where: { code: registration.invitationCode }, lock: { mode: 'pessimistic_write' } });
				if (!invitation || invitation.usedAt || invitation.usedById || invitation.pendingUserId || (invitation.expiresAt && invitation.expiresAt <= new Date())) throw new Error('Invitation unavailable');
			}
			const { account } = await this.deps.signup.signup({ username: registration.username, passwordHash: registration.passwordHash }, manager);
			await manager.getRepository(MiUserProfile).update({ userId: account.id }, { email: registration.email, emailVerified: true, emailVerifyCode: null });
			await manager.getRepository(MiOidcIdentity).insert({ id: this.deps.idService.gen(), userId: account.id, providerId: flow.providerId, issuer: flow.issuer, subject: flow.subject, createdAt: new Date() });
			if (invitation) await manager.getRepository(MiRegistrationTicket).update({ id: invitation.id }, { usedAt: new Date(), usedById: account.id });
			const issued = await this.deps.sessions.issue(account.id, manager.getRepository(MiBrowserSession));
			if (performance.now() >= deadline) throw new Error('Onboarding expired');
			return { account, token: issued.token };
		});
		await this.deps.signup.completeSignup(result.account);
		return { finished: true as const, id: result.account.id, i: result.token };
	}
}
