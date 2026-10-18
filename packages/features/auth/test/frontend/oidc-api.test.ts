/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
const setup = vi.hoisted(() => ({ apiUrl: '/api', account: { token: 'bs_synthetic' } }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ get apiUrl() { return setup.apiUrl; } }));
vi.mock('../../frontend/i.js', () => ({ get $i() { return setup.account; } }));
import { oidcApi } from '../../frontend/oidc-api.js';
beforeEach(() => { setup.apiUrl = '/api'; vi.spyOn(window, 'fetch').mockResolvedValue({ status: 200, json: async () => [] } as Response); });
afterEach(() => vi.restoreAllMocks());
test('only OIDC requests carry same-origin cookies and the current individual credential', async () => {
	await oidcApi('oidc/providers', {});
	expect(window.fetch).toHaveBeenCalledExactlyOnceWith('/api/oidc/providers', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ i: setup.account.token }) });
});
test('a remote API origin cannot receive the browser binding or local credential', async () => {
	setup.apiUrl = 'https://remote.example/api'; await expect(oidcApi('oidc/providers', {})).rejects.toThrow('Same-origin'); expect(window.fetch).not.toHaveBeenCalled();
});
test('an unrelated endpoint cannot opt into credential cookies', async () => {
	await expect(oidcApi('i' as 'oidc/providers', {})).rejects.toThrow('Same-origin'); expect(window.fetch).not.toHaveBeenCalled();
});

test('the owning operation cancellation signal reaches the browser request', async () => {
	const controller = new AbortController(); await oidcApi('oidc/start', { providerId: 'synthetic' }, controller.signal);
	expect(window.fetch).toHaveBeenCalledWith('/api/oidc/start', expect.objectContaining({ signal: controller.signal }));
});
