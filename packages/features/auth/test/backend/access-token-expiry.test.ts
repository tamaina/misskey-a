/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { accessTokenExpired, scheduleTokenExpiry, selectedTokenExpiry } from '../../backend/access-token-expiry.js';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { MiAccessToken } from '../../backend/models/AccessToken.js';
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
test('legacy null/omitted expiry stays unbounded; invalid or exact-deadline dates deny', () => {
	expect(accessTokenExpired({})).toBe(false); expect(accessTokenExpired({ expiresAt: null })).toBe(false);
	for (const expiresAt of [new Date(1000), 'invalid']) expect(accessTokenExpired({ expiresAt }, 1000)).toBe(true);
	expect(accessTokenExpired({ expiresAt: new Date(1001) }, 1000)).toBe(false);
	expect(selectedTokenExpiry(null)).toBeNull(); expect(selectedTokenExpiry(undefined)).toBeNull();
	for (const value of ['invalid', '2999-01-01', '2999-01-01T00:00:00']) expect(() => selectedTokenExpiry(value)).toThrow(); expect(() => selectedTokenExpiry(new Date(1000).toISOString(), 1000)).toThrow();
});
test('idle expiry closes exactly once and canceled or unbounded owners do not close', async () => {
	vi.useFakeTimers(); vi.setSystemTime(1000); const close = vi.fn(); const cancel = scheduleTokenExpiry({ expiresAt: new Date(1100) }, close);
	await vi.advanceTimersByTimeAsync(99); expect(close).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(1); expect(close).toHaveBeenCalledOnce(); cancel();
	const canceled = vi.fn(); const stop = scheduleTokenExpiry({ expiresAt: new Date(1200) }, canceled); stop(); scheduleTokenExpiry({ expiresAt: null }, canceled);
	await vi.advanceTimersByTimeAsync(1000); expect(canceled).not.toHaveBeenCalled();
});
test('explicit long expiry never overflows Node timeout into an immediate close', async () => {
	vi.useFakeTimers(); vi.setSystemTime(0); const close = vi.fn(); const cancel = scheduleTokenExpiry({ expiresAt: new Date(3_000_000_000) }, close);
	await vi.advanceTimersByTimeAsync(2_147_483_647); expect(close).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(852_516_353); expect(close).toHaveBeenCalledOnce(); cancel();
});
test.each([false, true])('HTTP expiry applies before user lookup and preserves app-derived metadata (app=%s)', async app => {
	const users = mockDeep<ConstructorParameters<typeof AuthenticateService>[0]>(); const tokens = mockDeep<ConstructorParameters<typeof AuthenticateService>[1]>();
	const apps = mockDeep<ConstructorParameters<typeof AuthenticateService>[2]>(); const cache = mockDeep<ConstructorParameters<typeof AuthenticateService>[3]>();
	const service = new AuthenticateService(users, tokens, apps, cache, mockDeep());
	const token = Object.assign(new MiAccessToken(), { id: 'token', userId: 'owner', appId: app ? 'app' : null, expiresAt: new Date(Date.now() - 1), permission: ['read:account'] }); tokens.findOne.mockResolvedValue(token);
	await expect(service.authenticate('synthetic-32-character-app-token-value')).rejects.toThrow(); expect(cache.localUserByIdCache.fetch).not.toHaveBeenCalled();
	token.expiresAt = new Date(Date.now() + 60_000); cache.localUserByIdCache.fetch.mockResolvedValue({ id: 'owner' } as never); apps.findOneByOrFail.mockResolvedValue({ permission: ['read:account'] } as never);
	const result = await service.authenticate('synthetic-32-character-app-token-value'); expect(result[1]?.expiresAt).toEqual(token.expiresAt); service.dispose();
});
