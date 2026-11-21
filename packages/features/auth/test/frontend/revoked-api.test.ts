/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const m = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'synthetic', token: 'synthetic-current' } }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: '/api' }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ refreshCurrentAccount: m.refresh }));
const rejected = { code: 'AUTHENTICATION_FAILED', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' };
beforeEach(() => { vi.clearAllMocks(); m.refresh.mockResolvedValue(undefined); });

test('precise current-credential 401 requests account revalidation', async () => {
	vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error: rejected }), { status: 401 }));
	await expect(misskeyApi('i')).rejects.toEqual(rejected);
	await vi.waitFor(() => expect(m.refresh).toHaveBeenCalledOnce());
});

test.each([
	[500, rejected, undefined],
	[401, { code: 'AUTHENTICATION_FAILED', id: 'another-proof-error' }, undefined],
	[401, rejected, 'synthetic-other'],
	[401, rejected, null],
] as const)('status %s, error %j, token override %s cannot sign out the current account', async (status, error, token) => {
	vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error }), { status }));
	await expect(misskeyApi('i', {}, token)).rejects.toEqual(error);
	expect(m.refresh).not.toHaveBeenCalled();
});

test('offline request does not request credential cleanup', async () => {
	vi.mocked(window.fetch).mockRejectedValue(new TypeError('synthetic offline'));
	await expect(misskeyApi('i')).rejects.toThrow('synthetic offline');
	expect(m.refresh).not.toHaveBeenCalled();
});
