/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { TotpService } from '../../backend/services/TotpService.js';
import type { MiUserProfile } from '@features/persistence/backend/repositories/models.js';

const code = 'SYNTHETIC'.padEnd(32, 'A');

function fixture() {
	const redis = mockDeep<ConstructorParameters<typeof TotpService>[0]>();
	const users = mockDeep<ConstructorParameters<typeof TotpService>[1]>();
	const profiles = mockDeep<ConstructorParameters<typeof TotpService>[2]>();
	const profile = { userId: 'synthetic', password: 'synthetic-hash', twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', twoFactorBackupSecret: [code] } as MiUserProfile;
	const service = new TotpService(redis, users, profiles);
	const otp = vi.spyOn(service, 'validateOtp').mockResolvedValue(true);
	return { profiles, profile, service, otp, redis };
}

test.each([0, undefined, 2])('database affected=%s cannot authorize or fall back to OTP', async affected => {
	const h = fixture();
	h.profiles.update.mockResolvedValue({ affected, raw: [], generatedMaps: [] });
	await expect(h.service.twoFactorAuthenticate(h.profile, code)).rejects.toThrow('authentication failed');
	expect(h.otp).not.toHaveBeenCalled();
	expect(h.redis.set).not.toHaveBeenCalled();
});

test('exactly one consumed row authorizes without mutating the caller snapshot', async () => {
	const h = fixture();
	h.profiles.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
	await expect(h.service.twoFactorAuthenticate(h.profile, code)).resolves.toBeUndefined();
	expect(h.profile.twoFactorBackupSecret).toEqual([code]);
	expect(h.otp).not.toHaveBeenCalled();
});

test('persistence failure never becomes OTP success', async () => {
	const h = fixture();
	h.profiles.update.mockRejectedValue(new Error('synthetic persistence failure'));
	await expect(h.service.twoFactorAuthenticate(h.profile, code)).rejects.toThrow('synthetic persistence failure');
	expect(h.otp).not.toHaveBeenCalled();
});

test('a non-backup proof retains the existing OTP verifier', async () => {
	const h = fixture();
	await expect(h.service.twoFactorAuthenticate(h.profile, '123456')).resolves.toBeUndefined();
	expect(h.otp).toHaveBeenCalledWith(h.profile.userId, h.profile.twoFactorSecret, '123456');
	expect(h.profiles.update).not.toHaveBeenCalled();
});
