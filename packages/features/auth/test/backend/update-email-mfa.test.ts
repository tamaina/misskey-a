/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call } from '@orpc/server';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import type { EntityManager } from 'typeorm';
import { MiUser, MiUserProfile } from '@features/persistence/backend/repositories/models.js';
import { afterEach, expect, test, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createIUpdateEmailProcedure } from '../../backend/endpoints/i/update-email.js';
import type { IUpdateEmailDependencies } from '../../backend/endpoints/i/update-email.js';
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
	profiles.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
	const redis = mockDeep<ConstructorParameters<typeof UserAuthService>[0]>();
	const events = mockDeep<Parameters<typeof createIUpdateEmailProcedure>[0]['globalEventService']>();
	const me = mockDeep<MiLocalUser>({ id: 'synthetic-user', host: null, isDeleted: false, token: 'synthetic-old-token', isSuspended: false, movedToUri: null });
	const profile = mockDeep<NonNullable<Awaited<ReturnType<typeof profiles.findOneByOrFail>>>>({
		userId: me.id, password: bcrypt.hashSync(password, 4), twoFactorEnabled,
		twoFactorSecret: secret, twoFactorBackupSecret: [backup], passkeyMfaEnabled: false, email: 'old@example.test', emailVerified: true, emailVerifyCode: null,
	});
	users.findOneByOrFail.mockResolvedValue(me);
	users.findOne.mockResolvedValue(me);
	profiles.findOneByOrFail.mockResolvedValue(profile);
	profiles.findOneOrFail.mockResolvedValue(profile);
	redis.set.mockResolvedValue('OK');
	const auth = new UserAuthService(redis, users, profiles);
	const authenticate = vi.spyOn(auth, 'twoFactorAuthenticate');
	const db = mockDeep<IUpdateEmailDependencies['db']>();
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUser) return users as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('unsupported synthetic repository');
	});
	db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1);
		if (typeof callback !== 'function') throw new Error('missing synthetic transaction callback');
		return await callback(manager);
	});
	const emailService = mockDeep<IUpdateEmailDependencies['emailService']>(); emailService.validateEmailForAccount.mockResolvedValue({ available: true, reason: null });
	const userEntityService = mockDeep<IUpdateEmailDependencies['userEntityService']>();
	type Packed = Awaited<ReturnType<typeof userEntityService.packSelf>>;
	userEntityService.packSelf.mockResolvedValue(Object.assign(mock<Packed>(), { id: me.id, host: null, emojis: {}, badgeRoles: [], avatarDecorations: [], alsoKnownAs: [], fields: [], verifiedLinks: [], pinnedNoteIds: [], pinnedNotes: [], pinnedPage: null, roles: [], notificationRecieveConfig: {}, unreadAnnouncements: [], mutedWords: [], hardMutedWords: [], mutedInstances: [], mutingNotificationTypes: [], emailNotificationTypes: [], achievements: [], policies: mock<Packed['policies']>({ uploadableFileTypes: [] }), securityKeysList: [] }));
	const endpoint = createIUpdateEmailProcedure({ db, config: { url: 'https://synthetic.example' }, serverSettings: { emailRequiredForSignup: false }, emailService, userEntityService, usersRepository: users, userProfilesRepository: profiles, userAuthService: auth, globalEventService: events });
	const context = testContext(me); context.credential = me.token;
	const invoke = (proof?: string | null, suppliedPassword = password) => call(endpoint, { password: suppliedPassword, email: 'new@example.test', ...(proof === undefined ? {} : { token: proof }) }, { context });
	const noChange = () => { expect(db.transaction).not.toHaveBeenCalled(); expect(emailService.sendEmail).not.toHaveBeenCalled(); expect(events.publishMainStream).not.toHaveBeenCalled(); };
	return { users, profiles, redis, events, db, me, profile, authenticate, invoke, noChange, emailService };
}

test.each([undefined, null, 'not-a-code'])('legacy missing or wrong proof %s preserves email', async proof => {
	const f = fixture(); await expect(f.invoke(proof)).rejects.toThrow('authentication failed'); f.noChange(); expect(f.profiles.update).not.toHaveBeenCalled();
});
test('real legacy TOTP is checked before the locked single email update', async () => {
	const f = fixture(); await f.invoke(totp.generate({ timestamp: now }));
	expect(f.redis.set).toHaveBeenCalledWith(expect.stringContaining('2fa:used:synthetic-user:'), expect.any(String), 'EX', 90, 'NX');
	expect(f.profiles.update).toHaveBeenCalledExactlyOnceWith({ userId: f.me.id }, { email: 'new@example.test', emailVerified: false, emailVerifyCode: expect.any(String) });
	expect(f.authenticate.mock.invocationCallOrder[0]).toBeLessThan(f.db.transaction.mock.invocationCallOrder[0]); expect(f.emailService.sendEmail).toHaveBeenCalledOnce();
});
test('a consumed TOTP cannot authorize email changes', async () => { const f = fixture(); f.redis.set.mockResolvedValue(null); await expect(f.invoke(totp.generate({ timestamp: now }))).rejects.toThrow(); f.noChange(); });
test('real recovery code consume precedes the email transaction and is not restored', async () => {
	const f = fixture(); await f.invoke(backup); expect(f.profiles.update).toHaveBeenCalledTimes(2);
	expect(f.profiles.update.mock.invocationCallOrder[0]).toBeLessThan(f.db.transaction.mock.invocationCallOrder[0]); expect(f.emailService.sendEmail).toHaveBeenCalledOnce();
});
test('a rejected recovery-code consume cannot authorize a change', async () => { const f = fixture(); f.profiles.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] }); await expect(f.invoke(backup)).rejects.toThrow(); f.noChange(); });
test('incorrect password rejects after the existing TOTP ordering', async () => { const f = fixture(); await expect(f.invoke(totp.generate({ timestamp: now }), 'wrong')).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' }); expect(f.authenticate).toHaveBeenCalledOnce(); f.noChange(); });
test('legacy policy-disabled behavior needs only its existing password proof', async () => { const f = fixture(false); await f.invoke(); expect(f.authenticate).not.toHaveBeenCalled(); expect(f.emailService.sendEmail).toHaveBeenCalledOnce(); });
