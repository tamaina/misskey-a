/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test, expect, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import BillingChainSettings from '../../frontend/BillingChainSettings.vue';

const chain = { chainId: 123456, name: 'Synthetic chain', confirmationsRequired: 7, isEnabled: false as const };

async function mount(client: { listChains: ReturnType<typeof vi.fn>; upsertChain: ReturnType<typeof vi.fn> }) {
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

test('admin form loads, edits and saves disabled metadata through its typed client', async () => {
	const client = { listChains: vi.fn(async () => [chain]), upsertChain: vi.fn(async () => chain) };
	const view = await mount(client);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click();
		await flush();
		view.element.querySelector<HTMLButtonElement>('li button')!.click();
		await nextTick();
		expect([...view.element.querySelectorAll('input')].map(input => input.value)).toEqual(['123456', 'Synthetic chain', '7']);
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await flush();
		expect(client.upsertChain).toHaveBeenCalledExactlyOnceWith(chain);
		expect(view.element.querySelector('[role="status"]')?.textContent).toBe('無効なチェーン設定を保存しました。');
		expect(view.element.querySelectorAll('input')).toHaveLength(3);
	} finally {
		view.dispose();
	}
});

test('failed admin calls show no success and do not expose server error details', async () => {
	const client = { listChains: vi.fn(async () => { throw new Error('synthetic internal detail'); }), upsertChain: vi.fn() };
	const view = await mount(client);
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click();
		await flush();
		expect(view.element.querySelector('[role="alert"]')?.textContent).toBe('設定を読み込み・保存できませんでした。');
		expect(view.element.textContent).not.toContain('synthetic internal detail');
		expect(view.element.querySelector('[role="status"]')).toBeNull();
		expect(client.upsertChain).not.toHaveBeenCalled();
	} finally {
		view.dispose();
	}
});
