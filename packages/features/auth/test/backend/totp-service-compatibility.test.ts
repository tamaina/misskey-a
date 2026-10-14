/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { Test } from '@nestjs/testing';
import * as OTPAuth from 'otpauth';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { TotpService } from '../../backend/services/TotpService.js';
import { UserAuthService } from '../../backend/services/UserAuthService.js';
import { authSecurityServices } from '../../backend/services.js';
import { toNestProviders } from '@features/index/backend/feature-service-provider-types.js';
import type { Inputs } from '@features/index/backend/service-definitions.js';
import type { MiUserProfile } from '@features/persistence/backend/repositories/models.js';

const secret = 'JBSWY3DPEHPK3PXP';
const timestamp = 1800000000000;
const backup = 'a'.repeat(32);
const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
});

function fixture(ctor: typeof TotpService) {
	vi.useFakeTimers();
	vi.setSystemTime(timestamp);
	vi.stubEnv('MISSKEY_TEST_CHECK_DUPLICATED_TOTP', '1');
	const redis = mockDeep<ConstructorParameters<typeof TotpService>[0]>();
	const users = mockDeep<ConstructorParameters<typeof TotpService>[1]>();
	const profiles = mockDeep<ConstructorParameters<typeof TotpService>[2]>();
	profiles.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
	const profile = mockDeep<MiUserProfile>({ userId: 'synthetic-user', twoFactorSecret: secret, twoFactorBackupSecret: [backup, 'b'.repeat(32)] });
	return { redis, profiles, profile, service: new ctor(redis, users, profiles) };
}

test('legacy export is the same canonical constructor and feature declaration', () => {
	expect(UserAuthService).toBe(TotpService);
	expect(UserAuthService.prototype).toBe(TotpService.prototype);
	expect(TotpService.name).toBe('TotpService');
	expect(authSecurityServices.definitions.UserAuthService.ctor).toBe(TotpService);
	expect(Object.values(authSecurityServices.definitions).filter(definition => definition.ctor === TotpService)).toHaveLength(1);
});

test('real Nest resolution shares one instance across both class tokens and the legacy string alias', async () => {
	const group = toNestProviders('totp compatibility', authSecurityServices);
	const input = mockDeep<Inputs<typeof authSecurityServices>>();
	const module = await Test.createTestingModule({ providers: [
		...authSecurityServices.ports.map(port => ({ provide: port.token, useValue: input[port.name as keyof typeof input] })),
		...group.providers,
	] }).compile();
	try {
		expect(module.get(TotpService)).toBe(module.get(UserAuthService));
		expect(module.get('UserAuthService')).toBe(module.get(TotpService));
		expect(module.get(TotpService)).toBeInstanceOf(TotpService);
		expect(group.providers.filter(provider => typeof provider === 'object' && provider.provide === TotpService)).toHaveLength(1);
	} finally {
		await module.close();
	}
});

for (const [label, ctor] of [['canonical', TotpService], ['legacy', UserAuthService]] as const) {
	test(`${label} verifies normalized TOTP and retains fingerprinted replay rejection`, async () => {
		const h = fixture(ctor);
		h.redis.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);
		const token = totp.generate({ timestamp });
		await expect(h.service.twoFactorAuthenticate(h.profile, ` ${token} `)).resolves.toBeUndefined();
		await expect(h.service.twoFactorAuthenticate(h.profile, token)).rejects.toThrow('authentication failed');
		const key = `2fa:used:synthetic-user:${createHash('sha256').update(secret).digest('base64url')}:${totp.counter({ timestamp })}`;
		expect(h.redis.set).toHaveBeenNthCalledWith(1, key, token, 'EX', 90, 'NX');
		expect(h.redis.set).toHaveBeenNthCalledWith(2, key, token, 'EX', 90, 'NX');
	});

	test(`${label} rejects invalid OTP before claiming it or updating persistence`, async () => {
		const h = fixture(ctor);
		await expect(h.service.twoFactorAuthenticate(h.profile, 'invalid-code')).rejects.toThrow('authentication failed');
		expect(h.redis.set).not.toHaveBeenCalled();
		expect(h.profiles.update).not.toHaveBeenCalled();
	});

	test(`${label} consumes only the matching backup code and rejects it after persistence refresh`, async () => {
		const h = fixture(ctor);
		await expect(h.service.twoFactorAuthenticate(h.profile, backup)).resolves.toBeUndefined();
		expect(h.profiles.update).toHaveBeenCalledWith(expect.objectContaining({ userId: h.profile.userId }), { twoFactorBackupSecret: expect.any(Function) });
		expect(h.redis.set).not.toHaveBeenCalled();
		h.profile.twoFactorBackupSecret = ['b'.repeat(32)];
		await expect(h.service.twoFactorAuthenticate(h.profile, backup)).rejects.toThrow('authentication failed');
		expect(h.profiles.update).toHaveBeenCalledOnce();
	});
}
