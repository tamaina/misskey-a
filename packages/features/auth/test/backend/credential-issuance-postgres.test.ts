/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { Response } from 'node-fetch';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { beforeAll, beforeEach, afterAll, afterEach, describe, test, expect, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiAccessToken } from '../../backend/models/AccessToken.js';
import { MiOAuthApproval } from '../../backend/models/OAuthApproval.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiApp } from '../../backend/models/App.js';
import { MiAuthSession } from '../../backend/models/AuthSession.js';
import { SudoService } from '../../backend/sudo.js';
import { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { OAuth2ProviderService } from '../../backend/oauth/OAuth2ProviderService.js';
import { createMiauthGenTokenProcedure, type MiauthGenTokenDependencies } from '../../backend/endpoints/miauth/gen-token.js';
import { createAuthAcceptProcedure } from '../../backend/endpoints/auth/accept.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { nullSuccessToNoContent } from '@features/api/backend/transport/no-content.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';

// This suite requires the final common SudoService merge. It never replaces sudo with a permissive port.
const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET; const redisSocket = process.env.MISSKEY_OIDC_REDIS_SOCKET;
const owner = 'credentialowner'; const password = 'synthetic-password'; const origin = 'https://synthetic.example';
const clientId = 'https://client.invalid/client.json'; const redirect = 'https://client.invalid/callback'; const verifier = 'x'.repeat(43);
describe.skipIf(!socket || !redisSocket)('actual HTTP, committed OAuth approval, PostgreSQL, Redis and common sudo', () => {
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let sudo: SudoService; let authenticate: AuthenticateService; let sessions: BrowserSessionService;
	let provider: OAuth2ProviderService;
	let current: Awaited<ReturnType<BrowserSessionService['issue']>>; let sequence = 0;
	const ids = { gen: () => `credentialfixture${++sequence}` }; const notifications = mockDeep<MiauthGenTokenDependencies['notificationService']>();
	const tokens = () => db.getRepository(MiAccessToken); const approvals = () => db.getRepository(MiOAuthApproval);
	const identity = () => ({ userId: owner, browserSession: { id: current.session.id, userId: owner } });
	const request = (endpoint: string, body: object, token = current.token) => app.inject({ method: 'POST', url: `/api/${endpoint}`, headers: { origin, authorization: `Bearer ${token}` }, payload: body });
	const exchange = (code: string) => app.inject({ method: 'POST', url: '/oauth/token', payload: { grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirect, code_verifier: verifier, code } });
	async function transaction() {
		const page = await app.inject({ url: `/oauth/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'code', scope: 'read:account', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', state: 'synthetic-csrf' })}` });
		expect(page.statusCode, page.body).toBe(200); const id = page.body.match(/name="misskey:oauth:transaction-id" content="([^"]+)"/)?.[1]; expect(id).toBeDefined(); return id!;
	}
	const approve = async (extra: object = {}) => app.inject({ method: 'POST', url: '/oauth/decision', headers: { origin }, payload: { transaction_id: await transaction(), login_token: current.token, ...extra } });
	const codeOf = (response: Awaited<ReturnType<typeof approve>>) => { expect(response.statusCode, response.body).toBe(302); return new URL(String(response.headers.location)).searchParams.get('code')!; };
	beforeAll(async () => {
		if (!socket || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Owned PostgreSQL required');
		if (!redisSocket || !/^\/tmp\/misskey-oidc-fixture-[^/]+\/redis\.sock$/.test(redisSocket) || lstatSync(dirname(redisSocket)).uid !== process.getuid?.() || (lstatSync(dirname(redisSocket)).mode & 0o077) !== 0 || !lstatSync(redisSocket).isSocket()) throw new Error('Owned Redis required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize(); const applied = await db.runMigrations(); expect(applied.map(row => row.name)).toEqual(expect.arrayContaining(['AccessTokenExpiry1792300000004', 'OidcIdentities1792300000000']));
		redis = new Redis({ path: redisSocket }); sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], ids);
		sudo = new SudoService(db, mockDeep(), mockDeep());
		const cache = mockDeep<ConstructorParameters<typeof AuthenticateService>[3]>(); cache.localUserByIdCache.fetch.mockImplementation(async (_id, load) => { if (!load) throw new Error('Missing synthetic loader'); return load(); }); cache.localUserByNativeTokenCache.fetch.mockImplementation(async (_token, load) => { if (!load) throw new Error('Missing synthetic loader'); return load(); });
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], tokens() as ConstructorParameters<typeof AuthenticateService>[1], db.getRepository(MiApp) as ConstructorParameters<typeof AuthenticateService>[2], cache, sessions);
		const meta = mockDeep<ConstructorParameters<typeof ApiExecutionContextFactory>[1]>();
		const contexts = new ApiExecutionContextFactory(mockDeep(), meta, authenticate, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep());
		const handler = new OpenAPIHandler({ 'miauth/gen-token': createMiauthGenTokenProcedure({ local: sudo, accessTokensRepository: tokens() as never, idService: ids, notificationService: notifications }), 'auth/accept': createAuthAcceptProcedure({ local: sudo, appsRepository: db.getRepository(MiApp) as never, authSessionsRepository: db.getRepository(MiAuthSession) as never, accessTokensRepository: tokens() as never, idService: ids }) }, { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, { maxFileSize: 1024, runSpan: (_name, run) => run(), context: (req, reply, name) => {
			const context = contexts.create({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: req.headers, response: { header: (key, value) => { reply.header(key, value); } } }, name);
			return { ...context, services: { ...context.services, limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } };
		} }), { prefix: '/api' });
		const logger = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[7]>(); logger.getLogger.mockReturnValue(mockDeep());
		const templates = mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[6]>(); templates.getCommonData.mockResolvedValue({ config: { url: origin }, instanceUrl: origin, langs: [], frontendViteFiles: { entryJs: null, css: [], modulePreloads: [] } } as never);
		provider = new OAuth2ProviderService(mockDeep<ConstructorParameters<typeof OAuth2ProviderService>[0]>({ url: origin }), tokens() as never, db.getRepository(MiUser) as never, ids as never, mockDeep(), cache, templates, logger, mockDeep(), redis, authenticate, sudo);
		await app.register(child => provider.createServer(child), { prefix: '/oauth' }); await app.register(child => provider.createTokenServer(child), { prefix: '/oauth/token' }); await app.ready();
	});
	afterAll(async () => { await app?.close(); authenticate?.dispose(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	afterEach(() => vi.restoreAllMocks());
	beforeEach(async () => {
		vi.spyOn(provider, 'fetchClientMetadata').mockImplementation(async () => new Response(JSON.stringify({ client_id: clientId, client_name: 'Synthetic client', redirect_uris: [redirect], grant_types: ['authorization_code'], response_types: ['code'], token_endpoint_auth_method: 'none', token_endpoint_auth_methods_supported: ['none'] }), { headers: { 'content-type': 'application/json' } }));
		await redis.flushdb(); await db.getRepository(MiUser).delete({ id: owner }); await db.getRepository(MiUser).insert({ id: owner, username: owner, usernameLower: owner, host: null, token: 'syntheticnative1', isSuspended: false, isDeleted: false });
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync(password, 4), twoFactorEnabled: false, passkeyMfaEnabled: false }); current = await sessions.issue(owner);
	});
	test.each([undefined, null, 'future'] as const)('explicit MiAuth expiry %s uses the actual common sudo transaction', async selection => {
		const input = { session: null, permission: ['read:account'], ...(selection === undefined ? {} : { expiresAt: selection === 'future' ? new Date(Date.now() + 60_000).toISOString() : null }) };
		expect((await request('miauth/gen-token', input)).statusCode).toBe(403); expect(await tokens().count()).toBe(0); await sudo.begin(identity(), password);
		const response = await request('miauth/gen-token', input); expect(response.statusCode, response.body).toBe(200); const [row] = await tokens().find(); expect(row.expiresAt?.toISOString() ?? null).toBe(selection === 'future' ? input.expiresAt : null);
		await sessions.revokeAllOwned(owner); expect((await authenticate.authenticate(response.json().token))[0]?.id).toBe(owner);
	});
	test('expired credential is refused by HTTP even for app-derived scopes', async () => {
		await db.getRepository(MiApp).insert({ id: 'syntheticapp', userId: owner, secret: 'synthetic-app-secret', name: 'Synthetic', description: 'Fixture', permission: ['read:account'] });
		await tokens().insert({ id: ids.gen(), userId: owner, appId: 'syntheticapp', token: 'synthetic-delegated-token', hash: 'synthetic-delegated-hash', expiresAt: new Date(Date.now() - 1) });
		await expect(authenticate.authenticate('synthetic-delegated-hash')).rejects.toThrow();
	});
	test('master credentials cannot issue a fresh MiAuth grant', async () => {
		expect((await request('miauth/gen-token', { session: null, permission: [] }, 'syntheticnative1')).statusCode).toBe(401); expect(await tokens().count()).toBe(0);
	});
	test('OAuth approval is committed before Redis code publication and remains one-use', async () => {
		await sudo.begin(identity(), password); const code = codeOf(await approve()); expect(await approvals().count()).toBe(1);
		const response = await exchange(code); expect(response.statusCode, response.body).toBe(200); expect(await approvals().count()).toBe(0); expect(await tokens().count()).toBe(1);
		expect((await exchange(code)).statusCode).toBe(400); expect(await tokens().count()).toBe(0);
	});
	test.each(['session', 'policy', 'native', 'deadline', 'digest', 'grant'] as const)('exchange rejects post-approval %s changes', async change => {
		await sudo.begin(identity(), password); const code = codeOf(await approve());
		if (change === 'session') await sessions.revokeAllOwned(owner);
		if (change === 'policy') await db.getRepository(MiUserProfile).update({ userId: owner }, { password: 'changed' });
		if (change === 'native') await db.getRepository(MiUser).update({ id: owner }, { token: 'changednative11' });
		if (change === 'grant') await db.getRepository(MiBrowserSession).update({ id: current.session.id }, { sudoGrantId: 'replacementgrant'.padEnd(43, 'x') } as never);
		if (change === 'deadline') await approvals().update({ userId: owner }, { deadline: new Date(Date.now() - 1) });
		if (change === 'digest') { const key = `oauth:code:${createHash('sha256').update(code).digest('hex')}`; const row = JSON.parse((await redis.get(key))!); row.grant.scopes.push('write:account'); await redis.set(key, JSON.stringify(row), 'KEEPTTL'); }
		expect((await exchange(code)).statusCode).toBe(400); expect(await tokens().count()).toBe(0);
	});
	test('failed approval transaction cannot publish an exchangeable code', async () => {
		await sudo.begin(identity(), password); const original = sudo.transaction.bind(sudo); vi.spyOn(sudo, 'transaction').mockImplementation((identity, run) => original(identity, async locked => { await run(locked); throw new Error('Synthetic rollback'); }));
		expect((await approve()).statusCode).toBeGreaterThanOrEqual(400); expect(await approvals().count()).toBe(0); expect(await redis.keys('oauth:code:*')).toEqual([]); expect(await tokens().count()).toBe(0);
	});
	test('an issued OAuth token survives its authorizing browser logout but respects its explicit expiry', async () => {
		await sudo.begin(identity(), password); const expiresAt = new Date(Date.now() + 60_000).toISOString(); const response = await exchange(codeOf(await approve({ expires_at: expiresAt }))); expect(response.statusCode).toBe(200);
		await sessions.revokeAllOwned(owner); expect((await authenticate.authenticate(response.json().access_token))[0]?.id).toBe(owner);
		const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse(expiresAt)); await expect(authenticate.authenticate(response.json().access_token)).rejects.toThrow(); now.mockRestore();
	});
});
