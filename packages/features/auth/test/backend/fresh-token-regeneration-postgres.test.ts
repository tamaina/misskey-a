/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import type { KeyObject } from 'node:crypto';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { userInfo } from 'node:os';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { nullSuccessToNoContent } from '@features/api/backend/transport/no-content.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import { createAuthRouter } from '../../backend/api.implementation.js';
import type { AuthRouterDependencies } from '../../backend/api.implementation.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { FreshPasskeyReauthentication } from '../../backend/fresh-passkey-reauthentication.js';
import { FreshReauthenticationStore } from '../../backend/fresh-reauthentication-store.js';
import type { UserProfilesRepository, UserSecurityKeysRepository, MiAccessToken } from '@features/persistence/backend/repositories/models.js';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const redisSocket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const owner = 'freshtokenuser';
const oldPassword = 'synthetic-old-password';
const relyingParty = { url: 'https://synthetic.example', hostname: 'synthetic.example' };

describe.skipIf(!socket || !redisSocket)('HTTP fresh token regeneration with real SQL, Redis and signed WebAuthn', () => {
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let authenticate: AuthenticateService;
	let sessions: BrowserSessionService; let current: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let other: Awaited<ReturnType<BrowserSessionService['issue']>>; let unrelated: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let keyPair: { publicKey: KeyObject; privateKey: KeyObject }; let user: MiLocalUser; let nextSession = 0;
	const events = mockDeep<AuthRouterDependencies['i/regenerate-token/passkey/complete']['globalEventService']>();
	const native = async () => (await db.getRepository(MiUser).findOneByOrFail({ id: owner })).token;
	const profile = () => db.getRepository(MiUserProfile).findOneByOrFail({ userId: owner });
	const request = (phase: 'start' | 'complete', body: object, token = current.token) => app.inject({ method: 'POST', url: `/api/i/regenerate-token/passkey/${phase}`, headers: { authorization: `Bearer ${token}` }, payload: body });

	async function begin() { const response = await request('start', { currentPassword: oldPassword }); expect(response.statusCode).toBe(200); return response.json<{ ticket: string; options: { challenge: string } }>(); }

	function assertion(challenge: string, uv = true, id = 'AQID') {
		const client = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge, origin: relyingParty.url, crossOrigin: false }));
		const authenticator = Buffer.alloc(37); createHash('sha256').update(relyingParty.hostname).digest().copy(authenticator); authenticator[32] = uv ? 5 : 1; authenticator.writeUInt32BE(2, 33);
		const signature = sign('sha256', Buffer.concat([authenticator, createHash('sha256').update(client).digest()]), keyPair.privateKey);
		return { id, rawId: id, type: 'public-key', response: { clientDataJSON: client.toString('base64url'), authenticatorData: authenticator.toString('base64url'), signature: signature.toString('base64url'), userHandle: Buffer.from(owner).toString('base64url') }, clientExtensionResults: {} };
	}

	beforeAll(async () => {
		if (!socket || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Owned PG required');
		if (!redisSocket || !/^\/tmp\/misskey-oauth-[^/]+\/redis\.sock$/.test(redisSocket) || lstatSync(dirname(redisSocket)).uid !== process.getuid?.() || (lstatSync(dirname(redisSocket)).mode & 0o077) !== 0 || !lstatSync(redisSocket).isSocket()) throw new Error('Owned Redis required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize();
		const migrations = await db.runMigrations();
		expect(migrations).toHaveLength(363);
		expect(migrations.map(migration => migration.name)).toEqual(expect.arrayContaining(['AutoArchiveAnnouncements1791943550568', 'PasskeyMfaPolicy1791969900000', 'OidcIdentities1792300000000', 'AccessTokenExpiry1792300000004']));
		redis = new Redis({ path: redisSocket });
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], { gen: () => `freshtokensession${++nextSession}` });
		const cache = mockDeep<ConstructorParameters<typeof AuthenticateService>[3]>();
		cache.localUserByNativeTokenCache.fetch.mockImplementation(async () => user);
		cache.localUserByIdCache.fetch.mockImplementation(async () => user);
		const tokens = mockDeep<ConstructorParameters<typeof AuthenticateService>[1]>(); tokens.findOne.mockImplementation(async () => mockDeep<MiAccessToken>({ userId: owner, appId: null, permission: ['write:account'] }));
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], tokens, mockDeep(), cache, sessions);
		const fresh = new FreshPasskeyReauthentication(new FreshReauthenticationStore(redis), sessions, db.getRepository(MiUserProfile) as unknown as UserProfilesRepository, db.getRepository(MiUserSecurityKey) as unknown as UserSecurityKeysRepository, relyingParty);
		const deps: AuthRouterDependencies = mockDeep<AuthRouterDependencies>();
		deps['i/regenerate-token/passkey/start'] = deps['i/regenerate-token/passkey/complete'] = { db, freshReauthentication: fresh, browserSessionService: sessions, globalEventService: events };
		deps['i/change-password/passkey/start'] = deps['i/change-password/passkey/complete'] = { db, freshReauthentication: fresh };
		deps['i/regenerate-token'] = { db, browserSessionService: sessions, globalEventService: events, usersRepository: db.getRepository(MiUser) as AuthRouterDependencies['i/regenerate-token']['usersRepository'], userProfilesRepository: db.getRepository(MiUserProfile) as AuthRouterDependencies['i/regenerate-token']['userProfilesRepository'], userAuthService: mockDeep() };
		const handler = new OpenAPIHandler(createAuthRouter(deps), { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(), context: req => ({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: {}, services: { authenticate: token => authenticate.authenticate(token), limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } }),
		}), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); authenticate?.onApplicationShutdown(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		vi.restoreAllMocks(); vi.clearAllMocks(); await redis.flushdb();
		await db.getRepository(MiUser).delete({ id: owner }); await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, isSuspended: false, isDeleted: false, token: 'syntheticnative1' });
		user = await db.getRepository(MiUser).findOneByOrFail({ id: owner }) as MiLocalUser;
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync(oldPassword, 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false });
		keyPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); const jwk = keyPair.publicKey.export({ format: 'jwk' });
		const raw = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
		await db.getRepository(MiUserSecurityKey).insert({ id: 'AQID', userId: owner, name: 'Synthetic', publicKey: raw, counter: 0 });
		current = await sessions.issue(owner); other = await sessions.issue(owner);
		await db.getRepository(MiUser).delete({ id: 'unrelatedtokenuser' });
		await db.getRepository(MiUser).insert({ id: 'unrelatedtokenuser', username: 'unrelated', usernameLower: 'unrelated', host: null, token: 'unrelatednative1' });
		unrelated = await sessions.issue('unrelatedtokenuser');
	});

	async function expectUnchanged() {
		expect(await native()).toBe('syntheticnative1');
		expect(await sessions.isActive(current.session.id, owner)).toBe(true);
		expect(await sessions.isActive(other.session.id, owner)).toBe(true);
		expect(events.publishInternalEvent).not.toHaveBeenCalled(); expect(events.publishMainStream).not.toHaveBeenCalled();
	}

	test.each([{ independent: false, totp: false }, { independent: false, totp: true }, { independent: true, totp: false }, { independent: true, totp: true }])('signed strict UV commits native rotation and all owned revocations, policy %j', async ({ independent, totp }) => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: independent, twoFactorEnabled: totp, twoFactorSecret: totp ? 'synthetic-secret' : null });
		const started = await begin(); const body = { ticket: started.ticket, credential: assertion(started.options.challenge) };
		const result = await request('complete', body); expect(result.statusCode).toBe(204); expect(result.body).toBe('');
		expect(await native()).not.toBe('syntheticnative1');
		expect(await sessions.isActive(current.session.id, owner)).toBe(false); expect(await sessions.isActive(other.session.id, owner)).toBe(false);
		expect(await sessions.isActive(unrelated.session.id, 'unrelatedtokenuser')).toBe(true);
		expect((await profile()).passkeyMfaEnabled).toBe(independent); expect((await profile()).twoFactorEnabled).toBe(totp); expect(await bcrypt.compare(oldPassword, (await profile()).password!)).toBe(true);
		expect(events.publishInternalEvent).toHaveBeenCalledTimes(2); expect(events.publishMainStream).toHaveBeenCalledOnce();
		const committed = await native(); expect((await request('complete', body)).statusCode).toBe(500); expect(await native()).toBe(committed);
		expect(events.publishInternalEvent).toHaveBeenCalledTimes(2);
	});
	test.each(['legacy', 'oauth', 'wrong-password'] as const)('%s cannot acquire authority', async mode => {
		const token = mode === 'legacy' ? 'syntheticnative1' : mode === 'oauth' ? 'synthetic-oauth-token' : current.token;
		expect((await request('start', { currentPassword: mode === 'wrong-password' ? 'wrong' : oldPassword }, token)).statusCode).toBe(mode === 'oauth' ? 400 : 403);
		await expectUnchanged();
	});
	test('a different session cannot burn the bound session challenge', async () => {
		const started = await begin(); const body = { ticket: started.ticket, credential: assertion(started.options.challenge) };
		expect((await request('complete', body, other.token)).statusCode).toBe(403); await expectUnchanged();
		expect((await request('complete', body)).statusCode).toBe(204);
	});
	test.each(['expired', 'no-uv', 'key-removed'] as const)('%s never rotates or revokes', async mode => {
		const started = await begin();
		if (mode === 'expired') await redis.pexpire(`fresh-reauth:v1:${createHash('sha256').update(started.ticket).digest('hex')}`, 0);
		if (mode === 'key-removed') await db.getRepository(MiUserSecurityKey).delete({ id: 'AQID' });
		expect((await request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge, mode !== 'no-uv') })).statusCode).toBe(403);
		await expectUnchanged();
	});
	test.each(['change-password', 'regenerate-token'] as const)('%s ticket cannot cross the operation boundary', async origin => {
		const isToken = origin === 'regenerate-token';
		const started = isToken ? await begin() : (await app.inject({ method: 'POST', url: '/api/i/change-password/passkey/start', headers: { authorization: `Bearer ${current.token}` }, payload: { currentPassword: oldPassword } })).json<{ ticket: string; options: { challenge: string } }>();
		const body = { ticket: started.ticket, credential: assertion(started.options.challenge) };
		const change = () => app.inject({ method: 'POST', url: '/api/i/change-password/passkey/complete', headers: { authorization: `Bearer ${current.token}` }, payload: { ...body, newPassword: 'synthetic-new-password' } });
		expect((await (isToken ? change() : request('complete', body))).statusCode).toBe(403); await expectUnchanged();
		expect((await (isToken ? request('complete', body) : change())).statusCode).toBe(204);
	});
	test.each(['policy', 'revocation', 'deadline'] as const)('%s while waiting for a row lock prevents rotation', async mode => {
		const started = await begin(); const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let pending: ReturnType<typeof request> | undefined;
		try {
			await blocker.manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: owner }, lock: { mode: 'pessimistic_write' } });
			const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge) });
			await vi.waitFor(async () => { const waiting = await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid]); expect(waiting.length).toBe(1); }, { timeout: 1500, interval: 10 });
			if (mode === 'policy') await blocker.manager.update(MiUserProfile, { userId: owner }, { passkeyMfaEnabled: true });
			if (mode === 'revocation') await sessions.revokeOwned(owner, current.session.id);
			if (mode === 'deadline') vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
			await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); }
		expect((await pending!).statusCode).toBe(403); expect(await native()).toBe('syntheticnative1'); expect(await sessions.isActive(other.session.id, owner)).toBe(true);
		expect(events.publishInternalEvent).not.toHaveBeenCalled();
	});
	test.each(['write-rejection', 'expiry-after-write'] as const)('%s rolls back token and every revocation', async kind => {
		const started = await begin(); const revoke = sessions.revokeAllOwned.bind(sessions);
		vi.spyOn(sessions, 'revokeAllOwned').mockImplementation(async (...args) => {
			await revoke(...args);
			if (kind === 'write-rejection') throw new Error('Synthetic failed transaction');
			vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
		});
		expect((await request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge) })).statusCode).toBe(403);
		await expectUnchanged();
	});
	test('two sessions with distinct verified keys can commit only one rotation', async () => {
		const key = await db.getRepository(MiUserSecurityKey).findOneByOrFail({ id: 'AQID' });
		await db.getRepository(MiUserSecurityKey).insert({ ...key, id: 'AQIE' });
		const first = await begin(); const second = (await request('start', { currentPassword: oldPassword }, other.token)).json<{ ticket: string; options: { challenge: string } }>();
		const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let pending: Promise<Awaited<ReturnType<typeof request>>[]> | undefined;
		let results: Awaited<ReturnType<typeof request>>[];
		try {
			await blocker.manager.getRepository(MiUser).findOneOrFail({ where: { id: owner }, lock: { mode: 'pessimistic_write' } });
			pending = Promise.all([request('complete', { ticket: first.ticket, credential: assertion(first.options.challenge) }), request('complete', { ticket: second.ticket, credential: assertion(second.options.challenge, true, 'AQIE') }, other.token)]);
			await vi.waitFor(async () => { const waiting = await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = \'Lock\' AND cardinality(pg_blocking_pids(pid)) > 0'); expect(waiting.length).toBe(2); }, { timeout: 1500, interval: 10 });
			await blocker.commitTransaction(); results = await pending;
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await pending?.catch(() => {}); }

		expect(results!.map(result => result.statusCode).sort()).toEqual([204, 403]); expect(events.publishMainStream).toHaveBeenCalledOnce();
		expect(await sessions.isActive(current.session.id, owner)).toBe(false); expect(await sessions.isActive(other.session.id, owner)).toBe(false);
	});

	test('legacy native credential must match the current token even when an old cache entry authenticates', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: false });
		await db.getRepository(MiUser).update({ id: owner }, { token: 'syntheticnative2' });
		const result = await app.inject({ method: 'POST', url: '/api/i/regenerate-token', headers: { authorization: 'Bearer syntheticnative1' }, payload: { password: oldPassword } });
		expect(result.statusCode).toBe(500); expect(await native()).toBe('syntheticnative2');
		expect(await sessions.isActive(current.session.id, owner)).toBe(true); expect(events.publishInternalEvent).not.toHaveBeenCalled();
	});
	test('legacy independent policy refuses the mutation before any revocation', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: true });
		const result = await app.inject({ method: 'POST', url: '/api/i/regenerate-token', headers: { authorization: `Bearer ${current.token}` }, payload: { password: oldPassword, token: 'synthetic-code' } });
		expect(result.statusCode).toBe(500); await expectUnchanged();
	});
	test('legacy session revocation while its authenticated request waits prevents every mutation', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: false });
		const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let pending: ReturnType<typeof request> | undefined;
		try {
			await blocker.manager.getRepository(MiUser).findOneOrFail({ where: { id: owner }, lock: { mode: 'pessimistic_write' } });
			const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = app.inject({ method: 'POST', url: '/api/i/regenerate-token', headers: { authorization: `Bearer ${current.token}` }, payload: { password: oldPassword } });
			await vi.waitFor(async () => { const waiting = await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid]); expect(waiting.length).toBe(1); }, { timeout: 1500, interval: 10 });
			await sessions.revokeOwned(owner, current.session.id); await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); }
		expect((await pending!).statusCode).toBe(500); expect(await native()).toBe('syntheticnative1');
		expect(await sessions.isActive(other.session.id, owner)).toBe(true); expect(events.publishInternalEvent).not.toHaveBeenCalled();
	});
});
