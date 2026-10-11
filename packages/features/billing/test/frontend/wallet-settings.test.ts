/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createInternationalization } from 'virtual:vite-vue-internationalization';
import './setup.js';
import { test, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import WalletSettings from '../../frontend/WalletSettings.vue';
import type { WalletClient } from '../../frontend/wallet-client.js';

const wallet = { id: 'wallet1', address: '0x0000000000000000000000000000000000000001', chainId: 123456, label: null, createdAt: 1, updatedAt: 1 };
const chain = { chainId: 123456, name: 'Synthetic chain', nativeCurrencyName: 'Test', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null };

async function fixture(confirm = true) {
	const client: WalletClient = { list: vi.fn(async () => [wallet]), chains: vi.fn(async () => [chain]),
																																begin: vi.fn(async () => ({ nonce: 'nonce0001', message: 'Synthetic ownership proof' })),
																																verify: vi.fn(async () => wallet), unlink: vi.fn(async () => ({ ok: true as const })),
	};
	const request = vi.fn(async (input: { method: string }) => {
		if (input.method === 'eth_requestAccounts') return [wallet.address];
		if (input.method === 'eth_chainId') return '0x1e240';
		if (input.method === 'personal_sign') return '0x1234';
		throw new Error('Unexpected request');
	});
	const confirmUnlink = vi.fn(async () => confirm);
	const app = createApp(WalletSettings, { client, connectors: [{ id: 'synthetic', name: 'Synthetic wallet', provider: { request } }], confirmUnlink });
	const i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { client, request, confirmUnlink, element, dispose: () => { app.unmount(); element.remove(); } };
}

async function flush() { for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick(); } }

function button(element: HTMLElement, text: string) { return [...element.querySelectorAll<HTMLButtonElement>('button')].find(value => value.textContent?.includes(text))!; }

test('native settings distinguish linked identity and connected wallet; reauth fields clear after registration', async () => {
	const f = await fixture();
	try {
		button(f.element, '読み込む').click(); await flush();
		expect(f.element.textContent).toContain(wallet.address); expect(f.element.textContent).not.toContain('接続中');
		const password = f.element.querySelector<HTMLInputElement>('input[type="password"]')!;
		password.value = 'synthetic password'; password.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		button(f.element, 'Synthetic wallet').click(); await flush();
		expect(f.client.begin).toHaveBeenCalledWith({ chainId: 123456, address: wallet.address, currentPassword: 'synthetic password' });
		expect(f.client.verify).toHaveBeenCalledOnce(); expect(f.element.textContent).toContain('接続中'); expect(password.value).toBe('');
		button(f.element, '登録を解除').click(); await flush();
		expect(f.confirmUnlink).toHaveBeenCalledWith(wallet); expect(f.client.unlink).toHaveBeenCalledWith({ walletId: wallet.id });
		expect(f.element.textContent).not.toContain(wallet.address);
	} finally { f.dispose(); }
});

test('cancelled unlink does not delete; rejected signing does not register or expose error details', async () => {
	const f = await fixture(false);
	try {
		button(f.element, '読み込む').click(); await flush(); button(f.element, '登録を解除').click(); await flush();
		expect(f.client.unlink).not.toHaveBeenCalled(); expect(f.element.textContent).toContain(wallet.address);
		const request = f.request.getMockImplementation()!;
		f.request.mockImplementation(async input => { if (input.method === 'personal_sign') throw new Error('sensitive synthetic error'); return request(input); });
		button(f.element, 'Synthetic wallet').click(); await flush();
		expect(f.client.verify).not.toHaveBeenCalled(); expect(f.element.querySelector('[role="alert"]')).not.toBeNull();
		expect(f.element.textContent).not.toContain('sensitive synthetic error');
	} finally { f.dispose(); }
});
