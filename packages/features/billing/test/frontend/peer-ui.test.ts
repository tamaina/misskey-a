/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
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
	const view = await mount(PeerPayments, { client, currentUserId: 'alice', resolveUser: async () => 'bob' });
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
