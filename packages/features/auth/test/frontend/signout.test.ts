/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { signout } from '@features/auth/frontend/signout.js';

const m = vi.hoisted(() => ({ api: vi.fn(), backup: vi.fn(), files: vi.fn(), clear: vi.fn(), reload: vi.fn(), select: vi.fn(), waiting: vi.fn(), finish: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: m.api }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: '/api' }));
vi.mock('@@/js/shared-files.js', () => ({ clearSharedFiles: m.files }));
vi.mock('@features/preferences/frontend/state/utility.js', () => ({ cloudBackup: m.backup }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: { s: { enablePreferencesAutoCloudBackup: true } } }));
vi.mock('@features/ui/frontend/os.js', () => ({ waiting: m.waiting, select: m.select }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: m.reload }));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ clear: m.clear }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { token: 'synthetic-current' } }));
vi.mock('@features/notifications/frontend/utility/encode-push-subscription-key.js', () => ({ encodePushSubscriptionKey: vi.fn() }));
vi.mock('@features/runtime/frontend/i18n.js', () => ({ i18n: { ts: {
	logout: 'Logout', retry: 'Retry', signoutLegacySession: 'Server credential remains valid',
	signoutRevokeFailed: 'Server revocation not confirmed', signoutLocalOnly: 'Logout on this device only',
} } }));

beforeEach(() => {
	vi.clearAllMocks();
	for (const mock of [m.api, m.backup, m.files, m.clear]) mock.mockReset().mockResolvedValue(undefined);
	m.select.mockReset().mockResolvedValue({ canceled: true });
	m.waiting.mockReturnValue(m.finish);
	localStorage.clear();
	localStorage.setItem('account', 'synthetic-current');
	localStorage.setItem('accounts', 'synthetic-other');
	window.document.cookie = 'token=synthetic-current; Path=/';
	vi.stubGlobal('indexedDB', { deleteDatabase: vi.fn(() => {
		const request: { onsuccess?: () => void } = {};
		queueMicrotask(() => request.onsuccess?.());
		return request;
	}) });
	Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { controller: null, getRegistrations: vi.fn().mockResolvedValue([]) } });
});

describe('server-first signout', () => {
	test('waits for revocation after backup before local cleanup and cookie expiry', async () => {
		let revoked!: () => void;
		m.api.mockReturnValue(new Promise<void>(resolve => { revoked = resolve; }));
		const cookieSetter = vi.spyOn(window.document, 'cookie', 'set');
		const result = signout();
		await vi.waitFor(() => expect(m.api).toHaveBeenCalledWith('i/signout'));
		expect(m.backup.mock.invocationCallOrder[0]).toBeLessThan(m.api.mock.invocationCallOrder[0]);
		expect(m.files).not.toHaveBeenCalled();
		expect(localStorage.getItem('account')).toBe('synthetic-current');
		expect(window.document.cookie).toContain('token=synthetic-current');
		revoked();
		await result;
		expect(m.files).toHaveBeenCalledOnce();
		expect(cookieSetter).toHaveBeenCalledWith('token=; Path=/; Max-Age=0; SameSite=Lax');
		cookieSetter.mockRestore();
		expect(localStorage.getItem('account')).toBeNull();
		expect(localStorage.getItem('accounts')).toBeNull();
		expect(window.document.cookie).not.toContain('synthetic-current');
		expect(m.reload).toHaveBeenCalledWith('/');
	});

	test.each(['SESSION_NOT_REVOCABLE', 'NETWORK_ERROR'])('cancelled %s retains both account records and cookie', async code => {
		m.api.mockRejectedValue({ code });
		await signout();
		expect(m.files).not.toHaveBeenCalled();
		expect(localStorage.getItem('account')).toBe('synthetic-current');
		expect(localStorage.getItem('accounts')).toBe('synthetic-other');
		expect(window.document.cookie).toContain('token=synthetic-current');
		expect(m.reload).not.toHaveBeenCalled();
		expect(m.finish.mock.invocationCallOrder[0]).toBeLessThan(m.select.mock.invocationCallOrder[0]);
	});

	test('legacy login offers only explicit device cleanup, with no revocation claim', async () => {
		m.api.mockRejectedValue({ code: 'SESSION_NOT_REVOCABLE' });
		m.select.mockResolvedValue({ canceled: false, result: 'local' });
		await signout();
		expect(m.select).toHaveBeenCalledWith(expect.objectContaining({ text: 'Server credential remains valid', items: [{ label: 'Logout on this device only', value: 'local' }] }));
		expect(m.api).toHaveBeenCalledOnce();
		expect(localStorage.getItem('account')).toBeNull();
		expect(localStorage.getItem('accounts')).toBeNull();
		expect(window.document.cookie).not.toContain('synthetic-current');
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('network retry retains credentials until successful server revocation', async () => {
		m.api.mockRejectedValueOnce(new TypeError('synthetic offline')).mockImplementationOnce(async () => {
			expect(m.files).not.toHaveBeenCalled();
			expect(localStorage.getItem('account')).toBe('synthetic-current');
		});
		m.select.mockResolvedValue({ canceled: false, result: 'retry' });
		await signout();
		expect(m.select).toHaveBeenCalledWith(expect.objectContaining({ text: 'Server revocation not confirmed', items: [{ label: 'Retry', value: 'retry' }, { label: 'Logout on this device only', value: 'local' }] }));
		expect(m.api).toHaveBeenCalledTimes(2);
		expect(m.backup).toHaveBeenCalledOnce();
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('network failure allows explicit local-only cleanup', async () => {
		m.api.mockRejectedValue(new TypeError('synthetic offline'));
		m.select.mockResolvedValue({ canceled: false, result: 'local' });
		await signout();
		expect(m.api).toHaveBeenCalledOnce();
		expect(localStorage.getItem('account')).toBeNull();
		expect(localStorage.getItem('accounts')).toBeNull();
		expect(window.document.cookie).not.toContain('synthetic-current');
	});

	test('backup failure releases waiting without clearing or revoking credentials', async () => {
		m.backup.mockRejectedValue(new Error('synthetic backup error'));
		await expect(signout()).rejects.toThrow('synthetic backup error');
		expect(m.api).not.toHaveBeenCalled();
		expect(m.files).not.toHaveBeenCalled();
		expect(localStorage.getItem('account')).toBe('synthetic-current');
		expect(m.finish).toHaveBeenCalledOnce();
	});
});
