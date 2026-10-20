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
import ServiceOfferSettings from '../../frontend/ServiceOfferSettings.vue';
import { formatServiceAmount } from '../../frontend/service-client.js';
import ServiceSubscriptions from '../../frontend/ServiceSubscriptions.vue';
import type { ServiceOffer } from '../../backend/api.definition.js';
const offer: ServiceOffer = { id: 'offer', serviceKey: 'synthetic-service', roleId: null, name: 'Synthetic term', chainId: 123456, contractAddress: `0x${'3'.padStart(40, '0')}`, recipientAddress: `0x${'9'.padStart(40, '0')}`, tokenSymbol: 'TEST', decimals: 6, amountBaseUnits: '123456789012345678901234567', duration: 1, durationUnit: 'months', confirmationsRequired: 3, isEnabled: true };

async function mount(component: typeof ServiceOfferSettings | typeof ServiceSubscriptions, props: Record<string, unknown>) {
	const app = createApp(component, props); const i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	return { element, dispose: () => { app.unmount(); element.remove(); } };
}

async function flush() { for (let n = 0; n < 8; n++) { await Promise.resolve(); await nextTick(); } }

function submit(element: Element) { element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }

test('admin has no price/recipient defaults; invalid blank input does not call API', async () => {
	const client = { listOfferSettings: vi.fn(async () => []), upsertOffer: vi.fn(async () => offer) }; const view = await mount(ServiceOfferSettings, { client });
	try { submit(view.element.querySelector('form')!); await flush(); expect(client.upsertOffer).not.toHaveBeenCalled(); expect(view.element.querySelector('[role="alert"]')).not.toBeNull(); } finally { view.dispose(); }
});
test('real native admin form preserves large base units and explicit offer configuration', async () => {
	const client = { listOfferSettings: vi.fn(async () => [offer]), upsertOffer: vi.fn(async () => offer) }; const view = await mount(ServiceOfferSettings, { client });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === offer.name)!.click(); await flush();
		expect([...view.element.querySelectorAll<HTMLInputElement>('input')].map(input => input.value)).toContain(offer.amountBaseUnits);
		submit(view.element.querySelector('form')!); await flush(); expect(client.upsertOffer).toHaveBeenCalledExactlyOnceWith(offer);
	} finally { view.dispose(); }
});
test('account retry reuses its idempotency key, checks order hash ', async () => {
	const order = { id: 'order', offer, payerAddress: `0x${'1'.padStart(40, '0')}`, status: 'pending' as const, txHash: null, createdAt: 1000, expiresAt: 1801000, paidAt: null, startsAt: null, endsAt: null };
	const client = { listCatalog: vi.fn(async () => [{ offer, priceHistory: [], priceDisplayWindow: { previousPeriod: null, currentPeriod: null, nextPeriod: null }, dealDisplay: { canShowDeal: false, referenceAmountBaseUnits: null, reason: 'reference_not_higher' as const, checkedFrom: 0, checkedTo: 1000, referenceSoldMs: 0, totalSoldMs: 0, referenceLastSoldAt: null } }]), quoteOrder: vi.fn(async () => ({ revision: 0, quote: { quoteCreatedAt: 1000, quoteExpiresAt: 901000, baseAmountBaseUnits: offer.amountBaseUnits, discountBaseUnits: '0', payableAmountBaseUnits: offer.amountBaseUnits, discountAssignmentIds: [], effectiveStartsAt: 1000, effectiveExpiresAt: 100000, currentPlan: null } })), cancelOrder: vi.fn(async () => ({ ok: true })), listOffers: vi.fn(async () => [offer]), listOrders: vi.fn(async () => [order]), listTransfers: vi.fn(async () => []), createOrder: vi.fn(async () => order), checkOrder: vi.fn(async () => order), detectTransfer: vi.fn(async () => ({ status: 'pending' as const, transfer: null })) };
	client.createOrder.mockRejectedValueOnce(new Error('synthetic private failure'));
	const view = await mount(ServiceSubscriptions, { client, listWallets: async () => [{ id: 'wallet', chainId: offer.chainId, address: order.payerAddress, label: null, createdAt: 1, updatedAt: 1 }] });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		for (const select of view.element.querySelectorAll('div[tabindex="0"]')) {
			select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
			const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!;
			const item = call[0][0];
			if (!item || !('action' in item) || typeof item.action !== 'function') throw new Error('Expected native select option');
			item.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		}
		const create = view.element.querySelector('form')!; submit(create); await flush();
		expect(view.element.textContent).not.toContain('synthetic private failure');
		submit(create); await flush(); expect(client.createOrder.mock.calls).toHaveLength(2); expect(client.createOrder.mock.calls[0]).toEqual(client.createOrder.mock.calls[1]);
		const hash = `0x${'a'.repeat(64)}`; const input = view.element.querySelectorAll<HTMLInputElement>('input')[0]; input.value = hash; input.dispatchEvent(new Event('input', { bubbles: true })); await flush();
		submit(view.element.querySelectorAll('form')[1]); await flush(); expect(client.checkOrder).toHaveBeenCalledWith({ orderId: order.id, txHash: hash });
	} finally { view.dispose(); }
});

test('amount display keeps exact integer precision and token decimals', () => {
	expect(formatServiceAmount('123456789012345678901234567', 6)).toBe('123456789012345678901.234567');
	expect(formatServiceAmount('7', 6)).toBe('0.000007');
	expect(formatServiceAmount('7000000', 6)).toBe('7');
	expect(formatServiceAmount('7', 0)).toBe('7');
});

test('scheduled admin price retains exact timestamps when its minute-level fields are unchanged', async () => {
	const scheduled = { ...offer, priceStartsAt: Date.UTC(2026, 9, 15, 2, 3, 4, 567), priceExpiresAt: Date.UTC(2026, 10, 15, 2, 3, 4, 567) };
	const client = { listOfferSettings: vi.fn(async () => [scheduled]), upsertOffer: vi.fn(async () => scheduled) };
	const view = await mount(ServiceOfferSettings, { client });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === offer.name)!.click(); await flush();
		submit(view.element.querySelector('form')!); await flush();
		expect(client.upsertOffer).toHaveBeenCalledExactlyOnceWith(scheduled);
	} finally { view.dispose(); }
});
test('account catalog displays only server-eligible reference and scheduled next price', async () => {
	const period = { id: 'future', priceId: 'future', assetId: 'T', planId: offer.serviceKey, amountBaseUnits: '456000000', durationDays: 1, durationUnit: 'months' as const, isEnabled: true, startsAt: Date.UTC(2026, 10, 1), expiresAt: null };
	const item = { offer, priceHistory: [period], priceDisplayWindow: { previousPeriod: null, currentPeriod: null, nextPeriod: period }, dealDisplay: { canShowDeal: true, referenceAmountBaseUnits: '987000000', reason: 'eligible' as const, checkedFrom: 0, checkedTo: 1000, referenceSoldMs: 1000, totalSoldMs: 1000, referenceLastSoldAt: 1000 } };
	const client = { listCatalog: vi.fn(async () => [item]), listOrders: vi.fn(async () => []) };
	const view = await mount(ServiceSubscriptions, { client, listWallets: async () => [] });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		view.element.querySelector('div[tabindex="0"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
		if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected offer option');
		option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		expect(view.element.querySelector('s')?.textContent).toContain('987'); expect(view.element.textContent).toContain('456');
	} finally { view.dispose(); }
});

test('registered deployment selection supplies exact pricing unit and settlement addresses', async () => {
	const deployment = { id: 'rail', assetId: 'asset', chainId: 987654, contractAddress: `0x${'3'.repeat(40)}`, recipientAddress: `0x${'4'.repeat(40)}`, tokenSymbol: 'TOKEN', tokenName: 'Synthetic', decimals: 8, isEnabled: true };
	const asset = { id: 'asset', pricingAssetKey: 'native-unit', name: 'Asset', symbol: 'T', currencyCode: 'JPY', isEnabled: true };
	const client = { listOfferSettings: vi.fn(async () => [offer]), upsertOffer: vi.fn(async input => input) };
	const catalogClient = { listAssetDeployments: vi.fn(async () => [deployment]), listPricingAssets: vi.fn(async () => [asset]) };
	const view = await mount(ServiceOfferSettings, { client, catalogClient });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === offer.name)!.click(); await flush();
		const select = view.element.querySelector('div[tabindex="0"]')!; select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const item = call[0][1];
		if (!item || !('action' in item) || typeof item.action !== 'function') throw new Error('Missing deployment option');
		item.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		submit(view.element.querySelector('form')!); await flush();
		expect(client.upsertOffer).toHaveBeenCalledExactlyOnceWith({ ...offer, deploymentId: deployment.id, pricingAssetKey: asset.pricingAssetKey, currencyCode: asset.currencyCode, chainId: deployment.chainId, contractAddress: deployment.contractAddress, recipientAddress: deployment.recipientAddress, tokenSymbol: deployment.tokenSymbol, decimals: deployment.decimals });
	} finally { view.dispose(); }
});

test('original retry recovers after preflight failure, while a changed offer remains gated', async () => {
	const item = { offer, priceHistory: [], priceDisplayWindow: { previousPeriod: null, currentPeriod: null, nextPeriod: null }, dealDisplay: { canShowDeal: false } };
	const client = { listCatalog: vi.fn(async () => [item]), listOrders: vi.fn(async () => []), quoteOrder: vi.fn(async () => ({ revision: 0, quote: {} })), createOrder: vi.fn(async (_input: unknown) => { throw new Error('Unknown outcome'); }) };
	const getRequirements = vi.fn(async () => ({ isRequired: true, country: 'JP', statement: { id: 'original', country: 'JP', statement: 'Original statement' } }));
	const residenceClient = { getResidence: vi.fn(async () => ({ residence: { country: 'JP', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' }, isReady: true, requiredSubdivisions: [] })) };
	const view = await mount(ServiceSubscriptions, { client, getRequirements, residenceClient, listWallets: async () => [{ id: 'wallet', chainId: offer.chainId, address: 'synthetic', label: null, createdAt: 0, updatedAt: 0 }] });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		for (const select of view.element.querySelectorAll('div[tabindex="0"]')) {
			select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
			const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
			if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected option');
			option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		}
		const form = view.element.querySelector('form')!;
		submit(form); await flush(); expect(client.createOrder).not.toHaveBeenCalled();
		view.element.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click(); await flush();
		submit(form); await flush(); submit(form); await flush();
		expect(client.createOrder.mock.calls).toHaveLength(2);
		expect(client.createOrder.mock.calls[0]).toEqual(client.createOrder.mock.calls[1]);
		expect(client.createOrder.mock.calls[0][0]).toMatchObject({ residencyConsent: { statementId: 'original', agreed: true } });
		getRequirements.mockRejectedValueOnce(new Error('Region unavailable'));
		residenceClient.getResidence.mockResolvedValueOnce({ residence: null, isReady: false, requiredSubdivisions: [] } as never);
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		expect(view.element.textContent).not.toContain('Original statement');
		expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
		submit(form); await flush(); expect(client.createOrder.mock.calls).toHaveLength(3);
		expect(client.createOrder.mock.calls[2]).toEqual(client.createOrder.mock.calls[0]);
		expect(residenceClient.getResidence).toHaveBeenCalledTimes(4);
		client.listCatalog.mockResolvedValueOnce([{ ...item, offer: { ...offer, amountBaseUnits: '12' } }]);
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		submit(form); await flush(); expect(client.createOrder.mock.calls).toHaveLength(3);
	} finally { view.dispose(); }
});

test('owner history pages remain available when new-purchase region preflight fails', async () => {
	const getHistory = vi.fn(async (_input: unknown) => ({ items: [], nextCursor: 'older-orders' as string | null }));
	getHistory.mockResolvedValueOnce({ items: [], nextCursor: 'older-orders' }).mockResolvedValueOnce({ items: [], nextCursor: null });
	const client = { listCatalog: vi.fn(async () => []), listOrders: vi.fn(async () => []) };
	const view = await mount(ServiceSubscriptions, { client, getHistory, listWallets: async () => [], getRequirements: async () => { throw new Error('Region unavailable'); } });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush(); expect(client.listOrders).not.toHaveBeenCalled();
		expect(view.element.textContent).toContain('地域条件を確認できません');
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '支払い履歴の次のページ')!.click(); await flush();
		expect(getHistory).toHaveBeenLastCalledWith({ cursor: 'older-orders', limit: 20 });
	} finally { view.dispose(); }
});

test.each(['7', '0'])('native purchase reviews prorated quote (credit %s) and submits the exact reviewed quote', async credit => {
	const selected = { ...offer, amountBaseUnits: '14', durationUnit: 'days' as const, planGroup: 'source-group', sortOrder: 2 };
	const result = { revision: 4, quote: { quoteCreatedAt: 1000, quoteExpiresAt: 901000, baseAmountBaseUnits: '14', discountBaseUnits: credit, payableAmountBaseUnits: (14n - BigInt(credit)).toString(), discountAssignmentIds: ['old'], effectiveStartsAt: 1000, effectiveExpiresAt: 86401000, currentPlan: { id: 'old-plan', name: 'Old tier', sortOrder: 1, expiresAt: credit === '0' ? 1001 : 43201000, priceAmountBaseUnits: '14', priceDurationDays: 1, priceDurationUnit: 'days' } } };
	const client = { listCatalog: vi.fn(async () => [{ offer: selected, priceHistory: [], priceDisplayWindow: { previousPeriod: null, currentPeriod: null, nextPeriod: null }, dealDisplay: { canShowDeal: false } }]), listOrders: vi.fn(async () => []), quoteOrder: vi.fn(async () => result), createOrder: vi.fn(async (_input: unknown) => ({})) };
	client.createOrder.mockRejectedValueOnce({ code: 'BILLING_CONFLICT', message: 'Expired quote' });
	const view = await mount(ServiceSubscriptions, { client, requireQuotePreview: true, listWallets: async () => [{ id: 'wallet', chainId: offer.chainId, address: 'synthetic', label: null, createdAt: 0, updatedAt: 0 }] });
	try {
		view.element.querySelector<HTMLButtonElement>('button')!.click(); await flush();
		for (const select of view.element.querySelectorAll('div[tabindex="0"]')) {
			select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0][0];
			if (!option || !('action' in option) || typeof option.action !== 'function') throw new Error('Expected option');
			option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
		}
		const form = view.element.querySelector('form')!; submit(form); await flush(); expect(client.createOrder).not.toHaveBeenCalled();
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '日割りと利用期間の見積を確認')!.click(); await flush();
		expect(view.element.textContent).toContain(`今回の支払額: ${credit === '0' ? '0.000014' : '0.000007'} TEST`); expect(view.element.textContent).toContain('Old tier'); expect(view.element.textContent).toContain('元の価格で按分');
		submit(form); await flush(); expect(client.quoteOrder).toHaveBeenCalledTimes(1); expect(client.createOrder.mock.calls[0][0]).toMatchObject({ quotedQuote: result });
		expect(view.element.textContent).not.toContain('今回の支払額:');
		[...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '日割りと利用期間の見積を確認')!.click(); await flush(); expect(client.quoteOrder).toHaveBeenCalledTimes(2);
		submit(form); await flush(); expect(client.createOrder.mock.calls[1][0]).toMatchObject({ quotedQuote: result }); expect(client.createOrder.mock.calls[1][0]).not.toMatchObject({ requestKey: (client.createOrder.mock.calls[0][0] as { requestKey: string }).requestKey });
	} finally { view.dispose(); }
});

test('purchase loads residence and history on mount without writing, retries a failed residence read explicitly', async () => {
	const client = { listCatalog: vi.fn(async () => []), listOrders: vi.fn(async () => []), createOrder: vi.fn(), quoteOrder: vi.fn(), checkOrder: vi.fn(), cancelOrder: vi.fn() };
	const residenceClient = { getResidence: vi.fn().mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue({ residence: { country: 'CA', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' }, isReady: true, requiredSubdivisions: [] }) };
	const listWallets = vi.fn(async () => []), getRequirements = vi.fn(async () => ({ isRequired: false, country: null, statement: null }));
	const view = await mount(ServiceSubscriptions, { client, residenceClient, listWallets, getRequirements });
	try {
		await flush();
		expect(residenceClient.getResidence).toHaveBeenCalledExactlyOnceWith({});
		expect(client.listCatalog).toHaveBeenCalledExactlyOnceWith({}); expect(client.listOrders).toHaveBeenCalledExactlyOnceWith({}); expect(listWallets).toHaveBeenCalledTimes(1);
		expect(view.element.querySelector('[role="alert"]')).not.toBeNull();
		expect(view.element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		const reload = [...view.element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'サービス・居住地・履歴を再読み込み')!;
		reload.click(); await flush(); expect(residenceClient.getResidence).toHaveBeenCalledTimes(2); expect(view.element.querySelector('[role="alert"]')).toBeNull();
		for (const write of [client.createOrder, client.quoteOrder, client.checkOrder, client.cancelOrder]) expect(write).not.toHaveBeenCalled();
	} finally { view.dispose(); }
});
