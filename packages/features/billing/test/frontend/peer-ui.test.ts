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

async function flush() { for (let n = 0; n < 8; n++) { await Promise.resolve(); await nextTick(); } }

test('native opt-in control never publishes or contacts a wallet automatically', async () => {
	const request = vi.fn(async () => { throw new Error('Disconnected synthetic wallet'); });
	const original = Object.getOwnPropertyDescriptor(window, 'ethereum');
	Object.defineProperty(window, 'ethereum', { configurable: true, value: { request } });
	const wallet = { walletId: 'wallet', chainId: 123456, address: `0x${'1'.padStart(40, '0')}`, isPublic: false };
	const client = { ownPublication: vi.fn(async () => [wallet]), listTokens: vi.fn(async () => []), list: vi.fn(async () => []),
																		publish: vi.fn(async (input: { isPublic: boolean }) => { wallet.isPublic = input.isPublic; return { isPublic: input.isPublic }; }) };
	const view = await mount(PeerPayments, { client, residenceClient: { getResidence: async () => ({ residence: null, isReady: false, requiredSubdivisions: [] }) }, currentUserId: 'alice', resolveUser: async () => 'bob' });
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
	const view = await mount(PeerPayments, { client, residenceClient, currentUserId: 'alice', resolveUser: async () => 'bob' });
	const submit = (form: Element) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
	try {
		const load = () => view.element.querySelector<HTMLButtonElement>('button')!.click(); load(); await flush();
		const forms = view.element.querySelectorAll('form'); submit(forms[0]); await flush();
		for (const select of forms[1].querySelectorAll('div[tabindex="0"]')) {
			select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
			if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected peer selection');
			option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		}
		const amount = forms[1].querySelector<HTMLInputElement>('input')!; amount.value = '0.000007'; amount.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		submit(forms[1]); await flush(); expect(client.prepare).not.toHaveBeenCalled();
		ready = true; load(); await flush(); submit(forms[1]); await flush(); expect(client.prepare).toHaveBeenCalledTimes(1);
		ready = false; load(); await flush(); expect(forms[1].querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
		submit(forms[1]); await flush(); expect(client.prepare.mock.calls[1]).toEqual(client.prepare.mock.calls[0]);
		amount.value = '0.000008'; amount.dispatchEvent(new Event('input', { bubbles: true })); await flush(); expect(forms[1].querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		submit(forms[1]); await flush(); expect(client.prepare).toHaveBeenCalledTimes(2);
		const hash = `0x${'a'.repeat(64)}`; const hashInput = forms[2].querySelector<HTMLInputElement>('input')!; hashInput.value = hash; hashInput.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		submit(forms[2]); await flush(); expect(client.check).toHaveBeenCalledWith({ intentId: 'intent', txHash: hash });
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
	const props = { client, residenceClient: { getResidence: async () => ({ residence: { country: 'JP', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' }, isReady: true, requiredSubdivisions: [] }) }, currentUserId: 'alice', resolveUser: async () => 'bob' };
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
		const form = view.element.querySelectorAll('form')[2], input = form.querySelector<HTMLInputElement>('input')!, hash = `0x${'a'.repeat(64)}`;
		input.value = hash; input.dispatchEvent(new Event('input', { bubbles: true })); await flush(); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.check).toHaveBeenCalledWith({ intentId: 'intent', txHash: hash }); expect(request.mock.calls.filter(([item]) => item.method === 'eth_sendTransaction')).toHaveLength(1);
	} finally { view.dispose(); if (original) Object.defineProperty(window, 'ethereum', original); else Reflect.deleteProperty(window, 'ethereum'); }
});
