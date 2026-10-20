/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import CatalogAdministration from '../../frontend/CatalogAdministration.vue';
const asset = { id: 'asset', pricingAssetKey: 'units', name: 'Synthetic asset', symbol: 'T', currencyCode: 'JPY', isEnabled: true };
const deployment = { id: 'deployment', assetId: asset.id, chainId: 1, contractAddress: `0x${'1'.repeat(40)}`, recipientAddress: `0x${'2'.repeat(40)}`, tokenSymbol: 'T', tokenName: 'Synthetic token', decimals: 6, isEnabled: true };

async function flush() { for (let i = 0; i < 4; i++) { await Promise.resolve(); await nextTick(); } }

async function mount() {
	const client = { listPricingAssets: vi.fn(async () => [asset]), listAssetDeployments: vi.fn(async () => [deployment]), listCatalogPrices: vi.fn(async () => []), upsertPricingAsset: vi.fn(async input => input), upsertAssetDeployment: vi.fn(async input => input), resolveTokenMetadata: vi.fn(async () => ({ tokenSymbol: null, tokenName: null, decimals: 18 })), testBillingChainRpc: vi.fn(async () => ({ chainId: 1, ok: true })) };
	const app = createApp(CatalogAdministration, { client }), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { element, client, dispose: () => { app.unmount(); element.remove(); } };
}

function button(element: HTMLElement, text: string) { return [...element.querySelectorAll<HTMLButtonElement>('button')].find(row => row.textContent?.trim() === text)!; }

test('native asset and deployment forms preserve metadata and RPC success is bound to checked chain', async () => {
	const view = await mount();
	try {
		button(view.element, '読み込む').click(); await flush();
		button(view.element, asset.name).click(); await flush();
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(view.client.upsertPricingAsset).toHaveBeenCalledExactlyOnceWith(asset);
		button(view.element, 'T (1)').click(); await flush();
		button(view.element, 'トークン情報を取得').click(); await flush();
		const form = view.element.querySelectorAll('form')[1];
		form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(view.client.upsertAssetDeployment).toHaveBeenCalledExactlyOnceWith({ ...deployment, decimals: 18 });
		button(view.element, 'チェーンRPCを確認').click(); await flush(); expect(view.element.textContent).toContain('チェーンIDの一致を確認しました。');
		const chain = form.querySelectorAll<HTMLInputElement>('input')[1]; chain.value = '2'; chain.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		expect(view.element.textContent).not.toContain('チェーンIDの一致を確認しました。');
	} finally { view.dispose(); }
});
