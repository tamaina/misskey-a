/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import type { KeyObject } from 'node:crypto';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { encode } from 'cbor2';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
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
import { SecurityOperationStore } from '../../backend/security-operation-store.js';
import { SudoService } from '../../backend/sudo.js';
import { TotpService } from '../../backend/services/TotpService.js';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const redisSocket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const owner = 'securityruntimeuser'; const password = 'synthetic-password';
const config = { url: 'https://synthetic.example', hostname: 'synthetic.example', host: 'synthetic.example' };
const keyId = 'AQID';
type Started = { ticket: string; options: { challenge: string; userVerification?: string; allowCredentials?: unknown[]; authenticatorSelection?: { userVerification?: string; residentKey?: string } }; backupCodes: string[] };
describe.skipIf(!socket || !redisSocket)('security settings through real HTTP, PostgreSQL, Redis and signed WebAuthn', () => {
	let db: DataSource; let redis: Redis; let app: FastifyInstance; let authenticate: AuthenticateService; let sessions: BrowserSessionService;
	let current: Awaited<ReturnType<BrowserSessionService['issue']>>; let other: Awaited<ReturnType<BrowserSessionService['issue']>>;
	let keys: { publicKey: KeyObject; privateKey: KeyObject }; let counter = 0; let nextSession = 0;
	const profile = () => db.getRepository(MiUserProfile).findOneByOrFail({ userId: owner });
	const request = (route: string, body: object = {}, token = current.token) => app.inject({ method: 'POST', url: `/api/${route}`, headers: { authorization: `Bearer ${token}` }, payload: body });
	const clientData = (type: string, challenge: string) => Buffer.from(JSON.stringify({ type, challenge, origin: config.url, crossOrigin: false }));

	function registration(challenge: string, uv = false) {
		const jwk = keys.publicKey.export({ format: 'jwk' });
		const cose = encode(new Map<number, unknown>([[1, 2], [3, -7], [-1, 1], [-2, new Uint8Array(Buffer.from(jwk.x!, 'base64url'))], [-3, new Uint8Array(Buffer.from(jwk.y!, 'base64url'))]]));
		const header = Buffer.alloc(37); createHash('sha256').update(config.hostname).digest().copy(header); header[32] = uv ? 0x45 : 0x41;
		const credentialId = Buffer.from(keyId, 'base64url'); const length = Buffer.alloc(2); length.writeUInt16BE(credentialId.length);
		const authData = Buffer.concat([header, Buffer.alloc(16), length, credentialId, cose]);
		return { id: keyId, rawId: keyId, type: 'public-key', response: { clientDataJSON: clientData('webauthn.create', challenge).toString('base64url'), attestationObject: Buffer.from(encode({ fmt: 'none', attStmt: {}, authData: new Uint8Array(authData) })).toString('base64url'), transports: ['usb'] }, clientExtensionResults: {} };
	}

	function assertion(challenge: string, uv = false) {
		const client = clientData('webauthn.get', challenge); const authenticator = Buffer.alloc(37);
		createHash('sha256').update(config.hostname).digest().copy(authenticator); authenticator[32] = uv ? 5 : 1; authenticator.writeUInt32BE(++counter, 33);
		const signature = sign('sha256', Buffer.concat([authenticator, createHash('sha256').update(client).digest()]), keys.privateKey);
		return { id: keyId, rawId: keyId, type: 'public-key', response: { clientDataJSON: client.toString('base64url'), authenticatorData: authenticator.toString('base64url'), signature: signature.toString('base64url'), userHandle: Buffer.from(owner).toString('base64url') }, clientExtensionResults: {} };
	}

	async function elevate() { const result = await request('i/sudo/start', { password }); expect(result.statusCode).toBe(200); expect(result.json()).toMatchObject({ status: 'elevated', grantId: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/) }); return result.json<{ expiresAt: string; grantId: string }>(); }

	async function enroll() {
		await elevate(); const start = await request('i/security/passkey/register/start', { name: 'Synthetic key' }); expect(start.statusCode).toBe(200);
		const row = start.json<Started>(); expect(row.options.authenticatorSelection).toMatchObject({ userVerification: 'preferred', residentKey: 'preferred' });
		const body = { ticket: row.ticket, credential: registration(row.options.challenge) };
		expect((await request('i/security/passkey/register/complete', body)).statusCode).toBe(200); return body;
	}

	beforeAll(async () => {
		if (!socket || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Owned PostgreSQL required');
		if (!redisSocket || !/^\/tmp\/misskey-oauth-[^/]+\/redis\.sock$/.test(redisSocket) || lstatSync(dirname(redisSocket)).uid !== process.getuid?.() || (lstatSync(dirname(redisSocket)).mode & 0o077) !== 0 || !lstatSync(redisSocket).isSocket()) throw new Error('Owned Redis required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize(); expect(await db.runMigrations()).toHaveLength(365); expect((await db.driver.createSchemaBuilder().log()).upQueries.map(query => query.query)).toEqual([]);
		redis = new Redis({ path: redisSocket });
		sessions = new BrowserSessionService(db.getRepository(MiBrowserSession) as ConstructorParameters<typeof BrowserSessionService>[0], { gen: () => `securitysession${++nextSession}` });
		authenticate = new AuthenticateService(db.getRepository(MiUser) as ConstructorParameters<typeof AuthenticateService>[0], mockDeep(), mockDeep(), mockDeep(), sessions);
		const totp = new TotpService(redis, mockDeep(), db.getRepository(MiUserProfile) as ConstructorParameters<typeof TotpService>[2]);
		const fresh = new FreshPasskeyReauthentication(new FreshReauthenticationStore(redis), sessions, db.getRepository(MiUserProfile) as ConstructorParameters<typeof FreshPasskeyReauthentication>[2], db.getRepository(MiUserSecurityKey) as ConstructorParameters<typeof FreshPasskeyReauthentication>[3], config);
		const sudo = new SudoService(db, fresh, totp); const deps: AuthRouterDependencies = mockDeep<AuthRouterDependencies>();
		deps.sudo = { sudoService: sudo }; deps.security = { sudo, operations: new SecurityOperationStore(redis), config, meta: { name: 'Synthetic', rootUserId: null }, totp, users: mockDeep(), events: mockDeep(), queue: mockDeep(), email: mockDeep(), tokens: mockDeep() };
		const handler = new OpenAPIHandler(createAuthRouter(deps), { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
		app = Fastify(); await app.register(async api => registerPilotHttp(api, handler, { maxFileSize: 1024, runSpan: (_name, run) => run(), context: req => ({ credential: req.headers.authorization?.replace(/^Bearer /, ''), ip: '127.0.0.1', headers: {}, services: { authenticate: token => authenticate.authenticate(token), limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null } }) }), { prefix: '/api' });
	});
	afterAll(async () => { await app?.close(); authenticate?.onApplicationShutdown(); await redis?.quit(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await redis.flushdb(); await db.getRepository(MiUser).delete({ id: owner });
		await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, token: 'synthetic-native', isSuspended: false, isDeleted: false });
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync(password, 4), email: 'synthetic@example.test', emailVerified: true, twoFactorBackupSecret: null });
		keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); counter = 0; current = await sessions.issue(owner); other = await sessions.issue(owner);
	});
	test('UP-only registration without TOTP is committed once and does not activate MFA', async () => {
		const body = await enroll(); expect((await profile()).passkeyMfaEnabled).toBe(false); expect((await profile()).twoFactorEnabled).toBe(false);
		expect(await db.getRepository(MiUserSecurityKey).countBy({ userId: owner })).toBe(1); expect((await request('i/security/passkey/register/complete', body)).statusCode).toBe(403);
		expect(await sessions.verify(other.token)).toBeNull(); expect(await sessions.verify(current.token)).not.toBeNull();
		const started = await request('i/security/passkey/register/start', { name: 'Malformed attestation' });
		const bad = registration(started.json<Started>().options.challenge); bad.response.attestationObject = 'AQID';
		expect((await request('i/security/passkey/register/complete', { ticket: started.json<Started>().ticket, credential: bad })).statusCode).toBe(403);
		expect(await db.getRepository(MiUserSecurityKey).countBy({ userId: owner })).toBe(1);
	});
	test('five saved codes plus a real UP-only owned assertion activate independent MFA; one recovery code is consumed', async () => {
		await enroll(); const response = await request('i/security/passkey/mfa/start'); expect(response.statusCode).toBe(200); const row = response.json<Started>();
		expect(row.options.userVerification).toBe('preferred'); expect(new Set(row.backupCodes).size).toBe(5);
		const body = { ticket: row.ticket, credential: assertion(row.options.challenge), recoveryAcknowledged: true };
		expect((await request('i/security/passkey/mfa/complete', { ...body, recoveryAcknowledged: false })).statusCode).toBe(403);
		expect((await profile()).passkeyMfaEnabled).toBe(false); expect((await request('i/security/passkey/mfa/complete', body)).statusCode).toBe(204);
		expect((await profile()).passkeyMfaEnabled).toBe(true); expect((await profile()).twoFactorBackupSecret).toEqual(row.backupCodes);
		expect((await request('i/security/passkey/mfa/complete', body)).statusCode).toBe(403);
		await request('i/sudo/exit'); const recovery = await request('i/sudo/start', { password, token: row.backupCodes[0] }); expect(recovery.statusCode).toBe(200);
		expect((await profile()).twoFactorBackupSecret).toEqual(row.backupCodes.slice(1)); expect((await request('i/sudo/start', { password, token: row.backupCodes[0] })).statusCode).toBe(403);
	});
	test('strict discoverable primary proof rejects UP-only and accepts UV before disabling password login', async () => {
		await enroll(); let response = await request('i/security/passkey/passwordless/start'); expect(response.statusCode).toBe(200); let row = response.json<Started>();
		expect(row.options.userVerification).toBe('required'); expect(row.options.allowCredentials).toBeUndefined();
		expect((await request('i/security/passkey/passwordless/complete', { ticket: row.ticket, credential: assertion(row.options.challenge, false) })).statusCode).toBe(403); expect((await profile()).usePasswordLessLogin).toBe(false);
		for (const handle of [null, Buffer.from('another-owner').toString('base64url')]) {
			response = await request('i/security/passkey/passwordless/start'); row = response.json<Started>();
			const bad = assertion(row.options.challenge, true); const wire: Record<string, unknown> = { ...bad.response };
			if (handle === null) delete wire.userHandle; else wire.userHandle = handle;
			expect((await request('i/security/passkey/passwordless/complete', { ticket: row.ticket, credential: { ...bad, response: wire } })).statusCode).toBe(403);
			expect((await profile()).usePasswordLessLogin).toBe(false);
		}
		response = await request('i/security/passkey/passwordless/start'); row = response.json<Started>();
		expect((await request('i/security/passkey/passwordless/complete', { ticket: row.ticket, credential: assertion(row.options.challenge, true) })).statusCode).toBe(204);
		response = await request('i/security/password-login/disable/start'); expect(response.statusCode).toBe(200); row = response.json<Started>();
		expect(row.options.userVerification).toBe('required'); expect(row.options.allowCredentials).toBeUndefined();
		expect((await request('i/security/password-login/disable/complete', { ticket: row.ticket, credential: assertion(row.options.challenge, true) })).statusCode).toBe(204);
		expect((await profile()).passwordLoginDisabled).toBe(true); expect((await request('i/security/passkey/remove', { credentialId: keyId })).statusCode).toBe(400);
		await request('i/sudo/exit'); response = await request('i/sudo/start', { password }); expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ status: 'passkey-required' });
		const fresh = response.json<Started>(); expect(fresh.options.userVerification).toBe('required');
		expect((await request('i/sudo/complete', { ticket: fresh.ticket, credential: assertion(fresh.options.challenge, true) })).statusCode).toBe(200);
	});
	test('another session cannot claim the pending proof and two completions have one winner', async () => {
		await enroll(); const third = await sessions.issue(owner); expect((await request('i/sudo/start', { password }, third.token)).statusCode).toBe(200);
		const start = await request('i/security/passkey/mfa/start'); const row = start.json<Started>(); const body = { ticket: row.ticket, credential: assertion(row.options.challenge), recoveryAcknowledged: true };
		expect((await request('i/security/passkey/mfa/complete', body, third.token)).statusCode).toBe(403);
		const results = await Promise.all([request('i/security/passkey/mfa/complete', body), request('i/security/passkey/mfa/complete', body)]);
		expect(results.map(result => result.statusCode).sort()).toEqual([204, 403]); expect((await profile()).passkeyMfaEnabled).toBe(true);
	});
	test('TOTP enrollment verifies the real secret once, preserves the sudo deadline and requires explicit last-factor removal', async () => {
		const grant = await elevate(); const response = await request('i/security/totp/start'); expect(response.statusCode).toBe(200);
		const setup = response.json<{ secret: string; url: string }>(); expect(setup.url).toContain('otpauth://totp/');
		expect((await request('i/security/totp/complete', { token: 'not-an-otp' })).statusCode).toBe(403);
		expect((await profile()).twoFactorEnabled).toBe(false);
		const otp = new OTPAuth.TOTP({ secret: setup.secret, digits: 6 });
		const completed = await request('i/security/totp/complete', { token: otp.generate() }); expect(completed.statusCode).toBe(200);
		const codes = completed.json<{ backupCodes: string[] }>().backupCodes; expect(new Set(codes).size).toBe(5);
		expect(await profile()).toMatchObject({ twoFactorEnabled: true, twoFactorSecret: setup.secret, twoFactorTempSecret: null, twoFactorBackupSecret: codes });
		expect((await request('i/sudo/status')).json()).toEqual({ active: true, expiresAt: grant.expiresAt });
		expect(await sessions.verify(other.token)).toBeNull();
		expect((await request('i/security/totp/complete', { token: otp.generate() })).statusCode).toBe(403);
		expect((await request('i/security/totp/remove', { confirmDisableMfa: false })).statusCode).toBe(400);
		expect((await profile()).twoFactorEnabled).toBe(true);
		expect((await request('i/security/totp/remove', { confirmDisableMfa: true })).statusCode).toBe(204);
		expect(await profile()).toMatchObject({ twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupSecret: null });
	});
	test('a replaced sudo grant cannot revive an older pending activation', async () => {
		await enroll(); const start = await request('i/security/passkey/mfa/start'); const row = start.json<Started>();
		await request('i/sudo/exit'); await elevate();
		expect((await request('i/security/passkey/mfa/complete', { ticket: row.ticket, credential: assertion(row.options.challenge), recoveryAcknowledged: true })).statusCode).toBe(403);
		expect((await profile()).passkeyMfaEnabled).toBe(false); expect(Number((await db.getRepository(MiUserSecurityKey).findOneByOrFail({ id: keyId })).counter)).toBe(0);
	});
});
