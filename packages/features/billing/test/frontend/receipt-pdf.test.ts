/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { buildReceiptInputs, createReceiptPdf } from '../../frontend/receipt-pdf.js';
import { createRefundPdf, refundDocumentLines } from '../../frontend/refund-pdf.js';
import type { ServiceBillingClient } from '../../frontend/service-client.js';
import type { RefundDocument } from '../../shared/refund-types.js';
// Parse using the generator's actual pdf-lib dependency, without changing its version.
const { PDFDocument } = createRequire(realpathSync(join(process.cwd(), 'node_modules/@pdfme/generator/package.json')))('@pdfme/pdf-lib') as { PDFDocument: { load(bytes: Uint8Array): Promise<{ getPageCount(): number }> } };
const address = `0x${'1'.repeat(40)}`;
const receipt: Awaited<ReturnType<ServiceBillingClient['getReceipt']>> = {
	order: { id: 'order-id', offer: { id: 'offer-id', serviceKey: 'test', roleId: null, name: '日本語プラン', chainId: 1, contractAddress: address, recipientAddress: address, tokenSymbol: 'T', decimals: 0, amountBaseUnits: '101', duration: 1, durationUnit: 'months', confirmationsRequired: 1, isEnabled: true }, payerAddress: address, amountBaseUnits: '101', quote: null, status: 'paid', txHash: null, createdAt: 1000, expiresAt: 2000, paidAt: 1500, startsAt: 1500, endsAt: 10000 },
	snapshot: { version: 1, consentedAt: 1000, region: { country: 'JP', isEUCountry: false, city: null, continent: null, latitude: null, longitude: null, postalCode: null, metroCode: null, region: null, regionCode: null, timezone: null }, statement: { id: 'statement', country: 'JP', statement: '同意済み声明' }, seller: { name: '販売者名', address: '住所', invoiceRegistrationNumber: '登録番号' }, tax: { name: '消費税', rate: '0.100000000000000001', currencyCode: 'JPY', includedBaseUnits: '101', excludedBaseUnits: '91', taxBaseUnits: '10' } },
};
test('source receipt layout retains order ID, precise tax rate, zero-decimal cash and original seller', () => {
	const input = buildReceiptInputs(receipt)[0];
	expect(input.orderId).toBe('order-id'); expect(input.total).toContain('101 JPY'); expect(input.taxRate).toBe('10.0000000000000001%'); expect(input.sellerName).toBe('販売者名');
	expect(() => buildReceiptInputs({ ...receipt, snapshot: null })).toThrow();
});
test('original pdfme and Japanese font generate actual purchase and multi-page refund PDFs', async () => {
	const font = new Uint8Array(await readFile(join(process.cwd(), 'assets/ibm-plex-sans-jp/IBMPlexSansJP-Regular.ttf'))).buffer;
	const purchase = await createReceiptPdf(receipt, font);
	expect(new TextDecoder().decode(purchase.subarray(0, 8))).toMatch(/^%PDF-1\./);
	expect((await PDFDocument.load(purchase)).getPageCount()).toBe(1);
	const document: RefundDocument = { id: 'refund', completedAt: 2000, requestedCutoffAt: 1500, effectiveCutoffAt: 1500, seller: receipt.snapshot!.seller, taxAdjustments: [], groups: [], proofs: [], originalPurchases: [] };
	for (let n = 0; n < 12; n++) document.groups.push({ id: `group-${n}`, payerAddress: address, chainId: n + 1, contractAddress: address, decimals: 0, amountBaseUnits: '1', confirmations: 1, lines: [{ id: `line-${n}`, assignmentId: 'assignment', sourceOrder: { id: 'original', payerAddress: address, chainId: n + 1, contractAddress: address, decimals: 0 }, amountBaseUnits: '1' }] });
	const large = await createReceiptPdf({ ...receipt, snapshot: { ...receipt.snapshot!, seller: { ...receipt.snapshot!.seller, address: '住所'.repeat(200) + '終端証跡' } } }, font);
	const longTax = await createReceiptPdf({ ...receipt, snapshot: { ...receipt.snapshot!, tax: { ...receipt.snapshot!.tax, name: '長い税名称'.repeat(24) + '税名末尾' } } }, font);
	expect((await PDFDocument.load(longTax)).getPageCount()).toBeGreaterThan(1);
	expect((await PDFDocument.load(large)).getPageCount()).toBeGreaterThan(1);
	const refund = await createRefundPdf(document, font);
	expect(new TextDecoder().decode(refund.subarray(0, 8))).toMatch(/^%PDF-1\./);
	expect((await PDFDocument.load(refund)).getPageCount()).toBeGreaterThan(1);
	expect(refundDocumentLines(document)).toContain('原注文の保存済み税情報はありません。');
	if (process.env.MISSKEY_BILLING_PDF_EVIDENCE_DIR) {
		await writeFile(join(process.env.MISSKEY_BILLING_PDF_EVIDENCE_DIR, 'purchase.pdf'), purchase);
		await writeFile(join(process.env.MISSKEY_BILLING_PDF_EVIDENCE_DIR, 'refund.pdf'), refund);
		await writeFile(join(process.env.MISSKEY_BILLING_PDF_EVIDENCE_DIR, 'large-purchase.pdf'), large);
		await writeFile(join(process.env.MISSKEY_BILLING_PDF_EVIDENCE_DIR, 'long-tax-purchase.pdf'), longTax);
	}
}, 30000);
