/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAccounts, getAccountMenu, login, refreshCurrentAccount, switchAccount } from '@features/auth/frontend/accounts.js';

const m = vi.hoisted(() => ({
	account: { id: 'current', username: 'current', token: 'current-token' },
	store: {
		ready: Promise.resolve(), deviceStateKeyName: 'pizzax::test-base',
		s: { accountTokens: {} as Record<string, string>, accountInfos: {} as Record<string, unknown> },
		r: { accountTokens: { value: {} as Record<string, string> }, accountInfos: { value: {} as Record<string, unknown> } },
		set: vi.fn(),
	},
	prefer: { s: { accounts: [] as [string, { id: string; username: string }][] }, commit: vi.fn() },
	files: vi.fn(), get: vi.fn(), reload: vi.fn(), popup: vi.fn(), signout: vi.fn(),
}));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: m.account }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: m.store }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: m.prefer }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: { setItem: vi.fn() } }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: '/api', host: 'example.test' }));
vi.mock('@features/auth/frontend/ts-messages.vue', () => ({ default: { $locale: {} } }));
vi.mock('@features/moderation/frontend/utility/show-suspended-dialog.js', () => ({ showSuspendedDialog: vi.fn() }));
vi.mock('@@/js/shared-files.js', () => ({ clearSharedFiles: m.files }));
vi.mock('@features/auth/frontend/signout.js', () => ({ signout: m.signout }));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ get: m.get }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: m.reload, reloadChannel: { postMessage: vi.fn() } }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: m.popup, waiting: vi.fn(), popupMenu: vi.fn(), success: vi.fn(), alert: vi.fn() }));

beforeEach(() => {
	vi.resetAllMocks();
	m.files.mockResolvedValue(undefined);
	m.store.s.accountTokens = { 'example.test/current': 'current-token' };
	m.store.s.accountInfos = { 'example.test/current': { ...m.account } };
	m.store.r.accountTokens.value = m.store.s.accountTokens;
	m.store.r.accountInfos.value = m.store.s.accountInfos;
	m.store.set.mockImplementation(async (key: 'accountTokens' | 'accountInfos', value: never) => {
		m.store.r[key].value = m.store.s[key] = value;
	});
	m.prefer.s.accounts = ['current', 'other'].map(id => ['example.test', { id, username: id }]);
	m.prefer.commit.mockImplementation((_key: string, value: typeof m.prefer.s.accounts) => { m.prefer.s.accounts = value; });
	m.popup.mockReturnValue({ dispose: vi.fn() });
	vi.mocked(window.fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'other', username: 'other' }), { status: 200 }));
});

function savedOther() {
	return {
		accountTokens: { 'example.test/other': 'idb-token' },
		accountInfos: { 'example.test/other': { id: 'other', username: 'other' } },
	};
}

function signinDone() {
	return m.popup.mock.calls[0][2].done as (res: { id: string; i: string; finished: true }) => Promise<void>;
}

describe('account credential recovery', () => {
	test('switches with an IDB token without opening the signin dialog or writing recovered state back', async () => {
		m.get.mockResolvedValue(savedOther());
		await switchAccount('example.test', 'other');
		expect(m.get).toHaveBeenCalledWith(m.store.deviceStateKeyName);
		expect(window.fetch).toHaveBeenCalledWith('/api/i', expect.objectContaining({ body: JSON.stringify({ i: 'idb-token' }) }));
		expect(m.popup).toHaveBeenCalledOnce(); // Waiting dialog only.
		expect(m.popup.mock.calls[0][1]).toHaveProperty('showing');
		expect(m.store.set).not.toHaveBeenCalled();
		expect(m.store.r.accountTokens.value['example.test/other']).toBe('idb-token');
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('prefers memory credentials without reading IDB', async () => {
		m.store.s.accountTokens['example.test/other'] = 'memory-token';
		m.store.s.accountInfos['example.test/other'] = { id: 'other' };
		await switchAccount('example.test', 'other');
		expect(m.get).not.toHaveBeenCalled();
		expect(window.fetch).toHaveBeenCalledWith('/api/i', expect.objectContaining({ body: JSON.stringify({ i: 'memory-token' }) }));
	});

	test.each([undefined, 'old-token'])('repairs an existing listed account with token %s without duplicating it', async oldToken => {
		if (oldToken) m.store.s.accountTokens['example.test/other'] = oldToken;
		await login('new-token');
		expect(m.store.s.accountTokens['example.test/other']).toBe('new-token');
		expect(m.store.s.accountInfos['example.test/other']).toEqual({ id: 'other', username: 'other' });
		expect(m.prefer.s.accounts).toHaveLength(2);
		expect(m.prefer.commit).not.toHaveBeenCalled();
	});

	test('waits for both token and info persistence before reload', async () => {
		const releases: (() => void)[] = [];
		m.store.set.mockImplementation((key: 'accountTokens' | 'accountInfos', value: never) => {
			m.store.s[key] = value;
			return new Promise<void>(resolve => releases.push(resolve));
		});
		const operation = login('new-token');
		await vi.waitFor(() => expect(releases).toHaveLength(1));
		expect(m.reload).not.toHaveBeenCalled();
		releases[0]();
		await vi.waitFor(() => expect(releases).toHaveLength(2));
		expect(m.reload).not.toHaveBeenCalled();
		releases[1]();
		await operation;
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('opens signin when neither memory nor IDB has a token', async () => {
		await switchAccount('example.test', 'other');
		expect(m.popup).toHaveBeenCalledOnce();
		expect(m.popup.mock.calls[0][1]).toEqual({});
		expect(window.fetch).not.toHaveBeenCalled();
	});

	test('waits for signin token persistence before logging in', async () => {
		await switchAccount('example.test', 'other');
		let release!: () => void;
		m.store.set.mockImplementationOnce((_key: string, value: Record<string, string>) => {
			m.store.s.accountTokens = value;
			return new Promise<void>(resolve => { release = resolve; });
		});
		const operation = signinDone()({ id: 'other', i: 'signin-token', finished: true });
		expect(window.fetch).not.toHaveBeenCalled();
		release();
		await operation;
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('recovers account info for menu selection without signin', async () => {
		m.get.mockResolvedValue(savedOther());
		const choose = vi.fn();
		const menu = await getAccountMenu({ withExtraOperation: false, onChoose: choose });
		const item = menu[0];
		if (typeof item !== 'object' || !item || !('type' in item) || item.type !== 'user') throw new Error('Expected user menu item');
		await item.action?.(new PointerEvent('click'));
		expect(choose).toHaveBeenCalledWith(savedOther().accountInfos['example.test/other']);
		expect(m.popup).not.toHaveBeenCalled();
	});

	test('menu signin waits for token persistence before switching', async () => {
		const menu = await getAccountMenu({ withExtraOperation: false });
		const item = menu[0];
		if (typeof item !== 'object' || !item || !('action' in item)) throw new Error('Expected account button');
		await item.action(new PointerEvent('click'));
		expect(m.popup.mock.calls[0][1]).toEqual({ initialUsername: 'other' });
		let release!: () => void;
		m.store.set.mockImplementationOnce((_key: string, value: Record<string, string>) => {
			m.store.s.accountTokens = value;
			return new Promise<void>(resolve => { release = resolve; });
		});
		const operation = signinDone()({ id: 'other', i: 'signin-token', finished: true });
		expect(window.fetch).not.toHaveBeenCalled();
		release();
		await operation;
		expect(m.reload).toHaveBeenCalledOnce();
	});

	test('IDB info recovery does not overwrite a newer in-memory token', async () => {
		m.store.s.accountTokens['example.test/other'] = 'memory-token';
		m.get.mockResolvedValue(savedOther());
		await switchAccount('example.test', 'other');
		expect(m.get).toHaveBeenCalledOnce();
		expect(m.store.s.accountTokens['example.test/other']).toBe('memory-token');
		expect(m.store.set).not.toHaveBeenCalled();
	});

	test('repairs the current token before listing accounts and preserves other IDB credentials', async () => {
		m.store.s.accountTokens = {};
		m.store.s.accountInfos = {};
		m.get.mockResolvedValue(savedOther());
		const accounts = await getAccounts();
		expect(accounts.map(a => a.token)).toEqual(['current-token', 'idb-token']);
		expect(m.store.set).toHaveBeenCalledWith('accountTokens', { 'example.test/current': 'current-token', 'example.test/other': 'idb-token' });
		expect(m.store.s.accountInfos['example.test/current']).toMatchObject({ id: 'current' });
	});

	test('preserves an existing IDB token for the current account', async () => {
		m.store.s.accountTokens = {};
		m.get.mockResolvedValue({ ...savedOther(), accountTokens: { 'example.test/current': 'saved-current', ...savedOther().accountTokens } });
		await getAccounts();
		expect(m.store.s.accountTokens['example.test/current']).toBe('saved-current');
		expect(m.store.set).not.toHaveBeenCalled();
	});

	test('selects an IDB-only alternative after credential rejection without restoring the rejected token', async () => {
		m.get.mockResolvedValue(savedOther());
		vi.mocked(window.fetch)
			.mockResolvedValueOnce(new Response(JSON.stringify({ error: { id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' } }), { status: 401 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'other', username: 'other' }), { status: 200 }));
		await refreshCurrentAccount();
		expect(m.store.s.accountTokens).toEqual({ 'example.test/other': 'idb-token' });
		expect(m.signout).not.toHaveBeenCalled();
		expect(m.reload).toHaveBeenCalledOnce();
	});
});
