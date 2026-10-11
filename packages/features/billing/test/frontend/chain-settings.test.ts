/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createInternationalization } from 'virtual:vite-vue-internationalization';
import './setup.js';
import { test, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import type { WalletChainSettingsInput } from '../../backend/api.definition.js';
import BillingChainSettings from '../../frontend/BillingChainSettings.vue';

const chain = { chainId: 123456, name: 'Synthetic chain', nativeCurrencyName: 'Synthetic coin', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null, isEnabled: false, hasRpc: true };

async function mount(client: { listChainSettings: ReturnType<typeof vi.fn>; upsertChainSettings: ReturnType<typeof vi.fn> }) {
	const app = createApp(BillingChainSettings, { client });
	const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
	await internationalization.ready;
	app.use(internationalization);
	const element = window.document.createElement('div');
	window.document.body.append(element);
	app.mount(element);
	return { element, dispose: () => { app.unmount(); element.remove(); } };
}

async function flush(): Promise<void> {
	await Promise.resolve();
	await nextTick();
}

test('admin form loads, edits and saves private RPC metadata through its typed client', async () => {
	const client = { listChainSettings: vi.fn(async () => [chain]), upsertChainSettings: vi.fn(async () => chain) };
	const view = await mount(client);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click();
		await flush();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('Synthetic chain'))!.click();
		await nextTick();
		expect([...view.element.querySelectorAll('input:not([type=checkbox])')].map(input => input.value)).toEqual(['123456', '18', 'Synthetic chain', 'Synthetic coin', 'TEST', '', '']);
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await flush();
		const { hasRpc, ...input } = chain;
		expect(hasRpc).toBe(true);
		expect(client.upsertChainSettings).toHaveBeenCalledExactlyOnceWith(input);
		expect(view.element.querySelector('[role="status"]')?.textContent).toBe('チェーン設定を保存しました。');
		expect(view.element.querySelectorAll('input:not([type=checkbox])')).toHaveLength(7);
	} finally {
		view.dispose();
	}
});

test('failed admin calls show no success and do not expose server error details', async () => {
	const client = { listChainSettings: vi.fn(async () => { throw new Error('synthetic internal detail'); }), upsertChainSettings: vi.fn() };
	const view = await mount(client);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click();
		await flush();
		expect(view.element.querySelector('[role="alert"]')?.textContent).toBe('設定を読み込み・保存できませんでした。');
		expect(view.element.textContent).not.toContain('synthetic internal detail');
		expect(view.element.querySelector('[role="status"]')).toBeNull();
		expect(client.upsertChainSettings).not.toHaveBeenCalled();
	} finally {
		view.dispose();
	}
});

test('private RPC replacement is masked and cleared after save; explicit clear sends null rather than a placeholder', async () => {
	const client = { listChainSettings: vi.fn(async () => [chain]), upsertChainSettings: vi.fn(async (input: WalletChainSettingsInput) => ({ ...chain, hasRpc: input.rpcUrl !== null })) };
	const view = await mount(client);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('Synthetic chain'))!.click(); await nextTick();
		const rpc = view.element.querySelector<HTMLInputElement>('input[type=password]')!;
		expect(rpc.value).toBe('');
		rpc.value = 'https://synthetic-fake@rpc.example.test/token';
		rpc.dispatchEvent(new Event('input', { bubbles: true })); await nextTick();
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.upsertChainSettings.mock.calls[0][0].rpcUrl).toBe('https://synthetic-fake@rpc.example.test/token');
		expect(rpc.value).toBe('');
		expect(view.element.textContent).not.toContain('synthetic-fake');
		const clear = view.element.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1];
		clear.click(); await nextTick();
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.upsertChainSettings.mock.calls[1][0].rpcUrl).toBeNull();
		expect(view.element.textContent).toContain('RPC URLが未設定');
	} finally {
		view.dispose();
	}
});
