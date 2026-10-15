/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import BillingPurchasePolicy from '../../frontend/BillingPurchasePolicy.vue';
import PurchaseReceipt from '../../frontend/PurchaseReceipt.vue';
import type { Component } from 'vue';

async function mount(component: Component, props: Record<string, unknown>) {
	const app = createApp(component, props), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { element, dispose() { app.unmount(); element.remove(); } };
}

async function flush() { for (let n = 0; n < 8; n++) { await Promise.resolve(); await nextTick(); } }

test('native policy form preserves CAS revision, source global statement and integer rate', async () => {
	const policy = { residenceRequiredSubdivisions: ['US'], isEnabled: true, trustedProxyCidrs: ['127.0.0.1/32'], regionRules: { mode: 'allow', rules: [{ country: 'JP' }] }, taxName: 'Tax', taxRate: '0.100000000000000001', seller: { name: 'Synthetic seller', address: 'Address', invoiceRegistrationNumber: 'Registration' }, statementText: 'Synthetic statement' };
	const input = { revision: 5, policy };
	const client = { getBillingPolicy: vi.fn(async () => input), upsertBillingPolicy: vi.fn(async (_input: unknown) => input) };
	const view = await mount(BillingPurchasePolicy, { client });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		expect(view.element.textContent).toContain('JP / 日本'); expect(view.element.textContent).toContain('US / アメリカ合衆国');
		view.element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.upsertBillingPolicy).toHaveBeenCalledExactlyOnceWith(input);
	} finally { view.dispose(); }
});
test('purchase receipt displays frozen metadata with exact units and explicitly marks legacy metadata absent', async () => {
	const order = { id: 'receipt', offer: { name: 'Synthetic', decimals: 6, tokenSymbol: 'T', chainId: 1 }, paidAt: 1000, amountBaseUnits: '123456789012345678901234567', txHash: null };
	const receipt = { order, snapshot: { seller: { name: 'Original seller', address: 'Original address', invoiceRegistrationNumber: 'Original number' }, statement: { country: 'JP', statement: 'Original statement' }, tax: { currencyCode: 'JPY', name: 'Tax', rate: '0.1', includedBaseUnits: order.amountBaseUnits, excludedBaseUnits: '1000000', taxBaseUnits: '2000000' } } };
	const view = await mount(PurchaseReceipt, { receipt });
	try { expect(view.element.textContent).toContain('Original seller'); expect(view.element.textContent).toContain('Original statement'); expect(view.element.textContent).toContain('123456789012345678901.234567'); } finally { view.dispose(); }
	const legacy = await mount(PurchaseReceipt, { receipt: { order, snapshot: null } });
	try { expect(legacy.element.textContent).toContain('保存済み情報がありません'); } finally { legacy.dispose(); }
});
