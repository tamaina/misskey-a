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
	const client = { listOffers: vi.fn(async () => [offer]), listOrders: vi.fn(async () => [order]), listTransfers: vi.fn(async () => []), createOrder: vi.fn(async () => order), checkOrder: vi.fn(async () => order), detectTransfer: vi.fn(async () => ({ status: 'pending' as const, transfer: null })) };
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
