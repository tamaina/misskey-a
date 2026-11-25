/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { expect, test, vi } from 'vitest';
import * as os from '@features/ui/frontend/os.js';
import RefundRequests from '../../frontend/RefundRequests.vue';
import { renderRefundDocument } from '../../frontend/refund-client.js';
import type { RefundData } from '../../shared/refund-types.js';
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = `0x${'a'.repeat(64)}`;
const row: RefundData = { id: 'refund', version: 1, status: 'prepared', requestedMode: 'immediate', requestedCutoffAt: 10000, effectiveCutoffAt: 10000, reason: 'test', createdAt: 10000, events: [], document: null,
	quote: { revision: 1, effectiveCutoffAt: 10000, assignments: [], reviewReasons: [], groups: [{ id: '0', payerAddress: address(1), chainId: 1, contractAddress: address(3), decimals: 6, amountBaseUnits: '123456789012345678901', lines: [], confirmations: 2 }] },
	transfers: [{ id: '0', status: 'prepared', senderAddress: null, startedAt: null, txHash: null }] };

async function flush() { for (let n = 0; n < 12; n++) { await Promise.resolve(); await nextTick(); } }

async function mount(admin: boolean, client: Record<string, unknown>) {
	const app = createApp(RefundRequests, { admin, client }); const i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element); await flush();
	return { element, dispose: () => { app.unmount(); element.remove(); } };
}

function click(element: Element, text: string) { [...element.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes(text))!.click(); }

async function walletSelect(element: Element) {
	const select = element.querySelector('div[tabindex="0"]')!; select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
	const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const item = call[0][0]; if (!item || !('action' in item) || typeof item.action !== 'function') throw new Error('Missing wallet'); item.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush();
}

test('unknown wallet broadcast cannot resend and retains original payer/rail/base-unit display', async () => {
	const provider = { request: vi.fn(async ({ method }: { method: string }) => { if (method === 'eth_chainId') return '0x1'; if (method === 'eth_sendTransaction') throw new Error('unknown outcome'); return [address(9)]; }) };
	Object.defineProperty(window, 'ethereum', { value: provider, configurable: true });
	const pending = { ...row, version: 2, status: 'processing', transfers: [{ ...row.transfers[0], status: 'broadcast_pending', senderAddress: address(9), startedAt: 10000 }] };
	const client = { adminListRefunds: vi.fn(async () => ({ items: [structuredClone(row)], nextCursor: null })), startRefundTransfer: vi.fn(async () => pending), submitRefundTransfer: vi.fn() };
	const view = await mount(true, client);
	try {
		click(view.element, '読み込む'); await flush(); await walletSelect(view.element); click(view.element, '接続ウォレット'); await flush();
		expect(client.startRefundTransfer).toHaveBeenCalledExactlyOnceWith({ requestId: 'refund', transferId: '0', version: 1, senderAddress: address(9) });
		expect(provider.request.mock.calls.find(([input]) => input.method === 'eth_sendTransaction')).toBeDefined();
		expect(client.submitRefundTransfer).not.toHaveBeenCalled(); expect(view.element.textContent).toContain('再送せず');
		expect([...view.element.querySelectorAll('button')].some(button => button.textContent?.includes('接続ウォレットで返金'))).toBe(false);
		expect(view.element.textContent).toContain(address(1)); expect(view.element.textContent).toContain(address(3)); expect(view.element.textContent).toContain('123456789012345678901');
	} finally { view.dispose(); delete (window as Window & { ethereum?: unknown }).ethereum; }
});
test('lost submit response preserves hash for registration without another wallet broadcast', async () => {
	const provider = { request: vi.fn(async ({ method }: { method: string }) => method === 'eth_chainId' ? '0x1' : method === 'eth_sendTransaction' ? hash : [address(9)]) };
	Object.defineProperty(window, 'ethereum', { value: provider, configurable: true });
	const pending = { ...row, version: 2, status: 'processing', transfers: [{ ...row.transfers[0], status: 'broadcast_pending', senderAddress: address(9), startedAt: 10000 }] };
	const client = { adminListRefunds: vi.fn(async () => ({ items: [structuredClone(row)], nextCursor: null })), startRefundTransfer: vi.fn(async () => pending), submitRefundTransfer: vi.fn(async () => pending) }; client.submitRefundTransfer.mockRejectedValueOnce(new Error('lost response'));
	const view = await mount(true, client);
	try {
		click(view.element, '読み込む'); await flush(); await walletSelect(view.element); click(view.element, '接続ウォレット'); await flush();
		expect([...view.element.querySelectorAll<HTMLInputElement>('input')].some(input => input.value === hash)).toBe(true);
		click(view.element, 'ハッシュを登録'); await flush(); expect(client.submitRefundTransfer).toHaveBeenCalledTimes(2);
		expect(provider.request.mock.calls.filter(([input]) => input.method === 'eth_sendTransaction')).toHaveLength(1);
	} finally { view.dispose(); delete (window as Window & { ethereum?: unknown }).ethereum; }
});
test('immediate request omits client timestamp and preserves idempotency after lost response', async () => {
	const client = { requestRefund: vi.fn(async (_input: { requestKey: string; cutoffAt?: number; reason: string }) => row) }; client.requestRefund.mockRejectedValueOnce(new Error('lost response'));
	const view = await mount(false, client);
	try {
		const inputs = view.element.querySelectorAll<HTMLInputElement>('input'); inputs[1].value = 'reason'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); await flush();
		click(view.element, '返金を申請'); await flush(); click(view.element, '返金を申請'); await flush();
		expect(client.requestRefund.mock.calls).toHaveLength(2); expect(client.requestRefund.mock.calls[0]).toEqual(client.requestRefund.mock.calls[1]);
		expect(client.requestRefund.mock.calls[0][0]).not.toHaveProperty('cutoffAt');
	} finally { view.dispose(); }
});
test('printable document escapes original purchase details and retains canonical proof data', () => {
	const html = renderRefundDocument({ id: '<script>evil</script>', completedAt: 10000, requestedCutoffAt: 10000, effectiveCutoffAt: 10000, groups: [], proofs: [], originalPurchases: [] });
	expect(html).not.toContain('<script>'); expect(html).toContain('&lt;script&gt;'); expect(html).toContain('原購入');
});
