/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import BillingOrderAdministration from '../../frontend/BillingOrderAdministration.vue';

async function flush() { for (let n = 0; n < 8; n++) { await Promise.resolve(); await nextTick(); } }

const offer = { id: 'offer', serviceKey: 'plan', roleId: null, name: 'Plan', chainId: 1, contractAddress: `0x${'1'.repeat(40)}`, recipientAddress: `0x${'2'.repeat(40)}`, tokenSymbol: 'T', decimals: 6, amountBaseUnits: '90071992547409931234567890', duration: 1, durationUnit: 'months' as const, confirmationsRequired: 1, isEnabled: true };
const row = { userId: 'alice', snapshot: null, order: { id: 'order', offer, payerAddress: `0x${'3'.repeat(40)}`, amountBaseUnits: offer.amountBaseUnits, quote: null, status: 'pending' as const, txHash: `0x${'4'.repeat(64)}`, createdAt: 1000, expiresAt: 2000, paidAt: null, startsAt: null, endsAt: null } };

async function mount(client: Record<string, unknown>) {
	const app = createApp(BillingOrderAdministration, { client }), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { element, dispose() { app.unmount(); element.remove(); } };
}

function button(element: Element, label: string) { return [...element.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === label)!; }

test('admin checks stored order only and changing user filter resets pagination cursor', async () => {
	const client = { listAdminBillingOrders: vi.fn(async (_input: unknown) => ({ items: [row], nextCursor: 'cursor' })), checkAdminBillingOrder: vi.fn(async (_input: unknown) => ({ ...row, order: { ...row.order, status: 'paid' as const, paidAt: 1500, startsAt: 1500, endsAt: 2000 } })), getBillingSalesSummary: vi.fn() };
	const view = await mount(client);
	try {
		button(view.element, '読み込む').click(); await flush();
		button(view.element, '支払を再確認').click(); await flush(); expect(client.checkAdminBillingOrder).toHaveBeenCalledExactlyOnceWith({ orderId: 'order' });
		expect(view.element.textContent).toContain('90071992547409931234.56789');
		const input = view.element.querySelector<HTMLInputElement>('input')!; input.value = 'bob'; input.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		button(view.element, '次のページ').click(); await flush(); expect(client.listAdminBillingOrders).toHaveBeenLastCalledWith({ userId: 'bob', limit: 20 });
	} finally { view.dispose(); }
});
test('UTC report range preserves units/unknown tax and invalid reload clears old summary', async () => {
	const bucket = { assetKey: 'asset:test', currencyCode: 'JPY', decimals: 6, count: 1, unknownTaxCount: 1, grossBaseUnits: offer.amountBaseUnits, netBaseUnits: null, taxBaseUnits: null };
	const client = { listAdminBillingOrders: vi.fn(), checkAdminBillingOrder: vi.fn(), getBillingSalesSummary: vi.fn(async (input: { from: number; to: number }) => ({ ...input, count: 1, unknownTaxCount: 1, byCurrency: [bucket], byTax: [bucket], byPlan: [bucket], byAsset: [bucket] })) };
	const view = await mount(client);
	try {
		const dates = view.element.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
		for (const [index, value] of ['2026-10-01T00:00', '2026-11-01T00:00'].entries()) { dates[index].value = value; dates[index].dispatchEvent(new Event('input', { bubbles: true })); } await flush();
		const form = view.element.querySelector('form')!; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.getBillingSalesSummary).toHaveBeenCalledExactlyOnceWith({ from: Date.UTC(2026, 9, 1), to: Date.UTC(2026, 10, 1) });
		expect(view.element.textContent).toContain('90071992547409931234.56789'); expect(view.element.textContent).toContain('不明（未保存）');
		dates[1].value = dates[0].value; dates[1].dispatchEvent(new Event('input', { bubbles: true })); await flush();
		form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await flush();
		expect(client.getBillingSalesSummary).toHaveBeenCalledTimes(1); expect(view.element.querySelector('table')).toBeNull(); expect(view.element.querySelector('[role="alert"]')).not.toBeNull();
	} finally { view.dispose(); }
});
