/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { login } from '@features/auth/frontend/accounts.js';
import { signout } from '@features/auth/frontend/signout.js';

const mocks = vi.hoisted(() => ({
	clearShares: vi.fn(),
	persist: vi.fn(),
	reload: vi.fn(),
	finishWaiting: vi.fn(),
	account: { id: 'A', token: 'old-token' },
}));

vi.mock('@@/js/shared-files.js', () => ({ clearSharedFiles: mocks.clearShares }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: mocks.account }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: 'https://example.test/api', host: 'example.test' }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: { setItem: mocks.persist } }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: { s: { accounts: [] }, commit: vi.fn() } }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: { s: { accountTokens: {}, accountInfos: {}, enablePreferencesAutoCloudBackup: false }, set: vi.fn() } }));
vi.mock('@features/preferences/frontend/state/utility.js', () => ({ cloudBackup: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ waiting: () => mocks.finishWaiting, popup: () => ({ dispose: vi.fn() }), popupMenu: vi.fn(), success: vi.fn(), alert: vi.fn() }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: mocks.reload, reloadChannel: { postMessage: vi.fn() } }));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ clear: vi.fn() }));
vi.mock('@features/moderation/frontend/utility/show-suspended-dialog.js', () => ({ showSuspendedDialog: vi.fn() }));
vi.mock('@features/auth/frontend/ts-messages.vue', () => ({ default: { $locale: {} } }));

describe('shared file cleanup at account boundaries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.clearShares.mockResolvedValue(undefined);
		vi.stubGlobal('indexedDB', {
			deleteDatabase: () => {
				const request: { onsuccess: (() => void) | null } = { onsuccess: null };
				queueMicrotask(() => request.onsuccess?.());
				return request;
			},
		});
		Object.defineProperty(navigator, 'serviceWorker', {
			configurable: true,
			value: { controller: null, getRegistrations: async () => [] },
		});
		vi.spyOn(window, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'B', username: 'second' }), { status: 200 }));
	});

	test('awaits clear before persisting a different account', async () => {
		let release!: () => void;
		mocks.clearShares.mockReturnValue(new Promise<void>(resolve => { release = resolve; }));
		const operation = login('synthetic-token');
		await vi.waitFor(() => expect(mocks.clearShares).toHaveBeenCalledOnce());
		expect(mocks.persist).not.toHaveBeenCalled();
		expect(mocks.reload).not.toHaveBeenCalled();
		release();
		await operation;
		expect(mocks.persist).toHaveBeenCalledOnce();
		expect(mocks.reload).toHaveBeenCalledOnce();
	});

	test('retains drafts on same-account login', async () => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'A', username: 'first' }), { status: 200 }));
		await login('synthetic-token');
		expect(mocks.clearShares).not.toHaveBeenCalled();
		expect(mocks.persist).toHaveBeenCalledOnce();
	});

	test('does not clear drafts when destination authentication fails', async () => {
		vi.mocked(window.fetch).mockRejectedValue(new Error('synthetic auth failure'));
		await expect(login('synthetic-token')).rejects.toThrow('synthetic auth failure');
		expect(mocks.clearShares).not.toHaveBeenCalled();
		expect(mocks.persist).not.toHaveBeenCalled();
	});

	test('does not switch when cleanup fails', async () => {
		mocks.clearShares.mockRejectedValue(new Error('synthetic storage failure'));
		await expect(login('synthetic-token')).rejects.toThrow('synthetic storage failure');
		expect(mocks.persist).not.toHaveBeenCalled();
		expect(mocks.reload).not.toHaveBeenCalled();
	});

	test('awaits shared cleanup before clearing logout credentials', async () => {
		let release!: () => void;
		mocks.clearShares.mockReturnValue(new Promise<void>(resolve => { release = resolve; }));
		localStorage.setItem('synthetic-login', 'A');
		const operation = signout();
		await vi.waitFor(() => expect(mocks.clearShares).toHaveBeenCalledOnce());
		expect(localStorage.getItem('synthetic-login')).toBe('A');
		release();
		// Complete only the existing logout boundary's unrelated database/SW mocks.
		await operation;
		expect(localStorage.getItem('synthetic-login')).toBeNull();
		expect(mocks.reload).toHaveBeenCalledWith('/');
	});

	test('does not drop credentials when shared cleanup fails', async () => {
		mocks.clearShares.mockRejectedValue(new Error('synthetic storage failure'));
		localStorage.setItem('synthetic-login', 'A');
		await expect(signout()).rejects.toThrow('synthetic storage failure');
		expect(localStorage.getItem('synthetic-login')).toBe('A');
		expect(mocks.finishWaiting).toHaveBeenCalledOnce();
		expect(mocks.reload).not.toHaveBeenCalled();
	});
});
