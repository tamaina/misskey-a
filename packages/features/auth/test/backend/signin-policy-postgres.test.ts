/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { userInfo } from 'node:os';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import Fastify from 'fastify';
import { afterAll, beforeAll, beforeEach, expect, describe, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { AuthenticationProgressStore } from '../../backend/authentication-progress-store.js';
import { createAuthSessionRouter } from '../../backend/api.implementation.js';
import { registerAuthSessionHttp } from '../../backend/session.http.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { TotpService } from '../../backend/services/TotpService.js';
import { SigninService } from '../../backend/transport/SigninService.js';
import type { AuthSessionDependencies } from '../../backend/api.implementation.js';
import type { FastifyInstance } from 'fastify';
import type { KeyObject } from 'node:crypto';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const redisSocket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const owner = 'signinpolicyuser';
const password = 'synthetic-password';
const relyingParty = { url: 'https://synthetic.example', hostname: 'synthetic.example', host: 'synthetic.example' };

describe.skipIf(!socket || !redisSocket)('HTTP login with real SQL, Redis and signed WebAuthn', () => {
	let webauthn: WebAuthnService;
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let signer: SigninService; let sessions: BrowserSessionService;
	let keyPair: { publicKey: KeyObject; privateKey: KeyObject }; let nextSession = 0;
	const notifications = mockDeep<ConstructorParameters<typeof SigninService>[4]>();
	const profiles = () => db.getRepository(MiUserProfile);
	const keys = () => db.getRepository(MiUserSecurityKey);
	const count = () => db.getRepository(MiBrowserSession).countBy({ userId: owner });
	const request = (path: 'signin-flow' | 'signin-with-passkey', body: object) => app.inject({ method: 'POST', url: `/api/${path}`, payload: body });
	const named = (extra: object = {}) => request('signin-flow', { username: 'synthetic', password, ...extra });

	async function beginNamed() { const response = await named(); expect(response.statusCode).toBe(200); return response.json<{ authRequest: { challenge: string } }>().authRequest.challenge; }

	async function beginAnonymous() { const response = await request('signin-with-passkey', {}); expect(response.statusCode).toBe(200); return response.json<{ context: string; option: { challenge: string } }>(); }

	function assertion(challenge: string, uv = true) {
		const client = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin: relyingParty.url, crossOrigin: false }));
		const authenticator = Buffer.alloc(37); createHash('sha256').update(relyingParty.hostname).digest().copy(authenticator); authenticator[32] = uv ? 5 : 1; authenticator.writeUInt32BE(2, 33);
		const signature = sign('sha256', Buffer.concat([authenticator, createHash('sha256').update(client).digest()]), keyPair.privateKey);
		return { id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: client.toString('base64url'), authenticatorData: authenticator.toString('base64url'), signature: signature.toString('base64url'), userHandle: Buffer.from(owner).toString('base64url') }, clientExtensionResults: {} };
	}

	beforeAll(async () => {
		if (!socket || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Owned PG required');
		if (!redisSocket || !/^\/tmp\/misskey-oauth-[^/]+\/redis\.sock$/.test(redisSocket) || lstatSync(dirname(redisSocket)).uid !== process.getuid?.() || (lstatSync(dirname(redisSocket)).mode & 0o077) !== 0 || !lstatSync(redisSocket).isSocket()) throw new Error('Owned Redis required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize(); const applied = await db.runMigrations(); expect(applied).toHaveLength(366);
		expect(applied.map(migration => migration.name)).toEqual(expect.arrayContaining(['AutoArchiveAnnouncements1791943550568', 'PasskeyMfaPolicy1791969900000', 'OidcIdentities1792300000000', 'AccessTokenExpiry1792300000004']));
		redis = new Redis({ path: redisSocket });
		const sessionIds = { gen: () => `signinpolicy${++nextSession}` };
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], sessionIds);
		signer = new SigninService(mockDeep(), profiles() as ConstructorParameters<typeof SigninService>[1], mockDeep(), mockDeep(), notifications, mockDeep(), mockDeep(), sessions);
		webauthn = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ ...relyingParty, enableIpRateLimit: false }), mockDeep(), redis, keys() as ConstructorParameters<typeof WebAuthnService>[3]);
		const totp = new TotpService(redis, db.getRepository(MiUser) as ConstructorParameters<typeof TotpService>[1], profiles() as ConstructorParameters<typeof TotpService>[2]);
		const deps: AuthSessionDependencies = mockDeep<AuthSessionDependencies>();
		const logger = mockDeep<AuthSessionDependencies['signinFlow']['loggerService']>(); logger.getLogger.mockReturnValue(mockDeep());
		for (const entry of [deps.signinFlow, deps.signinWithPasskey]) {
			entry.config = mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ ...relyingParty, enableIpRateLimit: false });
			entry.usersRepository = db.getRepository(MiUser) as typeof entry.usersRepository;
			entry.userProfilesRepository = profiles() as typeof entry.userProfilesRepository;
			entry.userSecurityKeysRepository = keys() as typeof entry.userSecurityKeysRepository;
			entry.signinService = signer; entry.webAuthnService = webauthn;
			entry.loggerService = logger;
		}
		deps.signinFlow.meta = mockDeep<AuthSessionDependencies['signinFlow']['meta']>({ enableHcaptcha: false, enableMcaptcha: false, enableRecaptcha: false, enableTurnstile: false, enableTestcaptcha: false });
		deps.signinFlow.userAuthService = totp; deps.signinFlow.progressStore = new AuthenticationProgressStore(redis);
		app = Fastify(); await app.register(async api => registerAuthSessionHttp(api, createAuthSessionRouter(deps)), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		vi.restoreAllMocks(); notifications.createNotification.mockClear();
		await db.getRepository(MiUser).delete({ id: owner });
		await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, token: 'syntheticnative1' });
		await profiles().insert({ userId: owner, password: bcrypt.hashSync(password, 4), twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupSecret: ['synthetic-recovery'], passkeyMfaEnabled: true, usePasswordLessLogin: true });
		keyPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); const jwk = keyPair.publicKey.export({ format: 'jwk' });
		const raw = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
		await keys().insert({ id: 'AQID', userId: owner, name: 'Synthetic', publicKey: raw, counter: 0 });
		await redis.flushdb();
	});
	test('named password plus strict UV issues one durable session; challenge replay fails', async () => {
		const challenge = await beginNamed(); const body = { credential: assertion(challenge) };
		const response = await named(body); expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ finished: true, id: owner, i: expect.stringMatching(/^bs_/) });
		expect(await count()).toBe(1); expect((await named(body)).statusCode).toBe(403); expect(await count()).toBe(1);
	});
	test('server progress completes signed second-factor proof without retransmitting password and rejects replay', async () => {
		const begin = await named({ progressMode: 'v1' }); expect(begin.statusCode).toBe(200); const { authenticationProgress, authRequest } = begin.json(); expect(authenticationProgress).toBeDefined();
		const compare = vi.spyOn(bcrypt, 'compare'); compare.mockClear();
		const body = { username: 'synthetic', progressMode: 'v1', authenticationProgress, credential: assertion(authRequest.challenge, false) };
		expect((await request('signin-flow', body)).statusCode).toBe(200); expect(compare).not.toHaveBeenCalled(); expect(await count()).toBe(1);
		expect((await request('signin-flow', body)).statusCode).toBe(403); expect(await count()).toBe(1);
	});
	test('one real server password ticket owns only one competing recovery verifier', async () => {
		const begin = await named({ progressMode: 'v1' }); const body = { username: 'synthetic', progressMode: 'v1', authenticationProgress: begin.json().authenticationProgress, token: 'synthetic-recovery' };
		const replies = await Promise.all([request('signin-flow', body), request('signin-flow', body)]); expect(replies.map(reply => reply.statusCode).sort()).toEqual([200, 403]); expect(await count()).toBe(1);
	});
	test('independent passkey-only returns explicit password flow and does not carry UV into it', async () => {
		const started = await beginAnonymous();
		const response = await request('signin-with-passkey', { context: started.context, credential: assertion(started.option.challenge) });
		expect(response.statusCode).toBe(200); expect(response.json()).toEqual({ passwordFlowRequired: true }); expect(await count()).toBe(0);
		expect((await named()).json()).toMatchObject({ finished: false, next: 'passkey', availableFactors: ['passkey', 'recovery'] }); expect(await count()).toBe(0);
	});
	test('independent policy rejects wrong-password convenience bypass and disabled-TOTP tokens', async () => {
		expect((await named({ password: 'wrong' })).statusCode).toBe(403);
		expect((await named({ token: '123456' })).statusCode).toBe(403); expect(await count()).toBe(0);
	});
	test('real atomic recovery consumes one code and cannot issue twice', async () => {
		const responses = await Promise.all([named({ token: 'synthetic-recovery' }), named({ token: 'synthetic-recovery' })]);
		expect(responses.map(r => r.statusCode).sort()).toEqual([200, 403]); expect(await count()).toBe(1);
		expect((await profiles().findOneByOrFail({ userId: owner })).twoFactorBackupSecret).toEqual([]);
	});
	test('password-only and legacy passwordless remain compatible without promoting orphan keys', async () => {
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: false });
		expect((await named()).json()).toMatchObject({ finished: true });
		const started = await beginAnonymous();
		expect((await request('signin-with-passkey', { context: started.context, credential: assertion(started.option.challenge) })).json()).toHaveProperty('signinResponse.finished', true);
		expect(await count()).toBe(2);
	});
	test('password-verified second-factor UP-only succeeds while passwordless primary still requires UV', async () => {
		const challenge = await beginNamed(); expect((await named({ credential: assertion(challenge, false) })).statusCode).toBe(200);
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: false });
		const started = await beginAnonymous();
		expect((await request('signin-with-passkey', { context: started.context, credential: assertion(started.option.challenge, false) })).statusCode).toBe(403);
		expect(await count()).toBe(1);
	});
	test.each(['missing', 'noTTL', 'oversizedTTL'] as const)('%s rejects before issuance', async mode => {
		const challenge = await beginNamed(); const name = `webauthn:authenticationChallenge:${owner}`;
		if (mode === 'missing') await redis.del(name);
		if (mode === 'noTTL') await redis.persist(name);
		if (mode === 'oversizedTTL') await redis.pexpire(name, 100_000);
		expect((await named({ credential: assertion(challenge) })).statusCode).toBe(403); expect(await count()).toBe(0);
	});
	test.each(['password', 'policy', 'key', 'token', 'suspended', 'deleted', 'deadline'] as const)('%s changing after real proof while waiting for locks prevents issuance', async mode => {
		const challenge = await beginNamed(); const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let pending: ReturnType<typeof named> | undefined;
		try {
			await blocker.manager.getRepository(MiUser).findOneOrFail({ where: { id: owner }, lock: { mode: 'pessimistic_write' } });
			const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = named({ credential: assertion(challenge) });
			await vi.waitFor(async () => { const waiting = await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid]); expect(waiting.length).toBe(1); }, { timeout: 2000, interval: 10 });
			if (mode === 'password') await blocker.manager.update(MiUserProfile, { userId: owner }, { password: 'changed-hash' });
			if (mode === 'policy') await blocker.manager.update(MiUserProfile, { userId: owner }, { passkeyMfaEnabled: false });
			if (mode === 'key') await blocker.manager.delete(MiUserSecurityKey, { id: 'AQID' });
			if (mode === 'token') await blocker.manager.update(MiUser, { id: owner }, { token: 'regenerated' });
			if (mode === 'suspended') await blocker.manager.update(MiUser, { id: owner }, { isSuspended: true });
			if (mode === 'deleted') await blocker.manager.update(MiUser, { id: owner }, { isDeleted: true });
			if (mode === 'deadline') vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
			await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); }
		expect((await pending!).statusCode).toBe(403); expect(await count()).toBe(0); expect(notifications.createNotification).not.toHaveBeenCalled();
	});
	test('enabled TOTP remains a real alternative and a repeated OTP cannot issue again', async () => {
		const secret = 'JBSWY3DPEHPK3PXP'; await profiles().update({ userId: owner }, { twoFactorEnabled: true, twoFactorSecret: secret });
		const token = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
		expect((await named({ token })).statusCode).toBe(200); expect(await count()).toBe(1);
		expect((await named({ token })).statusCode).toBe(403); expect(await count()).toBe(1);
	});
	test('two concurrent real UV verifications cannot overwrite the same original key counter', async () => {
		const first = await beginAnonymous(); const second = await beginAnonymous();
		let release!: () => void; const barrier = new Promise<void>(resolve => { release = resolve; }); let arrived = 0;
		const before = async () => { if (++arrived === 2) release(); await barrier; return 'synthetic-policy'; };
		const results = await Promise.allSettled([
			webauthn.verifySignInWithPasskeyWithProof(first.context, assertion(first.option.challenge), before),
			webauthn.verifySignInWithPasskeyWithProof(second.context, assertion(second.option.challenge), before),
		]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
		const [row] = await db.query('SELECT counter::text AS counter FROM user_security_key WHERE id = $1', ['AQID']);
		expect(row.counter).toBe('2'); expect(await count()).toBe(0);
	});
	test('new-account issuer independently rejects MFA-enabled and stale-token creation results', async () => {
		const account = { id: owner, token: 'syntheticnative1' };
		await expect(sessions.issueForNewAccount(account)).rejects.toThrow('authentication failed');
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: false });
		await expect(sessions.issueForNewAccount({ ...account, token: 'stale' })).rejects.toThrow('authentication failed');
		expect(await count()).toBe(0); expect((await sessions.issueForNewAccount(account)).token).toMatch(/^bs_/); expect(await count()).toBe(1);
	});
	test('deadline after actual insert rolls back its row and sends no notifications', async () => {
		const challenge = await beginNamed(); const issue = sessions.issue.bind(sessions);
		vi.spyOn(sessions, 'issue').mockImplementation(async (...args) => { const result = await issue(...args); vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER); return result; });
		expect((await named({ credential: assertion(challenge) })).statusCode).toBe(403); expect(await count()).toBe(0); expect(notifications.createNotification).not.toHaveBeenCalled();
	});
});
