/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as acc from '@features/auth/frontend/accounts.js';

type DeviceState = { accountTokens: Record<string, string>; accountInfos: Record<string, unknown> };

const m = vi.hoisted(() => ({
	account: { id: 'main', username: 'main', token: 'main-token' } as Record<string, unknown>,
	idb: {} as DeviceState, // persisted pizzax::base (device state)
	idbAtReload: null as DeviceState | null,
	store: {
		ready: Promise.resolve(), deviceStateKeyName: 'pizzax::base',
		s: { accountTokens: {} as Record<string, string>, accountInfos: {} as Record<string, unknown> },
		r: { accountTokens: { value: {} as Record<string, string> }, accountInfos: { value: {} as Record<string, unknown> } },
		set: vi.fn(),
	},
	prefer: { s: { accounts: [] as [string, { id: string; username: string }][] }, commit: vi.fn() },
	local: new Map<string, string>(),
	files: vi.fn(), get: vi.fn(), reload: vi.fn(), post: vi.fn(), popup: vi.fn(), signout: vi.fn(),
}));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: m.account }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: m.store }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: m.prefer }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: { setItem: (k: string, v: string) => m.local.set(k, v) } }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ apiUrl: '/api', host: 'example.test' }));
vi.mock('@features/auth/frontend/ts-messages.vue', () => ({ default: { $locale: {} } }));
vi.mock('@features/moderation/frontend/utility/show-suspended-dialog.js', () => ({ showSuspendedDialog: vi.fn() }));
vi.mock('@@/js/shared-files.js', () => ({ clearSharedFiles: m.files }));
vi.mock('@features/auth/frontend/signout.js', () => ({ signout: m.signout }));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ get: m.get }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: m.reload, reloadChannel: { postMessage: m.post } }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: m.popup, waiting: vi.fn(), popupMenu: vi.fn(), success: vi.fn(), alert: vi.fn() }));

const KEY_MAIN = 'example.test/main';
const SUB = { id: 'sub', username: 'sub' };

/** Simulate a page reload: the new page reads only what reached IDB/localStorage. */
function rebootAs(id: string, token: string) {
	const persisted = structuredClone(m.idbAtReload ?? m.idb);
	m.store.s.accountTokens = persisted.accountTokens ?? {};
	m.store.s.accountInfos = persisted.accountInfos ?? {};
	m.store.r.accountTokens.value = m.store.s.accountTokens;
	m.store.r.accountInfos.value = m.store.s.accountInfos;
	for (const k of Object.keys(m.account)) delete m.account[k];
	Object.assign(m.account, { id, username: id, token });
	m.idbAtReload = null;
	m.popup.mockClear();
	vi.mocked(window.fetch).mockClear();
}

function setup(opts: { mainListed: boolean; mainTokenSaved: boolean }) {
	m.idbAtReload = null;
	m.idb = { accountTokens: {}, accountInfos: {} };
	if (opts.mainTokenSaved) m.idb.accountTokens[KEY_MAIN] = 'main-token';
	m.idb.accountInfos[KEY_MAIN] = { id: 'main', username: 'main' }; // written on every boot by persistCurrentAccountInfo
	m.prefer.s.accounts = opts.mainListed ? [['example.test', { id: 'main', username: 'main' }]] : [];
	rebootAs('main', 'main-token');
}

beforeEach(() => {
	vi.resetAllMocks();
	m.local.clear();
	m.files.mockResolvedValue(undefined);
	m.get.mockImplementation(async () => structuredClone(m.idb));
	m.store.set.mockImplementation(async (key: 'accountTokens' | 'accountInfos', value: never) => {
		m.store.r[key].value = m.store.s[key] = value;
		m.idb[key] = structuredClone(value);
	});
	m.prefer.commit.mockImplementation((_k: string, v: typeof m.prefer.s.accounts) => { m.prefer.s.accounts = v; });
	m.reload.mockImplementation(() => { m.idbAtReload = structuredClone(m.idb); });
	m.post.mockImplementation(() => { m.idbAtReload = structuredClone(m.idb); });
	m.popup.mockReturnValue({ dispose: vi.fn() });
	vi.mocked(window.fetch).mockImplementation(async (_u, init) => {
		const i = JSON.parse(String((init as RequestInit).body)).i;
		const user = i === 'main-token' ? { id: 'main', username: 'main' } : { id: 'sub', username: 'sub' };
		return new Response(JSON.stringify(user), { status: 200 });
	});
});

/** Account menu > Add account > Create account, then the signup dialog finishes. */
async function signupFromAccountMenu() {
	const menu = await acc.getAccountMenu({ withExtraOperation: true });
	const parent = menu.find(x => typeof x === 'object' && x && 'type' in x && x.type === 'parent');
	if (typeof parent !== 'object' || !parent || !('type' in parent) || parent.type !== 'parent' || !Array.isArray(parent.children)) throw new Error('Expected add account menu');
	const signup = parent.children[1];
	if (typeof signup !== 'object' || !signup || !('action' in signup)) throw new Error('Expected signup action');
	await signup.action(new PointerEvent('click'));
	await vi.waitFor(() => expect(m.popup).toHaveBeenCalled());
	const done = m.popup.mock.calls[0][2].done;
	await done({ ...SUB, token: 'sub-token' });
	await vi.waitFor(() => expect(m.reload).toHaveBeenCalled());
}

/** Back on the sub account after reload: pick main in the account menu. */
async function switchBackToMain(): Promise<'switched' | 'signin' | 'not-listed'> {
	const accounts = await acc.getAccounts();
	if (!accounts.some(a => a.id === 'main')) return 'not-listed';
	m.popup.mockClear();
	m.reload.mockClear();
	await acc.switchAccount('example.test', 'main');
	const fetched = vi.mocked(window.fetch).mock.calls.some(c => String((c[1] as RequestInit).body).includes('main-token'));
	if (fetched) return 'switched';
	return 'signin';
}

describe('PR230: main -> signup sub -> back to main', () => {
	test('A: main token already saved (normal case)', async () => {
		setup({ mainListed: true, mainTokenSaved: true });
		await signupFromAccountMenu();
		rebootAs('sub', 'sub-token');
		expect(await switchBackToMain()).toBe('switched');
	});

	test('B: main is listed in prefer.accounts but its token never reached accountTokens', async () => {
		setup({ mainListed: true, mainTokenSaved: false });
		await signupFromAccountMenu();
		rebootAs('sub', 'sub-token');
		expect(await switchBackToMain()).toBe('switched');
	});

	test('C: legacy session (main never went through login(); not in prefer.accounts nor accountTokens)', async () => {
		setup({ mainListed: false, mainTokenSaved: false });
		await signupFromAccountMenu();
		rebootAs('sub', 'sub-token');
		expect(await switchBackToMain()).toBe('switched');
	});

	test('D: email-verified signup (signup-complete page calls login(token, "/")) without opening the account menu', async () => {
		setup({ mainListed: true, mainTokenSaved: false });
		await acc.login('sub-token', '/');
		rebootAs('sub', 'sub-token');
		expect(await switchBackToMain()).toBe('switched');
	});
});

describe('current account repair', () => {
	test('waits for the current token to reach IDB before overwriting localStorage', async () => {
		setup({ mainListed: false, mainTokenSaved: false });
		const persist = m.store.set.getMockImplementation()!;
		let release!: () => void;
		m.store.set.mockImplementationOnce(async (key: 'accountTokens' | 'accountInfos', value: never) => {
			await new Promise<void>(resolve => { release = resolve; });
			await persist(key, value);
		});
		const operation = acc.login('sub-token', '/');
		await vi.waitFor(() => expect(m.store.set).toHaveBeenCalledOnce());
		expect(m.local.has('account')).toBe(false);
		expect(m.post).not.toHaveBeenCalled();
		release();
		await operation;
		expect(m.idbAtReload?.accountTokens[KEY_MAIN]).toBe('main-token');
		expect(m.prefer.s.accounts.some(([, user]) => user.id === 'main')).toBe(true);
		rebootAs('sub', 'sub-token');
		expect(await switchBackToMain()).toBe('switched');
	});

	test.each([undefined, 'stale-main-token'])('switching away upserts a listed current token (%s)', async savedToken => {
		setup({ mainListed: true, mainTokenSaved: false });
		if (savedToken) m.store.s.accountTokens[KEY_MAIN] = savedToken;
		await acc.login('sub-token');
		expect(m.idbAtReload?.accountTokens[KEY_MAIN]).toBe('main-token');
		expect(m.idbAtReload?.accountInfos[KEY_MAIN]).toEqual({ id: 'main', username: 'main', token: 'main-token' });
		expect(m.prefer.s.accounts.filter(([, user]) => user.id === 'main')).toHaveLength(1);
	});

	test('switching away updates stale account info and the listed username', async () => {
		setup({ mainListed: true, mainTokenSaved: true });
		m.account.username = 'renamed';
		await acc.login('sub-token');
		expect(m.idbAtReload?.accountInfos[KEY_MAIN]).toEqual({ id: 'main', username: 'renamed', token: 'main-token' });
		expect(m.prefer.s.accounts.filter(([, user]) => user.id === 'main')).toEqual([['example.test', { id: 'main', username: 'renamed' }]]);
	});

	test('a failed current-account save prevents overwriting localStorage and navigation', async () => {
		setup({ mainListed: false, mainTokenSaved: false });
		m.store.set.mockRejectedValueOnce(new Error('IDB write failed'));
		await expect(acc.login('sub-token', '/')).rejects.toThrow('IDB write failed');
		expect(m.local.has('account')).toBe(false);
		expect(m.post).not.toHaveBeenCalled();
		expect(m.reload).not.toHaveBeenCalled();
	});

	test.each([401, 503])('failed boot refresh (%s) does not register a legacy login', async status => {
		setup({ mainListed: false, mainTokenSaved: false });
		vi.mocked(window.fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: { id: 'unknown-error' } }), { status }));
		await acc.refreshCurrentAccount();
		expect(m.store.set).not.toHaveBeenCalled();
		expect(m.prefer.commit).not.toHaveBeenCalled();
	});

	test('boot repairs a legacy login without opening the account menu and is idempotent', async () => {
		setup({ mainListed: false, mainTokenSaved: false });
		await acc.refreshCurrentAccount();
		expect(m.idb.accountTokens[KEY_MAIN]).toBe('main-token');
		expect(m.prefer.s.accounts).toEqual([['example.test', { id: 'main', username: 'main' }]]);
		m.store.set.mockClear();
		m.prefer.commit.mockClear();
		await acc.refreshCurrentAccount();
		expect(m.store.set).not.toHaveBeenCalled();
		expect(m.prefer.commit).not.toHaveBeenCalled();
	});

	test('getAccounts adds an unlisted legacy login even when its token is already saved', async () => {
		setup({ mainListed: false, mainTokenSaved: true });
		expect(await acc.getAccounts()).toEqual([expect.objectContaining({ id: 'main', token: 'main-token' })]);
	});

	test.each([false, true])('rejection cannot be repaired by login or getAccounts (alternative: %s)', async alternative => {
		setup({ mainListed: true, mainTokenSaved: true });
		if (alternative) {
			m.store.s.accountTokens['example.test/sub'] = 'sub-token';
			m.prefer.s.accounts.push(['example.test', SUB]);
		}
		vi.mocked(window.fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: { id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' } }), { status: 401 }));
		await acc.refreshCurrentAccount();
		// Simulate a stale IDB snapshot being read again before navigation completes.
		m.idb.accountTokens[KEY_MAIN] = 'main-token';
		m.idb.accountInfos[KEY_MAIN] = { id: 'main', username: 'main' };
		m.prefer.s.accounts.push(['example.test', { id: 'uncached', username: 'uncached' }]);
		m.get.mockClear();
		expect(await acc.getAccounts()).not.toContainEqual(expect.objectContaining({ id: 'main' }));
		expect(m.get).toHaveBeenCalledWith(m.store.deviceStateKeyName);
		expect(m.store.s.accountTokens[KEY_MAIN]).toBeUndefined();
		expect(m.store.s.accountInfos[KEY_MAIN]).toBeUndefined();
		expect(m.prefer.s.accounts.some(([, user]) => user.id === 'main')).toBe(false);
		if (alternative) {
			expect(m.reload).toHaveBeenCalledOnce();
			expect(m.signout).not.toHaveBeenCalled();
		} else {
			expect(m.signout).toHaveBeenCalledWith('server-rejected-credential');
		}
	});
});
