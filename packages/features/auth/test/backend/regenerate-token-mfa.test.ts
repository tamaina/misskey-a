/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import type { EntityManager } from 'typeorm';
import { MiUser, MiBrowserSession } from '@features/persistence/backend/repositories/models.js';
import { afterEach, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createIRegenerateTokenProcedure } from '../../backend/endpoints/i/regenerate-token.js';
import type { IRegenerateTokenDependencies } from '../../backend/endpoints/i/regenerate-token.js';
import { IRegenerateTokenContract } from '../../backend/api.definition.js';
import { UserAuthService } from '../../backend/services/UserAuthService.js';
import { testContext } from './native-context.js';

const password = 'synthetic-password';
const secret = 'JBSWY3DPEHPK3PXP';
const backup = 'a'.repeat(32);
const now = 1800000000000;
const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });

afterEach(() => vi.unstubAllEnvs());

function fixture(twoFactorEnabled = true) {
	vi.stubEnv('MISSKEY_TEST_CHECK_DUPLICATED_TOTP', '1');
	vi.spyOn(Date, 'now').mockReturnValue(now);
	const users = mockDeep<ConstructorParameters<typeof UserAuthService>[1]>();
	const profiles = mockDeep<ConstructorParameters<typeof UserAuthService>[2]>();
	const redis = mockDeep<ConstructorParameters<typeof UserAuthService>[0]>();
	const events = mockDeep<Parameters<typeof createIRegenerateTokenProcedure>[0]['globalEventService']>();
	const me = mockDeep<MiLocalUser>({ id: 'synthetic-user', token: 'synthetic-old-token', isSuspended: false, movedToUri: null });
	const profile = mockDeep<NonNullable<Awaited<ReturnType<typeof profiles.findOneByOrFail>>>>({
		userId: me.id, password: bcrypt.hashSync(password, 4), twoFactorEnabled,
		twoFactorSecret: secret, twoFactorBackupSecret: [backup],
	});
	users.findOneByOrFail.mockResolvedValue(me);
	profiles.findOneByOrFail.mockResolvedValue(profile);
	redis.set.mockResolvedValue('OK');
	const auth = new UserAuthService(redis, users, profiles);
	const authenticate = vi.spyOn(auth, 'twoFactorAuthenticate');
	const db = mockDeep<IRegenerateTokenDependencies['db']>();
	const browserSessionService = mockDeep<IRegenerateTokenDependencies['browserSessionService']>();
	const browserRows = mockDeep<NonNullable<Parameters<IRegenerateTokenDependencies['browserSessionService']['revokeAllOwned']>[1]>>();
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUser) return users as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiBrowserSession) return browserRows as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('unsupported synthetic repository');
	});
	db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1);
		if (typeof callback !== 'function') throw new Error('missing synthetic transaction callback');
		return await callback(manager);
	});
	const endpoint = createIRegenerateTokenProcedure({ db, browserSessionService, usersRepository: users, userProfilesRepository: profiles, userAuthService: auth, globalEventService: events });
	const invoke = (proof?: string | null, suppliedPassword = password) => call(endpoint, { password: suppliedPassword, ...(proof === undefined ? {} : { token: proof }) }, { context: testContext(me) });
	const noRotation = () => {
		expect(users.update).not.toHaveBeenCalled();
		expect(db.transaction).not.toHaveBeenCalled();
		expect(browserSessionService.revokeAllOwned).not.toHaveBeenCalled();
		expect(events.publishInternalEvent).not.toHaveBeenCalled();
		expect(events.publishMainStream).not.toHaveBeenCalled();
	};
	return { users, profiles, redis, events, db, browserSessionService, browserRows, me, profile, authenticate, invoke, noRotation };
}

test.each([undefined, null])('MFA rejects missing proof (%s) before any rotation', async proof => {
	const h = fixture();
	await expect(h.invoke(proof)).rejects.toThrow('authentication failed');
	expect(h.authenticate).not.toHaveBeenCalled();
	expect(h.profiles.update).not.toHaveBeenCalled();
	h.noRotation();
});

test('real MFA verifier rejects a wrong TOTP without rotation', async () => {
	const h = fixture();
	await expect(h.invoke('not-a-code')).rejects.toThrow('authentication failed');
	expect(h.authenticate).toHaveBeenCalledWith(h.profile, 'not-a-code');
	expect(h.redis.set).not.toHaveBeenCalled();
	h.noRotation();
});

test('real TOTP verification precedes rotation and publishes its new token', async () => {
	const h = fixture();
	const proof = totp.generate({ timestamp: now });
	await expect(h.invoke(proof)).resolves.toBeUndefined();
	expect(h.redis.set).toHaveBeenCalledWith(expect.stringContaining('2fa:used:synthetic-user:'), proof, 'EX', 90, 'NX');
	const token = h.users.update.mock.calls[0][1].token;
	expect(token).toEqual(expect.any(String));
	expect(token).not.toBe(h.me.token);
	expect(h.events.publishInternalEvent).toHaveBeenCalledWith('userTokenRegenerated', { id: h.me.id, oldToken: h.me.token, newToken: token });
	expect(h.events.publishMainStream).toHaveBeenCalledWith(h.me.id, 'myTokenRegenerated');
	expect(h.authenticate.mock.invocationCallOrder[0]).toBeLessThan(h.users.update.mock.invocationCallOrder[0]);
	expect(h.authenticate.mock.invocationCallOrder[0]).toBeLessThan(h.db.transaction.mock.invocationCallOrder[0]);
	expect(h.browserSessionService.revokeAllOwned).toHaveBeenCalledWith(h.me.id, h.browserRows);
});

test('already-used TOTP cannot rotate the token', async () => {
	const h = fixture();
	h.redis.set.mockResolvedValue(null);
	await expect(h.invoke(totp.generate({ timestamp: now }))).rejects.toThrow('authentication failed');
	h.noRotation();
});

test('backup proof is consumed by the existing verifier before rotation', async () => {
	const h = fixture();
	await expect(h.invoke(backup)).resolves.toBeUndefined();
	expect(h.profiles.update).toHaveBeenCalledWith({ userId: h.me.id }, { twoFactorBackupSecret: [] });
	expect(h.redis.set).not.toHaveBeenCalled();
	expect(h.profiles.update.mock.invocationCallOrder[0]).toBeLessThan(h.users.update.mock.invocationCallOrder[0]);
});

test.each([undefined, null, 'unused-code'])('MFA-off preserves password-only compatibility (%s)', async proof => {
	const h = fixture(false);
	await expect(h.invoke(proof)).resolves.toBeUndefined();
	expect(h.authenticate).not.toHaveBeenCalled();
	expect(h.users.update).toHaveBeenCalledTimes(1);
});

test.each([false, true])('wrong password cannot rotate: MFA enabled=%s', async enabled => {
	const h = fixture(enabled);
	await expect(h.invoke(totp.generate({ timestamp: now }), 'wrong-password')).rejects.toThrow('incorrect password');
	h.noRotation();
});

test('public contract preserves nullable optional proof and rejects malformed proof', () => {
	const schema = IRegenerateTokenContract['~orpc'].inputSchema;
	if (schema === undefined) throw new Error('Expected input schema');
	for (const input of [{ password }, { password, token: null }, { password, token: '123456' }]) {
		expect(v.parse(schema, input)).toEqual(input);
	}
	for (const token of [7, true, {}, []]) {
		expect(v.safeParse(schema, { password, token }).success).toBe(false);
	}
});
