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
const owner = 'freshpassworduser';
const oldPassword = 'synthetic-old-password';
const newPassword = 'synthetic-new-password';
const relyingParty = { url: 'https://synthetic.example', hostname: 'synthetic.example' };

describe.skipIf(!socket || !redisSocket)('HTTP fresh password change with real SQL, Redis and signed WebAuthn', () => {
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let authenticate: AuthenticateService;
	let sessions: BrowserSessionService; let current: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let other: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let keyPair: { publicKey: KeyObject; privateKey: KeyObject }; let user: MiLocalUser; let nextSession = 0;
	const profile = () => db.getRepository(MiUserProfile).findOneByOrFail({ userId: owner });
	const request = (phase: 'start' | 'complete', body: object, token = current.token) => app.inject({ method: 'POST', url: `/api/i/change-password/passkey/${phase}`, headers: { authorization: `Bearer ${token}` }, payload: body });

	async function begin() { const response = await request('start', { currentPassword: oldPassword }); expect(response.statusCode).toBe(200); return response.json<{ ticket: string; options: { challenge: string } }>(); }

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
		await db.initialize();
		const migrations = await db.runMigrations();
		expect(migrations).toHaveLength(360);
		expect(migrations.map(migration => migration.name)).toEqual(expect.arrayContaining(['AutoArchiveAnnouncements1791943550568', 'PasskeyMfaPolicy1791969900000']));
		redis = new Redis({ path: redisSocket });
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], { gen: () => `freshsession${++nextSession}` });
		const cache = mockDeep<ConstructorParameters<typeof AuthenticateService>[3]>();
		cache.localUserByNativeTokenCache.fetch.mockImplementation(async () => user);
		cache.localUserByIdCache.fetch.mockImplementation(async () => user);
		const tokens = mockDeep<ConstructorParameters<typeof AuthenticateService>[1]>(); tokens.findOne.mockImplementation(async () => mockDeep<MiAccessToken>({ userId: owner, appId: null, permission: ['write:account'] }));
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], tokens, mockDeep(), cache, sessions);
		const fresh = new FreshPasskeyReauthentication(new FreshReauthenticationStore(redis), sessions, db.getRepository(MiUserProfile) as unknown as UserProfilesRepository, db.getRepository(MiUserSecurityKey) as unknown as UserSecurityKeysRepository, relyingParty);
		const deps: AuthRouterDependencies = mockDeep<AuthRouterDependencies>();
		deps['i/change-password/passkey/start'] = deps['i/change-password/passkey/complete'] = { db, freshReauthentication: fresh };
		const handler = new OpenAPIHandler(createAuthRouter(deps), { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(), context: req => ({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: {}, services: { authenticate: token => authenticate.authenticate(token), limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } }),
		}), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); authenticate?.onApplicationShutdown(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await db.getRepository(MiUser).delete({ id: owner }); await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, isSuspended: false, isDeleted: false, token: 'syntheticnative1' });
		user = await db.getRepository(MiUser).findOneByOrFail({ id: owner }) as MiLocalUser;
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync(oldPassword, 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false });
		keyPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); const jwk = keyPair.publicKey.export({ format: 'jwk' });
		const raw = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
		await db.getRepository(MiUserSecurityKey).insert({ id: 'AQID', userId: owner, name: 'Synthetic', publicKey: raw, counter: 0 });
		current = await sessions.issue(owner); other = await sessions.issue(owner);
	});

	test('start → real signed strict UV → password commit; replay changes nothing', async () => {
		const started = await begin(); expect(Object.keys(started).sort()).toEqual(['options', 'ticket']);
		const body = { ticket: started.ticket, credential: assertion(started.options.challenge), newPassword };
		expect((await request('complete', body)).statusCode).toBe(204);
		expect(await bcrypt.compare(newPassword, (await profile()).password!)).toBe(true);
		expect((await profile()).passkeyMfaEnabled).toBe(false); expect((await profile()).twoFactorEnabled).toBe(true);
		expect((await request('complete', { ...body, newPassword: 'replayed-password' })).statusCode).toBe(403);
		expect(await bcrypt.compare(newPassword, (await profile()).password!)).toBe(true);
	});
	test.each(['legacy', 'oauth', 'wrong-password'] as const)('%s cannot obtain fresh password-change authority', async mode => {
		const token = mode === 'legacy' ? 'syntheticnative1' : mode === 'oauth' ? 'synthetic-oauth-token' : current.token;
		const response = await request('start', { currentPassword: mode === 'wrong-password' ? 'wrong' : oldPassword }, token);
		expect(response.statusCode).toBe(mode === 'oauth' ? 400 : 403); expect(await bcrypt.compare(oldPassword, (await profile()).password!)).toBe(true);
	});
	test('wrong browser session does not burn the rightful session challenge', async () => {
		const started = await begin(); const body = { ticket: started.ticket, credential: assertion(started.options.challenge), newPassword };
		expect((await request('complete', body, other.token)).statusCode).toBe(403);
		expect((await request('complete', body)).statusCode).toBe(204);
	});
	test.each(['expired', 'no-uv', 'key-removed'] as const)('%s never changes the stored password', async mode => {
		const started = await begin();
		if (mode === 'expired') await redis.pexpire(`fresh-reauth:v1:${createHash('sha256').update(started.ticket).digest('hex')}`, 0);
		if (mode === 'key-removed') await db.getRepository(MiUserSecurityKey).delete({ id: 'AQID' });
		expect((await request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge, mode !== 'no-uv'), newPassword })).statusCode).toBe(403);
		expect(await bcrypt.compare(oldPassword, (await profile()).password!)).toBe(true);
	});
	test.each(['policy', 'revocation', 'deadline'] as const)('%s changing while the verified request waits on the DB lock prevents mutation', async mode => {
		const started = await begin(); const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let pending: ReturnType<typeof request> | undefined;
		try {
			await blocker.manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: owner }, lock: { mode: 'pessimistic_write' } });
			const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge), newPassword });
			await vi.waitFor(async () => { const waiting = await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid]); expect(waiting.length).toBe(1); }, { timeout: 1500, interval: 10 });
			if (mode === 'policy') await blocker.manager.update(MiUserProfile, { userId: owner }, { passkeyMfaEnabled: true });
			if (mode === 'revocation') await sessions.revokeOwned(owner, current.session.id);
			if (mode === 'deadline') vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
			await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); }
		expect((await pending!).statusCode).toBe(403); expect(await bcrypt.compare(oldPassword, (await profile()).password!)).toBe(true);
	});
});
