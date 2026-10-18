/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { IsNull, Not } from 'typeorm';
import * as v from 'valibot';
import * as OTPAuth from 'otpauth';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { Config } from '@/config.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { generateNativeUserToken } from './utility/token.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiUserSecurityKey } from './models/UserSecurityKey.js';
import { SudoService, sudoPolicyStamp, sudoRequired } from './sudo.js';
import type { SudoIdentity, LockedSudoContext } from './sudo.js';
import { SecurityOperationStore, SecurityConfirmationRejected } from './security-operation-store.js';
import type { SecurityOperation } from './security-operation-store.js';
import type { TotpService } from './services/TotpService.js';
import { TotpAuthenticationFailed } from './services/TotpService.js';
import { queueCommittedAccountDeletion } from './account-deletion.js';
import { changeEmail } from './email-change.js';
import type { EmailChangeDependencies } from './email-change.js';
import { regenerateToken } from './token-regeneration.js';
import type { TokenRegenerationDependencies } from './token-regeneration.js';
import { MiPasswordResetRequest } from './models/PasswordResetRequest.js';
import { readMfaPolicy } from './mfa-policy.js';
import { normalizedPasskeyPublicKey } from './passkey-public-key.js';
import { nativeRegistrationOptionsSchema, nativeAuthenticationOptionsSchema, webAuthnRegistrationResponseSchema, webAuthnAuthenticationResponseSchema, webAuthnTransportSchema } from './webauthn.schema.js';

export interface SecuritySettingsDependencies {
	sudo: SudoService;
	operations: SecurityOperationStore;
	email: EmailChangeDependencies;
	tokens: TokenRegenerationDependencies;
	config: Pick<Config, 'url' | 'host' | 'hostname'>;
	meta: Pick<MiMeta, 'name' | 'rootUserId'>;
	queue: Pick<QueueService, 'createDeleteAccountJob'>;
	totp: Pick<TotpService, 'validateOtp'>;
	users: Pick<UserEntityService, 'packSelf'>;
	events: Pick<GlobalEventService, 'publishMainStream' | 'publishInternalEvent'>;
}
const failure = () => apiError({ code: 'CONFIRMATION_FAILED', status: 403, message: 'Confirmation failed. Please start again.', id: '02a02d68-a11b-4c7d-ae71-d44702501456' });
const lastFactor = () => apiError({ code: 'LAST_AUTHENTICATION_FACTOR', status: 400, message: 'Keep an available sign-in factor, or explicitly disable MFA first.', id: '9e5ca763-35a0-49fd-bd75-c0ba57438280' });
const newCodes = () => Array.from({ length: 5 }, () => new OTPAuth.Secret().base32);
const operationStamp = (context: LockedSudoContext) => createHash('sha256').update(JSON.stringify([
	sudoPolicyStamp(context.user, context.profile, context.keys), context.profile.twoFactorBackupSecret ?? null,
])).digest('hex');

/** Factor writes share the same account/profile/session locks as all sudo operations. */
export class SecuritySettings {
	constructor(private deps: SecuritySettingsDependencies) {}
	private async published(userId: string, revokedIds: readonly string[] | 'all' = []) {
		this.deps.events.publishMainStream(userId, 'meUpdated', await this.deps.users.packSelf(userId, { includeSecrets: true }));
		if (revokedIds === 'all') this.deps.events.publishInternalEvent('browserSessionRevoked', { id: null, userId });
		else for (const id of revokedIds) this.deps.events.publishInternalEvent('browserSessionRevoked', { id, userId });
	}
	private async updated(context: LockedSudoContext, update: Partial<Pick<MiUserProfile, 'passkeyMfaEnabled' | 'usePasswordLessLogin' | 'twoFactorBackupSecret' | 'twoFactorEnabled' | 'twoFactorTempSecret' | 'twoFactorSecret' | 'passwordLoginDisabled'>>, keys = context.keys) {
		if (Object.keys(update).length) await context.manager.getRepository(MiUserProfile).update({ userId: context.user.id }, update);
		const current = { ...context.profile, ...update };
		const revoked = await context.manager.getRepository(MiBrowserSession).find({
			where: { userId: context.user.id, id: Not(context.session.id), revokedAt: IsNull() }, select: { id: true },
		});
		// A newly active factor must be used on the next login on every other device.
		await context.manager.getRepository(MiBrowserSession).update({ userId: context.user.id, id: Not(context.session.id) }, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
		// Keep the original deadline. Successful factor proof does not start a new window.
		await context.manager.getRepository(MiBrowserSession).update({ id: context.session.id, userId: context.user.id }, { sudoPolicyStamp: sudoPolicyStamp(context.user, current, keys) });
		return revoked.map(session => session.id);
	}
	private async claim(identity: SudoIdentity, kind: SecurityOperation['kind'], ticket: string) {
		if (identity.accessToken != null || !identity.browserSession || identity.browserSession.userId !== identity.userId) throw failure();
		if (!(await this.deps.sudo.status(identity)).active) throw sudoRequired();
		return this.deps.operations.consume(kind, identity.userId, identity.browserSession.id, ticket).catch(error => {
			if (error instanceof SecurityConfirmationRejected) throw failure();
			throw error;
		});
	}
	private check(context: LockedSudoContext, row: SecurityOperation & { expiresAtMonotonic: number }) {
		if (context.session.sudoUntil?.getTime() !== row.sudoUntil || context.session.sudoGrantId !== row.sudoGrantId || operationStamp(context) !== row.policyStamp || performance.now() >= row.expiresAtMonotonic) throw failure();
	}

	async deleteAccount(identity: SudoIdentity, acknowledged: boolean) {
		if (!acknowledged) throw failure();
		await this.deps.sudo.transaction(identity, context => queueCommittedAccountDeletion(context.manager, context.user, context.profile, this.deps));
		this.deps.events.publishInternalEvent('browserSessionRevoked', { id: null, userId: identity.userId });
		this.deps.events.publishInternalEvent('userChangeDeletedState', { id: identity.userId, isDeleted: true });
	}

	async changePassword(identity: SudoIdentity, password: string) {
		// Hash outside the transaction; authorization is rechecked after acquiring locks.
		const hash = await bcrypt.hash(password, 8);
		const rotated = await this.deps.sudo.transaction(identity, async context => {
			const oldToken = context.user.token!; const newToken = generateNativeUserToken();
			await context.manager.getRepository(MiUser).update(context.user.id, { token: newToken });
			await context.manager.getRepository(MiUserProfile).update({ userId: context.user.id }, { password: hash, passwordLoginDisabled: false });
			await context.manager.getRepository(MiPasswordResetRequest).delete({ userId: context.user.id });
			await context.manager.getRepository(MiBrowserSession).update({ userId: context.user.id }, { revokedAt: new Date(), sudoUntil: null, sudoPolicyStamp: null });
			return { id: context.user.id, oldToken, newToken };
		});
		this.deps.events.publishInternalEvent('userTokenRegenerated', rotated);
		await this.published(identity.userId, 'all');
	}
	async changeEmail(identity: SudoIdentity, email: string | null) {
		return changeEmail(this.deps.email, identity.userId, email, { kind: 'sudo', service: this.deps.sudo, identity });
	}
	async regenerateToken(identity: SudoIdentity) {
		return regenerateToken(this.deps.tokens, identity.userId, { kind: 'sudo', service: this.deps.sudo, identity });
	}

	async passwordlessStart(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async context => {
			if (context.profile.usePasswordLessLogin || context.profile.passkeyMfaEnabled || !context.keys.length) throw failure();
			const options = await generateAuthenticationOptions({ rpID: this.deps.config.hostname, userVerification: 'required' });
			v.assert(nativeAuthenticationOptionsSchema, options);
			const ticket = await this.deps.operations.create({ kind: 'enable-passwordless-login', userId: context.user.id,
				sessionId: context.session.id, sudoUntil: context.session.sudoUntil!.getTime(), sudoGrantId: context.session.sudoGrantId!, policyStamp: operationStamp(context),
				challenge: options.challenge, requireUV: true, name: null, backupCodes: null });
			return { ticket, options };
		});
	}
	async passwordlessComplete(identity: SudoIdentity, ticket: string, response: unknown) {
		const row = await this.claim(identity, 'enable-passwordless-login', ticket);
		const revokedIds = await this.deps.sudo.transaction(identity, async context => {
			this.check(context, row);
			if (context.profile.usePasswordLessLogin || context.profile.passkeyMfaEnabled || !row.requireUV) throw failure();
			await this.verifyKey(context, row, response);
			const revokedIds = await this.updated(context, { usePasswordLessLogin: true });
			if (performance.now() >= row.expiresAtMonotonic) throw failure();
			return revokedIds;
		});
		await this.published(identity.userId, revokedIds);
	}

	async disablePasswordStart(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async context => {
			if (context.profile.passwordLoginDisabled || !context.profile.usePasswordLessLogin || context.profile.passkeyMfaEnabled
				|| !context.profile.email || !context.profile.emailVerified || !context.keys.length) throw failure();
			// Request a discoverable ceremony; require an owned userHandle and strict UV on completion.
			const options = await generateAuthenticationOptions({ rpID: this.deps.config.hostname, userVerification: 'required' });
			v.assert(nativeAuthenticationOptionsSchema, options);
			const ticket = await this.deps.operations.create({ kind: 'disable-password-login', userId: context.user.id,
				sessionId: context.session.id, sudoUntil: context.session.sudoUntil!.getTime(), sudoGrantId: context.session.sudoGrantId!, policyStamp: operationStamp(context),
				challenge: options.challenge, requireUV: true, name: null, backupCodes: null });
			return { ticket, options };
		});
	}
	async disablePasswordComplete(identity: SudoIdentity, ticket: string, response: unknown) {
		let revokedIds: string[] = [];
		const row = await this.claim(identity, 'disable-password-login', ticket);
		let rotated: { id: string; oldToken: string; newToken: string } | undefined;
		await this.deps.sudo.transaction(identity, async context => {
			this.check(context, row);
			if (context.profile.passwordLoginDisabled || !context.profile.usePasswordLessLogin || context.profile.passkeyMfaEnabled
				|| !context.profile.email || !context.profile.emailVerified || !row.requireUV) throw failure();
			await this.verifyKey(context, row, response);
			const oldToken = context.user.token!; const newToken = generateNativeUserToken();
			await context.manager.getRepository(MiUser).update(context.user.id, { token: newToken });
			context.user.token = newToken;
			revokedIds = await this.updated(context, { passwordLoginDisabled: true });
			if (performance.now() >= row.expiresAtMonotonic) throw failure();
			rotated = { id: context.user.id, oldToken, newToken };
		});
		if (rotated) this.deps.events.publishInternalEvent('userTokenRegenerated', rotated);
		await this.published(identity.userId, revokedIds);
	}
	private async verifyKey(context: LockedSudoContext, row: SecurityOperation, response: unknown) {
		const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
		const handle = credential.response.userHandle;
		const expectedHandle = Buffer.from(context.user.id).toString('base64url');
		const primary = row.kind === 'enable-passwordless-login' || row.kind === 'disable-password-login';
		// This checks ceremony/owner consistency, not cryptographic discoverability.
		if ((primary && handle !== expectedHandle) || (typeof handle === 'string' && handle !== expectedHandle)) throw failure();
		const key = context.keys.find(key => key.id === credential.id);
		if (!key) throw failure();
		const publicKey = normalizedPasskeyPublicKey(key.publicKey);
		const result = await verifyAuthenticationResponse({ response: credential, expectedChallenge: row.challenge,
			expectedOrigin: this.deps.config.url, expectedRPID: this.deps.config.hostname, requireUserVerification: row.requireUV,
			credential: { id: key.id, publicKey: new Uint8Array(Buffer.from(publicKey, 'base64url')), counter: Number(key.counter),
				transports: key.transports === null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports) } }).catch(() => { throw failure(); });
		if (!result.verified || (row.requireUV && !result.authenticationInfo.userVerified)) throw failure();
		const changed = await context.manager.getRepository(MiUserSecurityKey).update({ id: key.id, userId: key.userId, counter: key.counter, publicKey: key.publicKey }, {
			publicKey, counter: result.authenticationInfo.newCounter, lastUsed: new Date(),
		});
		if (changed.affected !== 1) throw failure();
	}

	async state(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async ({ profile, keys }) => ({
			totpEnabled: profile.twoFactorEnabled, passkeyMfaEnabled: profile.passkeyMfaEnabled,
			passwordlessEnabled: profile.usePasswordLessLogin, passwordLoginDisabled: profile.passwordLoginDisabled === true, hasVerifiedRecoveryEmail: !!profile.email && profile.emailVerified === true, passkeyCount: keys.length,
			recoveryCodesRemaining: profile.twoFactorBackupSecret?.length ?? 0,
		}), false);
	}
	async listKeys(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async ({ keys }) => keys.map(key => ({
			id: key.id, name: key.name, lastUsedAt: key.lastUsed.toISOString(),
		})));
	}
	async registerStart(identity: SudoIdentity, name: string) {
		return this.deps.sudo.transaction(identity, async context => {
			const requireUV = context.profile.usePasswordLessLogin;
			const options = await generateRegistrationOptions({ rpID: this.deps.config.hostname,
				rpName: this.deps.meta.name ?? this.deps.config.host, userID: new Uint8Array(Buffer.from(context.user.id)),
				userName: context.user.username, userDisplayName: context.user.name ?? undefined,
				excludeCredentials: context.keys.map(key => ({ id: key.id })),
				authenticatorSelection: { residentKey: requireUV ? 'required' : 'preferred', userVerification: requireUV ? 'required' : 'preferred' },
			});
			v.assert(nativeRegistrationOptionsSchema, options);
			const ticket = await this.deps.operations.create({ kind: 'register-passkey', userId: context.user.id,
				sessionId: context.session.id, sudoUntil: context.session.sudoUntil!.getTime(), sudoGrantId: context.session.sudoGrantId!, policyStamp: operationStamp(context),
				challenge: options.challenge, requireUV, name, backupCodes: null });
			return { ticket, options };
		});
	}
	async registerComplete(identity: SudoIdentity, ticket: string, response: unknown) {
		let revokedIds: string[] = [];
		const row = await this.claim(identity, 'register-passkey', ticket);
		const credential = v.parse(webAuthnRegistrationResponseSchema, response);
		const result = await verifyRegistrationResponse({ response: credential, expectedChallenge: row.challenge,
			expectedOrigin: this.deps.config.url, expectedRPID: this.deps.config.hostname, requireUserVerification: row.requireUV }).catch(() => { throw failure(); });
		if (!result.verified || !result.registrationInfo) throw failure();
		const info = result.registrationInfo;
		await this.deps.sudo.transaction(identity, async context => {
			this.check(context, row);
			await context.manager.getRepository(MiUserSecurityKey).insert({ id: info.credential.id, userId: context.user.id,
				name: row.name!, publicKey: Buffer.from(info.credential.publicKey).toString('base64url'), counter: info.credential.counter,
				credentialDeviceType: info.credentialDeviceType, credentialBackedUp: info.credentialBackedUp,
				transports: info.credential.transports ?? null });
			const keys = await context.manager.getRepository(MiUserSecurityKey).findBy({ userId: context.user.id });
			revokedIds = await this.updated(context, {}, keys);
			if (performance.now() >= row.expiresAtMonotonic) throw failure();
		});
		await this.published(identity.userId, revokedIds);
		return { id: info.credential.id, name: row.name! };
	}
	async activateStart(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async context => {
			if (context.profile.passkeyMfaEnabled || context.profile.usePasswordLessLogin || context.keys.length === 0) throw failure();
			const requireUV = context.profile.usePasswordLessLogin;
			const options = await generateAuthenticationOptions({ rpID: this.deps.config.hostname,
				userVerification: requireUV ? 'required' : 'preferred', allowCredentials: context.keys.map(key => ({ id: key.id })) });
			v.assert(nativeAuthenticationOptionsSchema, options);
			const backupCodes = context.profile.twoFactorBackupSecret?.length ? context.profile.twoFactorBackupSecret : newCodes();
			const ticket = await this.deps.operations.create({ kind: 'activate-passkey-mfa', userId: context.user.id,
				sessionId: context.session.id, sudoUntil: context.session.sudoUntil!.getTime(), sudoGrantId: context.session.sudoGrantId!, policyStamp: operationStamp(context),
				challenge: options.challenge, requireUV, name: null, backupCodes });
			return { ticket, options, backupCodes };
		});
	}
	async activateComplete(identity: SudoIdentity, ticket: string, response: unknown, recoveryAcknowledged: boolean) {
		let revokedIds: string[] = [];
		if (!recoveryAcknowledged) throw failure();
		const row = await this.claim(identity, 'activate-passkey-mfa', ticket);
		const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
		await this.deps.sudo.transaction(identity, async context => {
			this.check(context, row);
			if (context.profile.passkeyMfaEnabled || context.profile.usePasswordLessLogin || !row.backupCodes?.length) throw failure();
			await this.verifyKey(context, row, credential);
			revokedIds = await this.updated(context, { passkeyMfaEnabled: true, twoFactorBackupSecret: row.backupCodes });
			if (performance.now() >= row.expiresAtMonotonic) throw failure();
		});
		await this.published(identity.userId, revokedIds);
	}
	async disablePasskeyMfa(identity: SudoIdentity, acknowledged: boolean) {
		let revokedIds: string[] = [];
		if (!acknowledged) throw failure();
		await this.deps.sudo.transaction(identity, async context => revokedIds = await this.updated(context, {
			passkeyMfaEnabled: false, ...(context.profile.twoFactorEnabled ? {} : { twoFactorBackupSecret: null }),
		}));
		await this.published(identity.userId, revokedIds);
	}
	async removeKey(identity: SudoIdentity, credentialId: string) {
		let revokedIds: string[] = [];
		await this.deps.sudo.transaction(identity, async context => {
			if (!context.keys.some(key => key.id === credentialId)) throw failure();
			const remaining = context.keys.filter(key => key.id !== credentialId);
			if (remaining.length === 0 && context.profile.passwordLoginDisabled) throw lastFactor();
			if (remaining.length === 0 && context.profile.passkeyMfaEnabled && !readMfaPolicy(context.profile, remaining.length).totp) throw lastFactor();
			await context.manager.getRepository(MiUserSecurityKey).delete({ id: credentialId, userId: context.user.id });
			revokedIds = await this.updated(context, remaining.length ? {} : { usePasswordLessLogin: false, passkeyMfaEnabled: false }, remaining);
		});
		await this.published(identity.userId, revokedIds);
	}
	async renameKey(identity: SudoIdentity, credentialId: string, name: string) {
		await this.deps.sudo.transaction(identity, async ({ manager, user }) => {
			if ((await manager.getRepository(MiUserSecurityKey).update({ id: credentialId, userId: user.id }, { name })).affected !== 1) throw failure();
		});
		await this.published(identity.userId);
	}
	async passwordless(identity: SudoIdentity, enabled: boolean) {
		let revokedIds: string[] = [];
		await this.deps.sudo.transaction(identity, async context => {
			if (enabled && !context.profile.usePasswordLessLogin) throw failure();
			if (!enabled && context.profile.passwordLoginDisabled) throw lastFactor();
			if (enabled && (context.keys.length === 0 || context.profile.passkeyMfaEnabled)) throw lastFactor();
			revokedIds = await this.updated(context, { usePasswordLessLogin: enabled });
		});
		await this.published(identity.userId, revokedIds);
	}
	async totpStart(identity: SudoIdentity) {
		return this.deps.sudo.transaction(identity, async context => {
			const secret = new OTPAuth.Secret().base32;
			await context.manager.getRepository(MiUserProfile).update({ userId: context.user.id }, { twoFactorTempSecret: secret });
			const otp = new OTPAuth.TOTP({ secret, digits: 6, label: context.user.username, issuer: this.deps.config.host });
			return { secret, url: otp.toString() };
		});
	}
	async totpComplete(identity: SudoIdentity, token: string) {
		let revokedIds: string[] = [];
		const backupCodes = await this.deps.sudo.transaction(identity, async context => {
			const secret = context.profile.twoFactorTempSecret;
			if (!secret || !await this.deps.totp.validateOtp(context.user.id, secret, token).catch(error => {
				if (error instanceof TotpAuthenticationFailed) throw failure();
				throw error;
			})) throw failure();
			const backupCodes = context.profile.twoFactorBackupSecret?.length ? context.profile.twoFactorBackupSecret : newCodes();
			revokedIds = await this.updated(context, { twoFactorEnabled: true, twoFactorTempSecret: null, twoFactorSecret: secret, twoFactorBackupSecret: backupCodes });
			return backupCodes;
		});
		await this.published(identity.userId, revokedIds);
		return { backupCodes };
	}
	async removeTotp(identity: SudoIdentity, confirmDisableMfa: boolean) {
		let revokedIds: string[] = [];
		await this.deps.sudo.transaction(identity, async context => {
			if (!context.profile.passkeyMfaEnabled && !confirmDisableMfa) throw lastFactor();
			revokedIds = await this.updated(context, { twoFactorEnabled: false, twoFactorSecret: null, twoFactorTempSecret: null,
				...(context.profile.passkeyMfaEnabled ? {} : { twoFactorBackupSecret: null }) });
		});
		await this.published(identity.userId, revokedIds);
	}
	async recoveryCodes(identity: SudoIdentity, regenerate: boolean) {
		const result = await this.deps.sudo.transaction(identity, async context => {
			if (!context.profile.passkeyMfaEnabled && !context.profile.twoFactorEnabled) throw failure();
			if (!regenerate) return { backupCodes: context.profile.twoFactorBackupSecret ?? [] };
			const backupCodes = newCodes();
			await context.manager.getRepository(MiUserProfile).update({ userId: context.user.id }, { twoFactorBackupSecret: backupCodes });
			return { backupCodes };
		});
		if (regenerate) await this.published(identity.userId);
		return result;
	}
}
