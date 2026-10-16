/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import * as os from '@features/ui/frontend/os.js';
import PeerPayments from '../../frontend/PeerPayments.vue';
import PeerTokenSettings from '../../frontend/PeerTokenSettings.vue';

async function mount(component: typeof PeerPayments | typeof PeerTokenSettings, props: Record<string, unknown>) {
	const app = createApp(component, props), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { element, dispose: () => { app.unmount(); element.remove(); } };
}

async function flush() { await vi.dynamicImportSettled(); for (let n = 0; n < 8; n++) { await Promise.resolve(); await nextTick(); } }

test('native opt-in control never publishes or contacts a wallet automatically', async () => {
	const request = vi.fn(async () => { throw new Error('Disconnected synthetic wallet'); });
	const original = Object.getOwnPropertyDescriptor(window, 'ethereum');
	Object.defineProperty(window, 'ethereum', { configurable: true, value: { request } });
	const wallet = { walletId: 'wallet', chainId: 123456, address: `0x${'1'.padStart(40, '0')}`, isPublic: false };
	const client = { ownPublication: vi.fn(async () => [wallet]), listTokens: vi.fn(async () => []), list: vi.fn(async () => []),
																		publish: vi.fn(async (input: { isPublic: boolean }) => { wallet.isPublic = input.isPublic; return { isPublic: input.isPublic }; }) };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ residence: null, isReady: false, requiredSubdivisions: [] }) }, currentUserId: 'alice' });
	try {
		expect(client.publish).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		expect(client.publish).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('受取アドレスを公開する'))!.click(); await flush();
		expect(client.publish).toHaveBeenCalledExactlyOnceWith({ walletId: 'wallet', isPublic: true }); expect(request).not.toHaveBeenCalled();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('非公開に戻す'))!.click(); await flush();
		expect(client.publish).toHaveBeenLastCalledWith({ walletId: 'wallet', isPublic: false }); expect(request).not.toHaveBeenCalled();
	} finally { view.dispose(); if (original) Object.defineProperty(window, 'ethereum', original); else Reflect.deleteProperty(window, 'ethereum'); }
});
test('native peer token form starts without a token or monetary policy and rejects blank configuration', async () => {
	const client = { listSettings: vi.fn(async() => []), saveSettings: vi.fn() }; const view = await mount(PeerTokenSettings, { client });
	try {
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.saveSettings).not.toHaveBeenCalled(); expect(view.element.querySelector('[role="alert"]')).not.toBeNull();
	} finally { view.dispose(); }
});

test('peer prepare requires residence, preserves unknown-key recovery, and keeps existing hash checks available', async () => {
	const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
	const token = { id: 'token', name: 'Synthetic', chainId: 123456, contractAddress: address(3), tokenSymbol: 'TEST', decimals: 6, confirmationsRequired: 3, isEnabled: true };
	const intent = { id: 'intent', token, fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7', senderUserId: 'alice', recipientUserId: 'bob', createdAt: 1, expiresAt: Date.UTC(2030, 0, 1), status: 'pending', txHash: null, logIndex: null, confirmedAt: null, broadcastStartedAt: null, data: '0xa9059cbb' + address(2).slice(2).padStart(64, '0') + '7'.padStart(64, '0') };
	let ready = false;
	const residenceClient = { getResidence: vi.fn(async () => ({ residence: ready ? { country: 'JP', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' } : null, isReady: ready, requiredSubdivisions: [] })) };
	const client = { ownPublication: vi.fn(async () => [{ walletId: 'wallet', chainId: token.chainId, address: address(1), isPublic: false }]), listTokens: vi.fn(async () => [token]), list: vi.fn(async () => [intent]), publicWallets: vi.fn(async () => [{ chainId: token.chainId, address: address(2) }]), prepare: vi.fn(async (_input: unknown) => { throw new Error('Unknown outcome'); }), check: vi.fn(async (_input: unknown) => intent) };
	const view = await mount(PeerPayments, { client, residenceClient, currentUserId: 'alice' });
	const submit = (form: Element) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
	try {
		const load = () => view.element.querySelector<HTMLButtonElement>('button')!.click(); load(); await flush();
		vi.mocked(os.selectUser).mockResolvedValueOnce({ id: 'bob', username: 'bob', host: null } as Awaited<ReturnType<typeof os.selectUser>>);
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '選択')!.click(); await flush();
		const forms = view.element.querySelectorAll('form');
		for (const select of forms[0].querySelectorAll('div[tabindex="0"]')) {
			select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
			if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected peer selection');
			option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		}
		const amount = forms[0].querySelector<HTMLInputElement>('input')!; amount.value = '0.000007'; amount.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		submit(forms[0]); await flush(); expect(client.prepare).not.toHaveBeenCalled();
		ready = true; load(); await flush(); submit(forms[0]); await flush(); expect(client.prepare).toHaveBeenCalledTimes(1);
		ready = false; load(); await flush(); expect(forms[0].querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
		submit(forms[0]); await flush(); expect(client.prepare.mock.calls[1]).toEqual(client.prepare.mock.calls[0]);
		amount.value = '0.000008'; amount.dispatchEvent(new Event('input', { bubbles: true })); await flush(); expect(forms[0].querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		submit(forms[0]); await flush(); expect(client.prepare).toHaveBeenCalledTimes(2);
		const hash = `0x${'a'.repeat(64)}`; const hashInput = forms[1].querySelector<HTMLInputElement>('input')!; hashInput.value = hash; hashInput.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		submit(forms[1]); await flush(); expect(client.check).toHaveBeenCalledWith({ intentId: 'intent', txHash: hash });
	} finally { view.dispose(); }
});

test('unknown wallet send remains blocked after reload while hash recovery stays available', async () => {
	const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
	const token = { id: 'token', name: 'Synthetic', chainId: 123456, contractAddress: address(3), tokenSymbol: 'TEST', decimals: 6, confirmationsRequired: 3, isEnabled: true };
	let intent = { id: 'intent', token, fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7', senderUserId: 'alice', recipientUserId: 'bob', createdAt: 1, expiresAt: Date.UTC(2030, 0, 1), status: 'pending', txHash: null, logIndex: null, confirmedAt: null, broadcastStartedAt: null as number | null, data: '0xa9059cbb' + address(2).slice(2).padStart(64, '0') + '7'.padStart(64, '0') };
	const original = Object.getOwnPropertyDescriptor(window, 'ethereum');
	const request = vi.fn(async (input: { method: string }) => { if (input.method === 'eth_chainId') return '0x1e240'; if (input.method === 'eth_requestAccounts') return [address(1)]; throw new Error('Unknown wallet outcome'); });
	Object.defineProperty(window, 'ethereum', { configurable: true, value: { request } });
	const client = { ownPublication: vi.fn(async () => []), listTokens: vi.fn(async () => []), list: vi.fn(async () => [intent]), start: vi.fn(async () => { intent = { ...intent, broadcastStartedAt: 1000 }; return intent; }), check: vi.fn(async (_input: unknown) => intent) };
	const props = { client, residenceClient: { getResidence: async () => ({ residence: { country: 'JP', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' }, isReady: true, requiredSubdivisions: [] }) }, currentUserId: 'alice' };
	let view = await mount(PeerPayments, props);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		const select = [...view.element.querySelectorAll('div[tabindex="0"]')].at(-1)!;
		select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
		if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected synthetic wallet');
		option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		const send = () => [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '内容を確認してウォレットで送信');
		send()!.click(); await flush(); expect(client.start).toHaveBeenCalledExactlyOnceWith({ intentId: 'intent' }); expect(request.mock.calls.filter(([input]) => input.method === 'eth_sendTransaction')).toHaveLength(1); expect(send()).toBeUndefined();
		view.dispose(); view = await mount(PeerPayments, props); view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		expect(send()).toBeUndefined(); expect(view.element.textContent).toContain('送信開始済み');
		const form = view.element.querySelectorAll('form')[1], input = form.querySelector<HTMLInputElement>('input')!, hash = `0x${'a'.repeat(64)}`;
		input.value = hash; input.dispatchEvent(new Event('input', { bubbles: true })); await flush(); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.check).toHaveBeenCalledWith({ intentId: 'intent', txHash: hash }); expect(request.mock.calls.filter(([item]) => item.method === 'eth_sendTransaction')).toHaveLength(1);
	} finally { view.dispose(); if (original) Object.defineProperty(window, 'ethereum', original); else Reflect.deleteProperty(window, 'ethereum'); }
});

test('recipient picker automatically loads public wallets and discards stale results, failures and cleared selections', async () => {
	let resolveOld!: (value: { chainId: number; address: string }[]) => void;
	const pending = new Promise<{ chainId: number; address: string }[]>(resolve => { resolveOld = resolve; });
	const client = { ownPublication: vi.fn(async () => []), listTokens: vi.fn(async () => []), list: vi.fn(async () => []), publicWallets: vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([{ chainId: 123456, address: `0x${'1'.repeat(40)}` }]), prepare: vi.fn(), start: vi.fn(), check: vi.fn(), publish: vi.fn() };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ isReady: false }) }, currentUserId: 'alice' });
	const button = (name: string) => [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === name)!;
	const pick = async (id: string, host: string | null = null) => {
		vi.mocked(os.selectUser).mockResolvedValueOnce({ id, username: id, host } as Awaited<ReturnType<typeof os.selectUser>>);
		button('選択').click(); await flush();
	};
	try {
		await flush(); expect(client.ownPublication).toHaveBeenCalledTimes(1); expect(client.listTokens).toHaveBeenCalledTimes(1); expect(client.list).toHaveBeenCalledTimes(1);
		await pick('bob'); expect(view.element.textContent).toContain('取得しています');
		expect(os.selectUser).toHaveBeenLastCalledWith({ localOnly: true, includeSelf: false });
		button('解除').click(); await flush(); await pick('carol'); expect(view.element.textContent).toContain('@carol'); expect(view.element.textContent).toContain('公開された受取ウォレットがありません');
		resolveOld([{ chainId: 123456, address: `0x${'2'.repeat(40)}` }]); await flush();
		expect(view.element.textContent).toContain('@carol'); expect(view.element.textContent).toContain('公開された受取ウォレットがありません');
		button('解除').click(); await flush(); await pick('dave'); expect(view.element.textContent).toContain('取得できませんでした');
		button('公開ウォレットを再取得').click(); await flush(); expect(view.element.textContent).not.toContain('取得できませんでした');
		button('解除').click(); await flush(); expect(view.element.textContent).not.toContain('@dave');
		expect(button('送金内容を準備する').disabled).toBe(true);
		await pick('remote', 'example.invalid'); await pick('alice'); expect(client.publicWallets).toHaveBeenCalledTimes(4);
		for (const method of [client.prepare, client.start, client.check, client.publish]) expect(method).not.toHaveBeenCalled();
	} finally { view.dispose(); }
});

test('clearing a recipient invalidates an in-flight wallet failure', async () => {
	let rejectLookup!: (reason: Error) => void;
	const client = { ownPublication: async () => [], listTokens: async () => [], list: async () => [], publicWallets: vi.fn(() => new Promise((_resolve, reject) => { rejectLookup = reject; })) };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ isReady: false }) }, currentUserId: 'alice' });
	const button = (name: string) => [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === name)!;
	try {
		await flush(); vi.mocked(os.selectUser).mockResolvedValueOnce({ id: 'bob', username: 'bob', host: null } as Awaited<ReturnType<typeof os.selectUser>>);
		button('選択').click(); await flush(); button('解除').click(); await flush();
		rejectLookup(new Error('Old failure')); await flush(); expect(view.element.textContent).not.toContain('取得できませんでした'); expect(view.element.textContent).not.toContain('@bob');
	} finally { view.dispose(); }
});

test('an older user dialog cannot replace a newer recipient selection', async () => {
	let resolveFirst!: (user: Awaited<ReturnType<typeof os.selectUser>>) => void;
	vi.mocked(os.selectUser).mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
	vi.mocked(os.selectUser).mockResolvedValueOnce({ id: 'carol', username: 'carol', host: null } as Awaited<ReturnType<typeof os.selectUser>>);
	const client = { ownPublication: async () => [], listTokens: async () => [], list: async () => [], publicWallets: vi.fn(async () => []) };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ isReady: false }) }, currentUserId: 'alice' });
	try {
		await flush(); const choose = () => [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '選択')!.click();
		choose(); await flush(); choose(); await flush();
		resolveFirst({ id: 'bob', username: 'bob', host: null } as Awaited<ReturnType<typeof os.selectUser>>); await flush();
		expect(client.publicWallets).toHaveBeenCalledExactlyOnceWith({ userId: 'carol' }); expect(view.element.textContent).toContain('@carol'); expect(view.element.textContent).not.toContain('@bob');
	} finally { view.dispose(); }
});

test('selected recipient hides picker while its lookup stays valid; clearing restores primary selection', async () => {
	let resolveLookup!: (value: { chainId: number; address: string }[]) => void;
	const address = `0x${'3'.repeat(40)}`;
	const client = { ownPublication: async () => [], listTokens: async () => [], list: async () => [], publicWallets: vi.fn(() => new Promise(resolve => { resolveLookup = resolve; })) };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ isReady: false }) }, currentUserId: 'alice' });
	try {
		await flush(); const choose = () => [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '選択')!.click();
		vi.mocked(os.selectUser).mockResolvedValueOnce({ id: 'bob', username: 'bob', host: null } as Awaited<ReturnType<typeof os.selectUser>>);
		expect([...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '選択')?.className).toContain('primary');
		choose(); await flush(); expect([...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '選択')).toBeUndefined();
		resolveLookup([{ chainId: 123456, address }]); await flush();
		expect(view.element.textContent).toContain('@bob'); expect(view.element.textContent).not.toContain('取得しています'); expect(view.element.textContent).not.toContain('公開された受取ウォレットがありません');
		view.element.querySelectorAll('div[tabindex="0"]')[2].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		const options = vi.mocked(os.popupMenu).mock.calls.at(-1)![0];
		expect(options).toEqual(expect.arrayContaining([expect.objectContaining({ text: `123456 / ${address}` })]));
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '解除')!.click(); await flush();
		expect(view.element.textContent).not.toContain('@bob');
		expect([...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '選択')?.className).toContain('primary');
		expect([...view.element.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === '解除')).toBeUndefined();
	} finally { view.dispose(); }
});
