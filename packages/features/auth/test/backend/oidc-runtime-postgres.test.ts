/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { beforeAll, beforeEach, afterEach, afterAll, describe, test, expect, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUsedUsername } from '@features/users/backend/models/UsedUsername.js';
import { localUsernameSchema, passwordSchema } from '@features/users/backend/user-validation.schema.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiOidcProvider } from '../../backend/models/OidcProvider.js';
import { MiOidcIdentity } from '../../backend/models/OidcIdentity.js';
import { OidcRuntime } from '../../backend/oidc-runtime.js';
import type { OidcRuntimeDependencies } from '../../backend/oidc-runtime.js';
import { SudoService } from '../../backend/sudo.js';
import { FreshReauthenticationStore } from '../../backend/fresh-reauthentication-store.js';
import { FreshPasskeyReauthentication } from '../../backend/fresh-passkey-reauthentication.js';
import { createOidcRouter } from '../../backend/oidc-api.js';
import { SigninService } from '../../backend/transport/SigninService.js';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import { SignupService } from '../../backend/services/SignupService.js';
import { TotpService } from '../../backend/services/TotpService.js';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { nullSuccessToNoContent } from '@features/api/backend/transport/no-content.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import { syntheticOidcProvider } from './fixtures/synthetic-oidc-provider.js';

const pgSocket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const redisSocket = process.env.MISSKEY_OIDC_REDIS_SOCKET;
const owner = 'oidcowner'; const instance = { url: 'https://synthetic.example', hostname: 'synthetic.example' };
const totpSecret = 'JBSWY3DPEHPK3PXP';

describe.skipIf(!pgSocket || !redisSocket)('OIDC actual HTTPS IdP, HTTP API, PostgreSQL, Redis and session issuer', () => {
	let db: DataSource; let redis: Redis; let idp: Awaited<ReturnType<typeof syntheticOidcProvider>>; let app: FastifyInstance;
	let runtime: OidcRuntime; let ownSudo: SudoService; let sessions: BrowserSessionService; let authenticate: AuthenticateService;
	let current: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let other: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let keys: { publicKey: KeyObject; privateKey: KeyObject }; let sequence = 0;
	const ids = mockDeep<IdService>();
	ids.gen.mockImplementation(() => `oidcfixture${++sequence}`);
	const email = mockDeep<OidcRuntimeDependencies['email']>();
	const meta = mockDeep<OidcRuntimeDependencies['meta']>({ rootUserId: owner, disableRegistration: false, emailRequiredForSignup: true, termsOfServiceUrl: null, serverRules: [], preservedUsernames: [], prohibitedWordsForNameOfUser: [], enableHcaptcha: false, enableRecaptcha: false, enableMcaptcha: false, enableTurnstile: false, enableTestcaptcha: false });
	let sentCode = '';
	const request = (name: string, body: object, cookie?: string, token?: string) => app.inject({ method: 'POST', url: `/api/${name}`, headers: { origin: instance.url, ...(cookie ? { cookie } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, payload: body });
	const cookieOf = (response: Awaited<ReturnType<typeof request>>) => String(response.headers['set-cookie']).split(';')[0];

	async function begin(token?: string) {
		const response = await request(token ? 'i/oidc/link/start' : 'oidc/start', { providerId: 'syntheticprovider' }, undefined, token);
		expect(response.statusCode).toBe(200); const authorized = await idp.authorize(response.json<{ url: string }>().url);
		return { ...authorized, cookie: cookieOf(response) };
	}

	async function callback(started: Awaited<ReturnType<typeof begin>>) {
		return request('oidc/callback', { providerId: 'syntheticprovider', state: started.state, code: started.code }, started.cookie);
	}

	async function loginFlow() {
		const started = await begin(); const response = await callback(started); expect(response.statusCode).toBe(200);
		return { ticket: response.json<{ ticket: string }>().ticket, flow: response.json<{ flow: { next: string; factors: string[]; options?: { challenge: string } } }>().flow, cookie: cookieOf(response) };
	}

	const count = () => db.getRepository(MiBrowserSession).countBy({ userId: owner });

	function assertion(challenge: string, uv = true) {
		const client = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin: instance.url, crossOrigin: false }));
		const authenticator = Buffer.alloc(37); createHash('sha256').update(instance.hostname).digest().copy(authenticator); authenticator[32] = uv ? 5 : 1; authenticator.writeUInt32BE(2, 33);
		return { id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: client.toString('base64url'), authenticatorData: authenticator.toString('base64url'), signature: sign('sha256', Buffer.concat([authenticator, createHash('sha256').update(client).digest()]), keys.privateKey).toString('base64url'), userHandle: Buffer.from(owner).toString('base64url') }, clientExtensionResults: {} };
	}

	beforeAll(async () => {
		if (!pgSocket || !dirname(pgSocket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(pgSocket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Owned PostgreSQL required');
		if (!redisSocket || !/^\/tmp\/misskey-oidc-fixture-[^/]+\/redis\.sock$/.test(redisSocket) || lstatSync(dirname(redisSocket)).uid !== process.getuid?.() || !lstatSync(redisSocket).isSocket()) throw new Error('Owned Redis required');
		idp = await syntheticOidcProvider(); redis = new Redis({ path: redisSocket });
		db = new DataSource({ type: 'postgres', host: pgSocket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize(); const migrations = await db.runMigrations(); expect(migrations.map(row => row.name)).toContain('OidcIdentities1792300000000');
		const profiles = db.getRepository(MiUserProfile);
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], ids);
		const signer = new SigninService(mockDeep(), profiles as ConstructorParameters<typeof SigninService>[1], mockDeep(), mockDeep(), mockDeep(), ids, mockDeep(), sessions);
		const userEntity = mockDeep<ConstructorParameters<typeof SignupService>[6]>(); userEntity.validateLocalUsername.mockImplementation(value => v.safeParse(localUsernameSchema, value).success); userEntity.validatePassword.mockImplementation(value => v.safeParse(passwordSchema, value).success);
		const utility = mockDeep<ConstructorParameters<typeof SignupService>[4]>(); utility.toPunyNullable.mockReturnValue(null); utility.isKeyWordIncluded.mockReturnValue(false);
		const signup = new SignupService(db, meta, db.getRepository(MiUser) as ConstructorParameters<typeof SignupService>[2], db.getRepository(MiUsedUsername) as ConstructorParameters<typeof SignupService>[3], utility, mockDeep(), userEntity, ids, mockDeep(), mockDeep(), mockDeep());
		const totp = new TotpService(redis, db.getRepository(MiUser) as ConstructorParameters<typeof TotpService>[1], profiles as ConstructorParameters<typeof TotpService>[2]);
		const webauthn = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>(instance), meta, redis, db.getRepository(MiUserSecurityKey) as ConstructorParameters<typeof WebAuthnService>[3]);
		const fresh = new FreshPasskeyReauthentication(new FreshReauthenticationStore(redis), sessions,
			profiles as ConstructorParameters<typeof FreshPasskeyReauthentication>[2],
			db.getRepository(MiUserSecurityKey) as ConstructorParameters<typeof FreshPasskeyReauthentication>[3], instance);
		ownSudo = new SudoService(db, fresh, totp);
		runtime = new OidcRuntime({ db, redis, config: { ...instance, allowedPrivateNetworks: ['127.0.0.1/32'] }, meta, idService: ids, email, roles: mockDeep(), signup, signin: signer, sessions, totp, webauthn, captcha: mockDeep(), network: idp.network, local: ownSudo });
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], mockDeep(), mockDeep(), mockDeep(), sessions);
		const factory = new ApiExecutionContextFactory(mockDeep(), meta, authenticate, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep());
		const handler = new OpenAPIHandler(createOidcRouter(runtime, instance.url), { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, { maxFileSize: 1024, runSpan: (_name, run) => run(), context: (req, reply, name) => {
			const context = factory.create({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: req.headers, response: { header: (key, value) => { reply.header(key, value); } } }, name);
			return { ...context, services: { ...context.services, limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } };
		} }), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); authenticate?.onApplicationShutdown(); await idp?.close(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	afterEach(async () => { await new Promise<void>(resolve => setImmediate(resolve)); if (db?.isInitialized) await db.query('SELECT 1'); });
	beforeEach(async () => {
		vi.restoreAllMocks(); vi.clearAllMocks(); sentCode = ''; await redis.flushdb(); idp.options.subject = 'synthetic-subject'; idp.options.failure = 'none'; meta.disableRegistration = false;
		email.validateEmailForAccount.mockResolvedValue({ available: true, reason: null }); email.sendEmail.mockImplementation(async (_address, _subject, _html, text) => { sentCode = String(text).split('Verification code: ')[1]; });
		await db.getRepository(MiOidcIdentity).clear(); await db.getRepository(MiOidcProvider).delete({ id: 'syntheticprovider' });
		await db.getRepository(MiUser).delete({ id: owner }); await db.getRepository(MiUser).insert({ id: owner, username: owner, usernameLower: owner, host: null, token: 'syntheticnative1', isDeleted: false, isSuspended: false });
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: false, passkeyMfaEnabled: false, twoFactorSecret: null, email: 'same@example.test', emailVerified: true });
		await db.getRepository(MiOidcProvider).insert({ id: 'syntheticprovider', name: 'Synthetic IdP', issuer: idp.issuer, clientId: 'synthetic-client', clientSecret: 'synthetic-secret', enabled: true, version: 'v'.repeat(43) });
		await db.getRepository(MiOidcIdentity).insert({ id: 'syntheticidentity', userId: owner, providerId: 'syntheticprovider', issuer: idp.issuer, subject: idp.options.subject, createdAt: new Date() });
		current = await sessions.issue(owner); other = await sessions.issue(owner);
		keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); const jwk = keys.publicKey.export({ format: 'jwk' });
		await db.getRepository(MiUserSecurityKey).insert({ id: 'AQID', userId: owner, name: 'Synthetic', publicKey: Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url'), counter: 0 });
		expect(await ownSudo.begin({ userId: owner, browserSession: { id: current.session.id, userId: owner } }, 'synthetic-password')).toMatchObject({ status: 'elevated' });
	});
	test('real signed OIDC primary issues an individual session only at explicit completion; replay is rejected', async () => {
		const flow = await loginFlow(); expect(flow.flow).toMatchObject({ next: 'login', factors: [] }); expect(await count()).toBe(2);
		const response = await request('oidc/login', { ticket: flow.ticket }, flow.cookie); expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ finished: true, id: owner, i: expect.stringMatching(/^bs_/) }); expect(await count()).toBe(3);
		expect((await request('oidc/login', { ticket: flow.ticket }, flow.cookie)).statusCode).toBe(400); expect(await count()).toBe(3);
	});
	test.each(['nonce', 'issuer', 'signature', 'http'] as const)('IdP %s failure cannot create a continuation or session', async failure => {
		const started = await begin(); idp.options.failure = failure; const response = await callback(started); expect(response.statusCode).toBe(400); expect(response.body).not.toContain('synthetic-secret'); expect(await count()).toBe(2); expect((await callback(started)).statusCode).toBe(400);
	});
	test('another browser cannot consume a callback and the owning browser can retry', async () => {
		const started = await begin(); expect((await request('oidc/callback', { providerId: 'syntheticprovider', state: started.state, code: started.code })).statusCode).toBe(400); expect((await callback(started)).statusCode).toBe(200);
	});
	test.each(['totp', 'recovery', 'passkey', 'passkey-no-uv'] as const)('OIDC primary does not bypass local %s', async factor => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: factor === 'totp', twoFactorSecret: factor === 'totp' ? totpSecret : null, twoFactorBackupSecret: ['synthetic-recovery'], passkeyMfaEnabled: factor !== 'totp' });
		const flow = await loginFlow(); expect(flow.flow.factors).toContain(factor === 'passkey-no-uv' ? 'passkey' : factor);
		const proof = factor.startsWith('passkey') ? { credential: assertion(flow.flow.options!.challenge, factor !== 'passkey-no-uv') } : { token: factor === 'recovery' ? 'synthetic-recovery' : new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(totpSecret), digits: 6, period: 30 }).generate() };
		expect((await request('oidc/login', { ticket: flow.ticket, ...proof }, flow.cookie)).statusCode).toBe(200); expect(await count()).toBe(3);
	});
	test.each(['missing-factor', 'policy', 'provider', 'suspended'] as const)('%s after the external proof prevents session issuance', async failure => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: true }); const flow = await loginFlow();
		if (failure === 'policy') await db.getRepository(MiUserProfile).update({ userId: owner }, { password: 'changed' });
		if (failure === 'provider') await db.getRepository(MiOidcProvider).update({ id: 'syntheticprovider' }, { enabled: false });
		if (failure === 'suspended') await db.getRepository(MiUser).update({ id: owner }, { isSuspended: true });
		expect((await request('oidc/login', { ticket: flow.ticket, ...(failure !== 'missing-factor' ? { credential: assertion(flow.flow.options!.challenge) } : {}) }, flow.cookie)).statusCode).toBe(400); expect(await count()).toBe(2);
	});
	test('same email on a new external subject enters onboarding, requires local email proof, and creates one account', async () => {
		idp.options.subject = 'new-subject'; const flow = await loginFlow(); expect(flow.flow.next).toBe('onboarding');
		const username = `oidcnew${++sequence}`;
		expect((await request('oidc/onboarding', { ticket: flow.ticket, username, password: 'synthetic-new-password', email: 'new@example.test', agree: true }, flow.cookie)).statusCode).toBe(204); expect(sentCode).toMatch(/^[a-f0-9]{32}$/);
		expect(await db.getRepository(MiUser).existsBy({ username })).toBe(false);
		expect((await request('oidc/onboarding/verify', { ticket: flow.ticket, code: '0'.repeat(32) }, flow.cookie)).statusCode).toBe(400);
		const response = await request('oidc/onboarding/verify', { ticket: flow.ticket, code: sentCode }, flow.cookie); expect(response.statusCode).toBe(200);
		const created = await db.getRepository(MiUser).findOneByOrFail({ username }); expect((await db.getRepository(MiUserProfile).findOneByOrFail({ userId: created.id })).emailVerified).toBe(true);
		expect(await db.getRepository(MiOidcIdentity).findOneBy({ issuer: idp.issuer, subject: 'new-subject' })).toMatchObject({ userId: created.id });
		expect((await request('oidc/onboarding/verify', { ticket: flow.ticket, code: sentCode }, flow.cookie)).statusCode).toBe(400);
	});
	test('cancellation burns the continuation and a fresh authorization succeeds', async () => {
		const flow = await loginFlow(); expect((await request('oidc/cancel', { ticket: flow.ticket }, flow.cookie)).statusCode).toBe(204); expect((await request('oidc/login', { ticket: flow.ticket }, flow.cookie)).statusCode).toBe(400);
		const fresh = await loginFlow(); expect((await request('oidc/login', { ticket: fresh.ticket }, fresh.cookie)).statusCode).toBe(200);
	});
	test('concurrent callback and completion each have one verifier/session owner', async () => {
		const started = await begin(); const callbacks = await Promise.all([callback(started), callback(started)]);
		expect(callbacks.map(response => response.statusCode).sort()).toEqual([200, 400]);
		const accepted = callbacks.find(response => response.statusCode === 200)!;
		const ticket = accepted.json<{ ticket: string }>().ticket; const cookie = cookieOf(accepted);
		const finished = await Promise.all([request('oidc/login', { ticket }, cookie), request('oidc/login', { ticket }, cookie)]);
		expect(finished.map(response => response.statusCode).sort()).toEqual([200, 400]); expect(await count()).toBe(3);
	});
	test('unlink/relink cannot revive an older external identity proof', async () => {
		const flow = await loginFlow(); await db.getRepository(MiOidcIdentity).delete({ id: 'syntheticidentity' });
		await db.getRepository(MiOidcIdentity).insert({ id: 'replacementidentity', userId: owner, providerId: 'syntheticprovider', issuer: idp.issuer, subject: idp.options.subject, createdAt: new Date() });
		expect((await request('oidc/login', { ticket: flow.ticket }, flow.cookie)).statusCode).toBe(400); expect(await count()).toBe(2);
	});
	test('competing local owners cannot attach one external identity to two accounts', async () => {
		await db.getRepository(MiOidcIdentity).delete({ id: 'syntheticidentity' });
		const secondOwner = `oidcother${++sequence}`;
		await db.getRepository(MiUser).insert({ id: secondOwner, username: secondOwner, usernameLower: secondOwner, host: null, token: 'syntheticnative2' });
		await db.getRepository(MiUserProfile).insert({ userId: secondOwner, password: bcrypt.hashSync('synthetic-second-password', 4), twoFactorEnabled: false, passkeyMfaEnabled: false }); const second = await sessions.issue(secondOwner);
		expect(await ownSudo.begin({ userId: secondOwner, browserSession: { id: second.session.id, userId: secondOwner } }, 'synthetic-second-password')).toMatchObject({ status: 'elevated' });
		const a = await callback(await begin(current.token)); const b = await callback(await begin(second.token));
		const outcomes = await Promise.all([request('i/oidc/link/complete', { ticket: a.json<{ ticket: string }>().ticket, agree: true }, cookieOf(a), current.token), request('i/oidc/link/complete', { ticket: b.json<{ ticket: string }>().ticket, agree: true }, cookieOf(b), second.token)]);
		expect(outcomes.map(response => response.statusCode).sort()).toEqual([204, 400]);
		expect(await db.getRepository(MiOidcIdentity).countBy({ issuer: idp.issuer, subject: idp.options.subject })).toBe(1);
	});
	test('onboarding write failure rolls back account, profile, identity and individual session together', async () => {
		idp.options.subject = 'rollback-subject'; const flow = await loginFlow(); const username = `oidcroll${++sequence}`;
		expect((await request('oidc/onboarding', { ticket: flow.ticket, username, password: 'synthetic-new-password', email: 'rollback@example.test', agree: true }, flow.cookie)).statusCode).toBe(204);
		const subscriber = { listenTo: () => MiBrowserSession, afterInsert: () => { throw new Error('Synthetic post-write failure'); } }; db.subscribers.push(subscriber);
		try { expect((await request('oidc/onboarding/verify', { ticket: flow.ticket, code: sentCode }, flow.cookie)).statusCode).toBe(400); } finally { db.subscribers.splice(db.subscribers.indexOf(subscriber), 1); }
		expect(await db.getRepository(MiUser).existsBy({ username })).toBe(false); expect(await db.getRepository(MiUsedUsername).existsBy({ username })).toBe(false);
		expect(await db.getRepository(MiOidcIdentity).existsBy({ issuer: idp.issuer, subject: 'rollback-subject' })).toBe(false); expect(await count()).toBe(2);
		expect((await request('oidc/onboarding/verify', { ticket: flow.ticket, code: sentCode }, flow.cookie)).statusCode).toBe(400);
	});
	test('an individual session without local elevation cannot start a link ceremony', async () => {
		expect(await ownSudo.status({ userId: owner, browserSession: { id: other.session.id, userId: owner } })).toEqual({ active: false, expiresAt: null });
		const response = await request('i/oidc/link/start', { providerId: 'syntheticprovider' }, undefined, other.token);
		expect(response.statusCode).toBe(400); expect(response.headers['set-cookie']).toBeUndefined();
		expect(await db.getRepository(MiOidcIdentity).countBy({ userId: owner })).toBe(1);
	});
	test('link is explicit, session-bound, unique, and can be unlinked through local authorization', async () => {
		idp.options.subject = 'linked-later'; await db.getRepository(MiOidcIdentity).delete({ id: 'syntheticidentity' });
		const started = await begin(current.token); const response = await callback(started); expect(response.statusCode).toBe(200); const ticket = response.json<{ ticket: string }>().ticket; const cookie = cookieOf(response);
		expect((await request('i/oidc/link/complete', { ticket, agree: true }, cookie, other.token)).statusCode).toBe(400);
		// A wrong local session cannot burn the owner's explicit link ceremony.
		expect((await request('i/oidc/link/complete', { ticket, agree: true }, cookie, current.token)).statusCode).toBe(204);
		const link = await db.getRepository(MiOidcIdentity).findOneByOrFail({ issuer: idp.issuer, subject: 'linked-later' }); expect(link.userId).toBe(owner);
		expect((await request('i/oidc/unlink', { id: link.id }, undefined, current.token)).statusCode).toBe(204); expect(await db.getRepository(MiOidcIdentity).existsBy({ id: link.id })).toBe(false);
	});
});
