/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import type { EntitySubscriberInterface } from 'typeorm';
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
import { mock, mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
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
const owner = 'freshemailuser';
const oldPassword = 'synthetic-old-password';
const relyingParty = { url: 'https://synthetic.example', hostname: 'synthetic.example' };

describe.skipIf(!socket || !redisSocket)('HTTP fresh email change with real SQL, Redis and signed WebAuthn', () => {
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let authenticate: AuthenticateService;
	let sessions: BrowserSessionService; let current: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let other: Awaited<ReturnType<BrowserSessionService['issue']>>; let unrelated: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let keyPair: { publicKey: KeyObject; privateKey: KeyObject }; let user: MiLocalUser; let nextSession = 0;
	const events = mockDeep<AuthRouterDependencies['i/update-email/passkey/complete']['globalEventService']>();
	const emailService = mockDeep<AuthRouterDependencies['i/update-email/passkey/complete']['emailService']>();
	const userEntityService = mockDeep<AuthRouterDependencies['i/update-email/passkey/complete']['userEntityService']>();
	const settings = { emailRequiredForSignup: false };
	let verifyProfiles: UserProfilesRepository;
	const native = async () => (await db.getRepository(MiUser).findOneByOrFail({ id: owner })).token;
	const profile = () => db.getRepository(MiUserProfile).findOneByOrFail({ userId: owner });
	const request = (phase: 'start' | 'complete', body: object, token = current.token) => app.inject({ method: 'POST', url: `/api/i/update-email/passkey/${phase}`, headers: { authorization: `Bearer ${token}` }, payload: body });

	async function begin(email: string | null = 'new@example.test') { const response = await request('start', { currentPassword: oldPassword, email }); expect(response.statusCode).toBe(200); return response.json<{ ticket: string; options: { challenge: string } }>(); }

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
		expect(migrations).toHaveLength(360);
		expect(migrations.map(migration => migration.name)).toEqual(expect.arrayContaining(['AutoArchiveAnnouncements1791943550568', 'PasskeyMfaPolicy1791969900000']));
		redis = new Redis({ path: redisSocket });
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], { gen: () => `freshemailsession${++nextSession}` });
		const cache = mockDeep<ConstructorParameters<typeof AuthenticateService>[3]>();
		cache.localUserByNativeTokenCache.fetch.mockImplementation(async () => user);
		cache.localUserByIdCache.fetch.mockImplementation(async () => user);
		const tokens = mockDeep<ConstructorParameters<typeof AuthenticateService>[1]>(); tokens.findOne.mockImplementation(async () => mockDeep<MiAccessToken>({ userId: owner, appId: null, permission: ['write:account'] }));
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], tokens, mockDeep(), cache, sessions);
		const fresh = new FreshPasskeyReauthentication(new FreshReauthenticationStore(redis), sessions, db.getRepository(MiUserProfile) as unknown as UserProfilesRepository, db.getRepository(MiUserSecurityKey) as unknown as UserSecurityKeysRepository, relyingParty);
		const deps: AuthRouterDependencies = mockDeep<AuthRouterDependencies>();
		const common = { db, config: relyingParty, serverSettings: settings, userProfilesRepository: db.getRepository(MiUserProfile) as unknown as UserProfilesRepository, userEntityService, emailService, globalEventService: events };
		deps['i/update-email/passkey/start'] = deps['i/update-email/passkey/complete'] = { ...common, freshReauthentication: fresh };
		deps['i/change-password/passkey/start'] = deps['i/change-password/passkey/complete'] = { db, freshReauthentication: fresh };
		deps['i/update-email'] = { ...common, usersRepository: db.getRepository(MiUser) as AuthRouterDependencies['i/update-email']['usersRepository'], userAuthService: mockDeep() };
		verifyProfiles = db.getRepository(MiUserProfile) as unknown as UserProfilesRepository;
		deps['verify-email'] = { userProfilesRepository: verifyProfiles, userEntityService, globalEventService: events };
		const contextFactory = new ApiExecutionContextFactory(mockDeep(), mockDeep(), authenticate, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep());
		const handler = new OpenAPIHandler(createAuthRouter(deps), { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(), context: (req, _reply, name) => { const context = contextFactory.create({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: {} }, name); return { ...context, services: { ...context.services, limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } }; },
		}), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); authenticate?.onApplicationShutdown(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		vi.restoreAllMocks(); vi.clearAllMocks(); await redis.flushdb(); settings.emailRequiredForSignup = false;
		emailService.validateEmailForAccount.mockResolvedValue({ available: true, reason: null });
		type Packed = Awaited<ReturnType<typeof userEntityService.packSelf>>;
		userEntityService.packSelf.mockResolvedValue(Object.assign(mock<Packed>(), { id: owner, host: null, emojis: {}, badgeRoles: [], avatarDecorations: [], alsoKnownAs: [], fields: [], verifiedLinks: [], pinnedNoteIds: [], pinnedNotes: [], pinnedPage: null, roles: [], notificationRecieveConfig: {}, unreadAnnouncements: [], mutedWords: [], hardMutedWords: [], mutedInstances: [], mutingNotificationTypes: [], emailNotificationTypes: [], achievements: [], policies: mock<Packed['policies']>({ uploadableFileTypes: [] }), securityKeysList: [] }));
		await db.getRepository(MiUser).delete({ id: owner }); await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, isSuspended: false, isDeleted: false, token: 'syntheticnative1' });
		user = await db.getRepository(MiUser).findOneByOrFail({ id: owner }) as MiLocalUser;
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync(oldPassword, 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false, email: 'old@example.test', emailVerified: true, emailVerifyCode: null });
		keyPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); const jwk = keyPair.publicKey.export({ format: 'jwk' });
		const raw = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
		await db.getRepository(MiUserSecurityKey).insert({ id: 'AQID', userId: owner, name: 'Synthetic', publicKey: raw, counter: 0 });
		current = await sessions.issue(owner); other = await sessions.issue(owner);
		await db.getRepository(MiUser).delete({ id: 'unrelatedtokenuser' });
		await db.getRepository(MiUser).insert({ id: 'unrelatedtokenuser', username: 'unrelated', usernameLower: 'unrelated', host: null, token: 'unrelatednative1' });
		unrelated = await sessions.issue('unrelatedtokenuser');
	});
	const finish = (started: { ticket: string; options: { challenge: string } }, email: string | null = 'new@example.test', token = current.token, uv = true) => request('complete', { ticket: started.ticket, credential: assertion(started.options.challenge, uv), email }, token);

	async function unchanged(active = true) {
		expect(await profile()).toMatchObject({ email: 'old@example.test', emailVerified: true, emailVerifyCode: null });
		expect(await native()).toBe('syntheticnative1'); expect(await sessions.isActive(current.session.id, owner)).toBe(active); expect(await sessions.isActive(other.session.id, owner)).toBe(active);
		expect((await db.getRepository(MiBrowserSession).findOneByOrFail({ id: current.session.id })).revokedAt).toBeNull(); expect((await db.getRepository(MiBrowserSession).findOneByOrFail({ id: other.session.id })).revokedAt).toBeNull();
		expect(events.publishMainStream).not.toHaveBeenCalled(); expect(emailService.sendEmail).not.toHaveBeenCalled();
	}

	test.each([{ independent: false, totp: false }, { independent: false, totp: true }, { independent: true, totp: false }, { independent: true, totp: true }])('strict signed UV commits email/code and preserves policy/session %j', async ({ independent, totp }) => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: independent, twoFactorEnabled: totp, twoFactorSecret: totp ? 'synthetic-secret' : null });
		const started = await begin(); expect((await finish(started)).statusCode).toBe(204);
		const saved = await profile(); expect(saved.email).toBe('new@example.test'); expect(saved.emailVerified).toBe(false); expect(saved.emailVerifyCode).toMatch(/^[0-9a-z]{16}$/);
		expect(saved.passkeyMfaEnabled).toBe(independent); expect(saved.twoFactorEnabled).toBe(totp); expect(await native()).toBe('syntheticnative1'); expect(await sessions.isActive(current.session.id, owner)).toBe(true); expect(await sessions.isActive(unrelated.session.id, 'unrelatedtokenuser')).toBe(true);
		expect(emailService.sendEmail).toHaveBeenCalledExactlyOnceWith('new@example.test', 'Email verification', expect.stringContaining(saved.emailVerifyCode!), expect.stringContaining(saved.emailVerifyCode!)); expect(events.publishMainStream).toHaveBeenCalledOnce();
		expect((await finish(started)).statusCode).toBe(403); expect((await profile()).emailVerifyCode).toBe(saved.emailVerifyCode); expect(emailService.sendEmail).toHaveBeenCalledOnce();
	});
	test.each(['different-address', 'null-address', 'session'] as const)('%s mismatch does not consume the proper ceremony', async kind => {
		const started = await begin(); const target = kind === 'different-address' ? 'other@example.test' : kind === 'null-address' ? null : 'new@example.test';
		expect((await finish(started, target, kind === 'session' ? other.token : current.token)).statusCode).toBe(403); await unchanged(); expect((await finish(started)).statusCode).toBe(204);
	});
	test('null target cannot be swapped to a string and clears without delivery', async () => {
		const started = await begin(null); expect((await finish(started)).statusCode).toBe(403); await unchanged(); expect((await finish(started, null)).statusCode).toBe(204);
		expect(await profile()).toMatchObject({ email: null, emailVerified: false, emailVerifyCode: null }); expect(emailService.sendEmail).not.toHaveBeenCalled();
	});
	test.each(['legacy', 'oauth', 'wrong-password', 'no-uv', 'expired', 'key-removed', 'unavailable', 'required', 'suspended'] as const)('%s cannot change an address', async mode => {
		if (mode === 'legacy' || mode === 'oauth' || mode === 'wrong-password') {
			const token = mode === 'legacy' ? 'syntheticnative1' : mode === 'oauth' ? 'synthetic-oauth-token' : current.token;
			expect((await request('start', { currentPassword: mode === 'wrong-password' ? 'wrong' : oldPassword, email: 'new@example.test' }, token)).statusCode).toBe(mode === 'oauth' ? 400 : 403);
		} else {
			const started = await begin(mode === 'required' ? null : undefined);
			if (mode === 'expired') await redis.pexpire(`fresh-reauth:v1:${createHash('sha256').update(started.ticket).digest('hex')}`, 0);
			if (mode === 'key-removed') await db.getRepository(MiUserSecurityKey).delete({ id: 'AQID' });
			if (mode === 'suspended') await db.getRepository(MiUser).update({ id: owner }, { isSuspended: true });
			if (mode === 'unavailable') emailService.validateEmailForAccount.mockResolvedValue({ available: false, reason: 'used' });
			if (mode === 'required') settings.emailRequiredForSignup = true;
			expect((await finish(started, mode === 'required' ? null : undefined, current.token, mode !== 'no-uv')).statusCode).toBe(mode === 'suspended' ? 401 : 403);
		}
		await unchanged(mode !== 'suspended');
	});
	test.each(['change-password', 'update-email'] as const)('%s ticket cannot cross the purpose boundary or be burned there', async origin => {
		const isEmail = origin === 'update-email';
		const started = isEmail ? await begin() : (await app.inject({ method: 'POST', url: '/api/i/change-password/passkey/start', headers: { authorization: `Bearer ${current.token}` }, payload: { currentPassword: oldPassword } })).json<{ ticket: string; options: { challenge: string } }>();
		const password = () => app.inject({ method: 'POST', url: '/api/i/change-password/passkey/complete', headers: { authorization: `Bearer ${current.token}` }, payload: { ticket: started.ticket, credential: assertion(started.options.challenge), newPassword: 'synthetic-new-password' } });
		expect((await (isEmail ? password() : finish(started))).statusCode).toBe(403); await unchanged();
		expect((await (isEmail ? finish(started) : password())).statusCode).toBe(204);
	});
	test.each(['policy', 'revocation', 'email', 'deadline'] as const)('%s while waiting for the profile lock refuses mutation', async mode => {
		const started = await begin(); const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction(); let pending: ReturnType<typeof request> | undefined;
		try {
			await blocker.manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: owner }, lock: { mode: 'pessimistic_write' } }); const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = finish(started); await vi.waitFor(async () => { expect((await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid])).length).toBe(1); }, { timeout: 1500, interval: 10 });
			if (mode === 'policy') await blocker.manager.update(MiUserProfile, { userId: owner }, { passkeyMfaEnabled: true });
			if (mode === 'email') await blocker.manager.update(MiUserProfile, { userId: owner }, { email: 'concurrent@example.test' });
			if (mode === 'revocation') await sessions.revokeOwned(owner, current.session.id);
			if (mode === 'deadline') vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
			await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); vi.restoreAllMocks(); }
		expect((await pending!).statusCode).toBe(403); expect((await profile()).email).toBe(mode === 'email' ? 'concurrent@example.test' : 'old@example.test'); expect(emailService.sendEmail).not.toHaveBeenCalled(); expect(events.publishMainStream).not.toHaveBeenCalled();
	});
	test.each(['throw-after-write', 'expire-after-write'] as const)('%s rolls back the complete row without effects', async mode => {
		const started = await begin();
		const subscriber: EntitySubscriberInterface<MiUserProfile> = { listenTo: () => MiUserProfile, afterUpdate: () => { if (mode === 'throw-after-write') throw new Error('Synthetic after-write failure'); vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER); } };
		db.subscribers.push(subscriber);
		try { expect((await finish(started)).statusCode).toBe(403); } finally { db.subscribers.splice(db.subscribers.indexOf(subscriber), 1); vi.restoreAllMocks(); }
		await unchanged(); expect((await finish(started)).statusCode).toBe(403);
	});
	test('SMTP failure keeps committed address/code and never makes the ticket reusable', async () => {
		const started = await begin(); emailService.sendEmail.mockRejectedValueOnce(new Error('Synthetic delivery failure'));
		expect((await finish(started)).statusCode).toBe(403); const saved = await profile(); expect(saved.email).toBe('new@example.test'); expect(saved.emailVerified).toBe(false); expect(saved.emailVerifyCode).not.toBeNull();
		expect((await finish(started)).statusCode).toBe(403); expect((await profile()).emailVerifyCode).toBe(saved.emailVerifyCode); expect(emailService.sendEmail).toHaveBeenCalledOnce();
	});
	test('distinct keys/sessions and different targets have exactly one current-state winner', async () => {
		const key = await db.getRepository(MiUserSecurityKey).findOneByOrFail({ id: 'AQID' }); await db.getRepository(MiUserSecurityKey).insert({ ...key, id: 'AQIE' });
		const first = await begin('one@example.test'); const response = await request('start', { currentPassword: oldPassword, email: 'two@example.test' }, other.token); expect(response.statusCode).toBe(200); const second = response.json<{ ticket: string; options: { challenge: string } }>();
		const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction(); let pending: Promise<Awaited<ReturnType<typeof request>>[]> | undefined; let results: Awaited<ReturnType<typeof request>>[] | undefined;
		try {
			await blocker.manager.getRepository(MiUser).findOneOrFail({ where: { id: owner }, lock: { mode: 'pessimistic_write' } });
			pending = Promise.all([finish(first, 'one@example.test'), request('complete', { ticket: second.ticket, credential: assertion(second.options.challenge, true, 'AQIE'), email: 'two@example.test' }, other.token)]);
			await vi.waitFor(async () => { expect((await db.query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND cardinality(pg_blocking_pids(pid)) > 0")).length).toBe(2); }, { timeout: 1500, interval: 10 }); await blocker.commitTransaction(); results = await pending;
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await pending?.catch(() => {}); }
		expect(results!.map(result => result.statusCode).sort()).toEqual([204, 403]); expect(events.publishMainStream).toHaveBeenCalledOnce(); expect(emailService.sendEmail).toHaveBeenCalledOnce(); expect(['one@example.test', 'two@example.test']).toContain((await profile()).email);
	});
	const verify = (code: string) => app.inject({ method: 'POST', url: '/api/verify-email', payload: { code } });
	test('old-code verification selected before a new address commits cannot verify the new address', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { emailVerified: false, emailVerifyCode: 'old-code' });
		let release!: () => void; let loaded!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); const selected = new Promise<void>(resolve => { loaded = resolve; }); const original = verifyProfiles.findOneBy.bind(verifyProfiles);
		vi.spyOn(verifyProfiles, 'findOneBy').mockImplementationOnce(async where => { const row = await original(where); loaded(); await gate; return row; });
		const pending = verify('old-code').then(response => response); try { await selected; expect((await finish(await begin())).statusCode).toBe(204); } finally { release(); }
		expect((await pending).statusCode).toBe(400); expect(await profile()).toMatchObject({ email: 'new@example.test', emailVerified: false }); expect(events.publishMainStream).toHaveBeenCalledOnce();
	});
	test('old-code verification committed first invalidates an older email-change ceremony', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { emailVerified: false, emailVerifyCode: 'old-code' }); const started = await begin(); expect((await verify('old-code')).statusCode).toBe(204);
		expect((await finish(started)).statusCode).toBe(403); expect(await profile()).toMatchObject({ email: 'old@example.test', emailVerified: true, emailVerifyCode: null }); expect(emailService.sendEmail).not.toHaveBeenCalled();
	});
	test('a verification code is consumed once; replay cannot publish again', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { emailVerified: false, emailVerifyCode: 'old-code' }); expect((await verify('old-code')).statusCode).toBe(204); expect((await verify('old-code')).statusCode).toBe(400); expect(events.publishMainStream).toHaveBeenCalledOnce();
	});
	test.each([false, true])('legacy omitted email (%s) retains its distinct nullable behavior', async omitted => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: false });
		const result = await app.inject({ method: 'POST', url: '/api/i/update-email', headers: { authorization: `Bearer ${current.token}` }, payload: { password: oldPassword, ...(omitted ? {} : { email: null }) } });
		expect(result.statusCode).toBe(200); expect(await profile()).toMatchObject({ email: omitted ? 'old@example.test' : null, emailVerified: false, emailVerifyCode: null }); expect(emailService.sendEmail).not.toHaveBeenCalled();
	});
	test('legacy revoked session cannot mutate after its authenticated request waits', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: false });
		const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction(); let pending: ReturnType<typeof request> | undefined;
		try {
			await blocker.manager.getRepository(MiUser).findOneOrFail({ where: { id: owner }, lock: { mode: 'pessimistic_write' } }); const [row] = await blocker.query('SELECT pg_backend_pid() AS pid');
			pending = app.inject({ method: 'POST', url: '/api/i/update-email', headers: { authorization: `Bearer ${current.token}` }, payload: { password: oldPassword, email: 'new@example.test' } });
			await vi.waitFor(async () => { expect((await db.query('SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND $1 = ANY(pg_blocking_pids(pid))', [row.pid])).length).toBe(1); }, { timeout: 1500, interval: 10 });
			await sessions.revokeOwned(owner, current.session.id); await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); await Promise.resolve(pending).catch(() => {}); }
		expect((await pending!).statusCode).toBe(500); expect((await profile()).email).toBe('old@example.test'); expect(emailService.sendEmail).not.toHaveBeenCalled(); expect(events.publishMainStream).not.toHaveBeenCalled();
	});
	test('legacy native cache and active independent policy cannot authorize a change', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { twoFactorEnabled: false }); await db.getRepository(MiUser).update({ id: owner }, { token: 'syntheticnative2' });
		expect((await app.inject({ method: 'POST', url: '/api/i/update-email', headers: { authorization: 'Bearer syntheticnative1' }, payload: { password: oldPassword, email: 'new@example.test' } })).statusCode).toBe(500);
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: true });
		expect((await app.inject({ method: 'POST', url: '/api/i/update-email', headers: { authorization: `Bearer ${current.token}` }, payload: { password: oldPassword, token: 'backup', email: 'new@example.test' } })).statusCode).toBe(500); expect(emailService.sendEmail).not.toHaveBeenCalled(); expect((await profile()).email).toBe('old@example.test');
	});
});
