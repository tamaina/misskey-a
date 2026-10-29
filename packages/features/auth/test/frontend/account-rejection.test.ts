/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { refreshCurrentAccount } from '@features/auth/frontend/accounts.js';

const m = vi.hoisted(() => ({
	account: { id: 'current', username: 'synthetic', token: 'synthetic-current' },
	store: { s: { enablePreferencesAutoCloudBackup: true, accountTokens: {} as Record<string, string>, accountInfos: {} as Record<string, unknown> }, set: vi.fn() },
	prefer: { s: { accounts: [] as [string, { id: string; username: string }][] }, commit: vi.fn() },
	api: vi.fn(), backup: vi.fn(), files: vi.fn(), clear: vi.fn(), reload: vi.fn(), choice: vi.fn(), alert: vi.fn(), suspended: vi.fn(), finish: vi.fn(),
}));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: m.account }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: m.store }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: m.prefer }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: {
	setItem: (key: string, value: string) => localStorage.setItem(key, value),
} }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: '/api', host: 'synthetic.test' }));
vi.mock('@features/auth/frontend/ts-messages.vue', () => ({ default: { $locale: {
	accountDeleted: 'Deleted', accountDeletedDescription: 'Deleted account', tokenRevoked: 'Rejected', tokenRevokedDescription: 'Rejected credential', failedToFetchAccountInformation: 'Fetch failed',
} } }));
vi.mock('@features/moderation/frontend/utility/show-suspended-dialog.js', () => ({ showSuspendedDialog: m.suspended }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: m.api }));
vi.mock('@@/js/shared-files.js', () => ({ clearSharedFiles: m.files }));
vi.mock('@features/preferences/frontend/state/utility.js', () => ({ cloudBackup: m.backup }));
vi.mock('@features/auth/frontend/signout-choice.js', () => ({ signoutChoice: m.choice }));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ clear: m.clear, get: vi.fn() }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: m.reload, reloadChannel: { postMessage: vi.fn() } }));
vi.mock('@features/notifications/frontend/utility/encode-push-subscription-key.js', () => ({ encodePushSubscriptionKey: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({
	waiting: () => m.finish, alert: m.alert, popup: vi.fn(() => ({ dispose: vi.fn() })), popupMenu: vi.fn(), success: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
	m.account.id = 'current';
	m.account.username = 'synthetic';
	m.account.token = 'synthetic-current';
	m.store.s.accountTokens = { 'synthetic.test/current': 'synthetic-current' };
	m.store.s.accountInfos = { 'synthetic.test/current': { id: 'current' } };
	m.store.set.mockImplementation((key: 'accountTokens' | 'accountInfos', value: never) => { m.store.s[key] = value; });
	m.prefer.s.accounts = [['synthetic.test', { id: 'current', username: 'synthetic' }]];
	m.prefer.commit.mockImplementation((_key: string, value: typeof m.prefer.s.accounts) => { m.prefer.s.accounts = value; });
	m.files.mockReset().mockResolvedValue(undefined);
	m.clear.mockReset().mockResolvedValue(undefined);
	m.backup.mockReset().mockRejectedValue(new Error('Rejected credential cannot back up'));
	m.api.mockReset().mockRejectedValue(new Error('Rejected credential cannot sign out again'));
	m.alert.mockResolvedValue(undefined);
	m.suspended.mockResolvedValue(undefined);
	localStorage.clear();
	localStorage.setItem('account', 'synthetic-current');
	window.document.cookie = 'token=synthetic-current; Path=/';
	vi.stubGlobal('indexedDB', { deleteDatabase: vi.fn(() => {
		const request: { onsuccess?: () => void } = {};
		queueMicrotask(() => request.onsuccess?.());
		return request;
	}) });
	Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { controller: null, getRegistrations: vi.fn().mockResolvedValue([]) } });
});

const known = [
	['AUTHENTICATION_FAILED', 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14'],
	['USER_IS_DELETED', 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a'],
	['SUSPENDED', 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370'],
];

describe('refresh after a confirmed credential rejection', () => {
	test.each(known)('%s removes last account without backup or another authenticated request', async (code, id) => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error: { code, id } }), { status: 403 }));
		await refreshCurrentAccount();
		expect(window.fetch).toHaveBeenCalledWith('/api/i', expect.objectContaining({ body: JSON.stringify({ i: 'synthetic-current' }) }));
		expect(m.backup).not.toHaveBeenCalled();
		expect(m.api).not.toHaveBeenCalled();
		expect(m.choice).not.toHaveBeenCalled();
		expect(m.store.s.accountTokens).toEqual({});
		expect(m.prefer.s.accounts).toEqual([]);
		expect(localStorage.getItem('account')).toBeNull();
		expect(window.document.cookie).not.toContain('synthetic-current');
		expect(m.reload).toHaveBeenCalledWith('/');
	});

	test.each([400, 401, 403, 404, 429, 500, 503])('unknown status %s preserves account and credentials', async status => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error: { code: 'UNKNOWN', id: 'synthetic-unknown' } }), { status }));
		await refreshCurrentAccount();
		expect(m.store.s.accountTokens).toEqual({ 'synthetic.test/current': 'synthetic-current' });
		expect(m.prefer.s.accounts).toHaveLength(1);
		expect(localStorage.getItem('account')).toBe('synthetic-current');
		expect(window.document.cookie).toContain('synthetic-current');
		expect(m.files).not.toHaveBeenCalled();
		expect(m.reload).not.toHaveBeenCalled();
		expect(m.choice).not.toHaveBeenCalled();
	});

	test('unstructured 4xx body cannot overwrite the current account', async () => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ message: 'synthetic bad request' }), { status: 400 }));
		await refreshCurrentAccount();
		expect(m.account.id).toBe('current');
		expect(m.store.s.accountTokens).toEqual({ 'synthetic.test/current': 'synthetic-current' });
		expect(m.files).not.toHaveBeenCalled();
	});

	test('network failure retains account without automatic cleanup', async () => {
		vi.mocked(window.fetch).mockRejectedValue(new TypeError('synthetic offline'));
		await refreshCurrentAccount();
		expect(localStorage.getItem('account')).toBe('synthetic-current');
		expect(m.store.s.accountTokens).toEqual({ 'synthetic.test/current': 'synthetic-current' });
		expect(m.files).not.toHaveBeenCalled();
		expect(m.choice).not.toHaveBeenCalled();
	});

	test('known ID in a 5xx response does not authorize automatic credential cleanup', async () => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error: { id: known[0][1] } }), { status: 503 }));
		await refreshCurrentAccount();
		expect(m.store.s.accountTokens).toEqual({ 'synthetic.test/current': 'synthetic-current' });
		expect(m.files).not.toHaveBeenCalled();
	});

	test('refresh waits for last-account cleanup instead of leaving a dangling signout', async () => {
		vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ error: { id: known[0][1] } }), { status: 401 }));
		let finish!: () => void;
		m.files.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
		let settled = false;
		const refresh = refreshCurrentAccount().then(() => { settled = true; });
		await vi.waitFor(() => expect(m.files).toHaveBeenCalledOnce());
		expect(settled).toBe(false);
		finish();
		await refresh;
		expect(settled).toBe(true);
	});

	test('remaining account is selected and its login is awaited without clearing all accounts', async () => {
		m.store.s.accountTokens['synthetic.test/other'] = 'synthetic-other';
		m.prefer.s.accounts.push(['synthetic.test', { id: 'other', username: 'other' }]);
		vi.mocked(window.fetch)
			.mockResolvedValueOnce(new Response(JSON.stringify({ error: { id: known[0][1] } }), { status: 401 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'other', username: 'other' }), { status: 200 }));
		await refreshCurrentAccount();
		expect(window.fetch).toHaveBeenCalledTimes(2);
		expect(vi.mocked(window.fetch).mock.calls[1][1]?.body).toBe(JSON.stringify({ i: 'synthetic-other' }));
		expect(m.store.s.accountTokens).toEqual({ 'synthetic.test/other': 'synthetic-other' });
		expect(m.prefer.s.accounts).toEqual([['synthetic.test', { id: 'other', username: 'other' }]]);
		expect(JSON.parse(localStorage.getItem('account')!)).toEqual({ id: 'other', username: 'other', token: 'synthetic-other' });
		expect(m.backup).not.toHaveBeenCalled();
		expect(m.api).not.toHaveBeenCalled();
		expect(m.reload).toHaveBeenCalledWith();
	});
});
