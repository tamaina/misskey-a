/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';
import fontUrl from '../../../frontend/assets/ibm-plex-sans-jp/IBMPlexSansJP-Regular.ttf?url';
import { wrapPdfLines } from './pdf-lines.js';
import type { Template } from '@pdfme/common';
import type { ServiceBillingClient } from './service-client.js';

type NativeReceipt = Awaited<ReturnType<ServiceBillingClient['getReceipt']>>;

function adaptReceipt(receipt: NativeReceipt) {
	const { order, snapshot } = receipt;
	if (order.status !== 'paid' || !snapshot) throw new Error('Saved tax and seller metadata required');
	return { seller: snapshot.seller, order: { ...order, ...order.offer, planName: order.offer.name, chainName: String(order.offer.chainId), tokenName: order.offer.tokenSymbol, durationDays: order.offer.duration,
																																												taxRate: snapshot.tax.rate, taxName: snapshot.tax.name, taxCurrency: snapshot.tax.currencyCode, taxIncludedAmountBaseUnits: snapshot.tax.includedBaseUnits, taxExcludedAmountBaseUnits: snapshot.tax.excludedBaseUnits, taxAmountBaseUnits: snapshot.tax.taxBaseUnits,
																																												id: order.id, quoteBaseAmountBaseUnits: order.quote?.baseAmountBaseUnits ?? order.offer.amountBaseUnits, quoteDiscountBaseUnits: order.quote?.discountBaseUnits ?? '0', amountBaseUnits: order.amountBaseUnits } };
}

type Receipt = ReturnType<typeof adaptReceipt>;
type ReceiptOrder = Receipt['order'];

const receiptFontName = 'IBMPlexSansJP';

const template: Template = {
	basePdf: { width: 210, height: 297, padding: [16, 16, 16, 16] },
	schemas: [[
		{ name: 'title', type: 'text', fontName: receiptFontName, position: { x: 18, y: 18 }, width: 174, height: 12, fontSize: 22, fontColor: '#111111' },
		{ name: 'orderIdLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 39 }, width: 36, height: 7, fontSize: 9, fontColor: '#555555' },
		{ name: 'orderId', type: 'text', fontName: receiptFontName, position: { x: 55, y: 39 }, width: 137, height: 7, fontSize: 9, fontColor: '#333333' },
		{ name: 'paidAtLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 49 }, width: 36, height: 7, fontSize: 9, fontColor: '#555555' },
		{ name: 'paidAt', type: 'text', fontName: receiptFontName, position: { x: 55, y: 49 }, width: 137, height: 7, fontSize: 9, fontColor: '#333333' },
		{ name: 'separator1', type: 'text', fontName: receiptFontName, position: { x: 18, y: 62 }, width: 174, height: 4, fontSize: 8, fontColor: '#999999' },
		{ name: 'planLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 72 }, width: 28, height: 7, fontSize: 10, fontColor: '#333333' },
		{ name: 'plan', type: 'text', fontName: receiptFontName, position: { x: 48, y: 72 }, width: 86, height: 7, fontSize: 10, fontColor: '#333333' },
		{ name: 'planAmount', type: 'text', fontName: receiptFontName, position: { x: 136, y: 72 }, width: 56, height: 7, fontSize: 10, alignment: 'right', fontColor: '#333333' },
		{ name: 'discountLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 83 }, width: 28, height: 7, fontSize: 10, fontColor: '#333333' },
		{ name: 'discount', type: 'text', fontName: receiptFontName, position: { x: 48, y: 83 }, width: 86, height: 7, fontSize: 10, fontColor: '#333333' },
		{ name: 'discountAmount', type: 'text', fontName: receiptFontName, position: { x: 136, y: 83 }, width: 56, height: 7, fontSize: 10, alignment: 'right', fontColor: '#333333' },
		{ name: 'separator2', type: 'text', fontName: receiptFontName, position: { x: 18, y: 95 }, width: 174, height: 4, fontSize: 8, fontColor: '#999999' },
		{ name: 'totalLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 106 }, width: 40, height: 8, fontSize: 12, fontColor: '#111111' },
		{ name: 'total', type: 'text', fontName: receiptFontName, position: { x: 86, y: 106 }, width: 106, height: 8, fontSize: 13, alignment: 'right', fontColor: '#111111' },
		{ name: 'taxLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 119 }, width: 40, height: 7, fontSize: 10, fontColor: '#333333' },
		{ name: 'taxRate', type: 'text', fontName: receiptFontName, position: { x: 62, y: 119 }, width: 70, height: 20, fontSize: 10, fontColor: '#333333' },
		{ name: 'tax', type: 'text', fontName: receiptFontName, position: { x: 136, y: 119 }, width: 56, height: 7, fontSize: 10, alignment: 'right', fontColor: '#333333' },
		{ name: 'paymentMethodTitle', type: 'text', fontName: receiptFontName, position: { x: 18, y: 143 }, width: 174, height: 8, fontSize: 12, fontColor: '#111111' },
		{ name: 'txLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 158 }, width: 174, height: 7, fontSize: 9, fontColor: '#555555' },
		{ name: 'txHash', type: 'text', fontName: receiptFontName, position: { x: 18, y: 168 }, width: 174, height: 14, fontSize: 8, fontColor: '#333333' },
		{ name: 'paymentRailLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 188 }, width: 40, height: 7, fontSize: 9, fontColor: '#555555' },
		{ name: 'paymentRail', type: 'text', fontName: receiptFontName, position: { x: 62, y: 188 }, width: 130, height: 7, fontSize: 9, fontColor: '#333333' },
		{ name: 'paymentAmountLabel', type: 'text', fontName: receiptFontName, position: { x: 18, y: 199 }, width: 40, height: 7, fontSize: 9, fontColor: '#555555' },
		{ name: 'paymentAmount', type: 'text', fontName: receiptFontName, position: { x: 62, y: 199 }, width: 130, height: 7, fontSize: 9, fontColor: '#333333' },
		{ name: 'sellerName', type: 'text', fontName: receiptFontName, position: { x: 18, y: 208 }, width: 174, height: 7, fontSize: 10, fontColor: '#111111' },
		{ name: 'registrationNumber', type: 'text', fontName: receiptFontName, position: { x: 18, y: 219 }, width: 174, height: 7, fontSize: 9, fontColor: '#333333' },
		{ name: 'sellerAddress', type: 'text', fontName: receiptFontName, position: { x: 18, y: 230 }, width: 174, height: 18, fontSize: 9, fontColor: '#333333' },
	]],
};

function formatBaseUnits(amountBaseUnits: string, decimals: number): string {
	const padded = amountBaseUnits.padStart(decimals + 1, '0');
	const rawInteger = decimals === 0 ? padded : padded.slice(0, -decimals);
	const integer = new Intl.NumberFormat('ja-JP', { useGrouping: true }).format(BigInt(rawInteger || '0'));
	const fraction = decimals === 0 ? '' : padded.slice(-decimals).replace(/0+$/, '');
	return `${integer}${fraction ? `.${fraction}` : ''}`;
}

function formatTaxCurrencyBaseUnits(amountBaseUnits: string, decimals: number, currency: string): string {
	const normalized = currency.trim().toUpperCase();
	return `${formatBaseUnits(amountBaseUnits, decimals)} ${normalized || currency}`;
}

function formatDate(value: number | null): string {
	return value == null ? '-' : new Date(value).toLocaleString();
}

function formatAmount(order: ReceiptOrder): string {
	return `${formatBaseUnits(order.amountBaseUnits, order.decimals)} ${order.tokenSymbol}`;
}

function formatDuration(order: ReceiptOrder): string {
	if (order.durationUnit === 'months') return `${order.durationDays}ヶ月`;
	if (order.durationUnit === 'years') return `${order.durationDays}年`;
	return `${order.durationDays}日`;
}

function buildInputs(receipt: Receipt): Record<string, string>[] {
	const { order, seller } = receipt;
	const [integer, fraction = ''] = order.taxRate.split('.');
	const remainder = fraction.slice(2).replace(/0+$/, '');
	const percent = BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
	const taxRate = `${percent}${remainder ? `.${remainder}` : ''}%`;
	const taxNote = '税込';
	const taxCurrency = order.taxCurrency;
	const discountAmount = BigInt(order.quoteDiscountBaseUnits);
	return [{
		title: '領収書',
		orderIdLabel: '注文ID',
		orderId: order.id,
		paidAtLabel: '支払日時',
		paidAt: formatDate(order.paidAt),
		separator1: '---',
		planLabel: 'プラン',
		plan: `${order.planName} ${formatDuration(order)}`,
		planAmount: `${formatTaxCurrencyBaseUnits(order.quoteBaseAmountBaseUnits, order.decimals, taxCurrency)} ${taxNote}`,
		discountLabel: '割引',
		discount: '',
		discountAmount: discountAmount > 0n ? `-${formatTaxCurrencyBaseUnits(order.quoteDiscountBaseUnits, order.decimals, taxCurrency)} ${taxNote}` : '-',
		separator2: '---',
		totalLabel: '支払額',
		total: `${formatTaxCurrencyBaseUnits(order.taxIncludedAmountBaseUnits, order.decimals, taxCurrency)} ${taxNote}`,
		taxLabel: `${order.taxName}額`,
		taxRate,
		tax: formatTaxCurrencyBaseUnits(order.taxAmountBaseUnits, order.decimals, taxCurrency),
		paymentMethodTitle: '支払い方法',
		txLabel: 'トランザクションハッシュ',
		txHash: order.txHash ?? '-',
		paymentRailLabel: '決済手段',
		paymentRail: `${order.tokenSymbol} / ${order.chainName}`,
		paymentAmountLabel: '決済額',
		paymentAmount: formatAmount(order),
		sellerName: seller.name,
		sellerAddress: seller.address,
		registrationNumber: seller.invoiceRegistrationNumber,
	}];
}

export function buildReceiptInputs(receipt: NativeReceipt): Record<string, string>[] { return buildInputs(adaptReceipt(receipt)); }
export async function createReceiptPdf(receipt: NativeReceipt, fontData: ArrayBuffer): Promise<Uint8Array> {
	const input = buildReceiptInputs(receipt)[0], rendered = { ...input };
	const limits: Record<string, number> = { taxLabel: 10, tax: 30, plan: 24, planAmount: 30, discountAmount: 30, total: 40, sellerName: 48, sellerAddress: 120, registrationNumber: 60, paymentAmount: 50 };
	const overflowing = Object.entries(limits).some(([key, max]) => Array.from(input[key]).length > max || (input[key].match(/\n/g)?.length ?? 0) > 2);
	const supplement: string[] = [];
	if (overflowing) {
		for (const [key, max] of Object.entries(limits)) if (Array.from(input[key]).length > max || (input[key].match(/\n/g)?.length ?? 0) > 2) rendered[key] = '詳細は別紙に記載';
		const labels: Record<string, string> = { orderId: '注文ID', paidAt: '支払日時', plan: 'プラン', planAmount: '基本額', discountAmount: '割引', total: '支払額', taxRate: '税率', taxLabel: '税名称', tax: '税額', txHash: 'トランザクション', paymentRail: '決済手段', paymentAmount: '決済額', sellerName: '販売者', sellerAddress: '住所', registrationNumber: '登録番号' };
		supplement.push(...wrapPdfLines(['領収書 別紙', ...Object.entries(labels).map(([key, label]) => `${label}: ${input[key]}`)]));
	}
	const schemas = [...template.schemas], supplementalInputs: Record<string, string> = {};
	for (let index = 0; index < supplement.length; index += 26) {
		const name = `supplement${index}`; supplementalInputs[name] = supplement.slice(index, index + 26).join('\n');
		schemas.push([{ name, type: 'text', fontName: receiptFontName, position: { x: 18, y: 18 }, width: 174, height: 260, fontSize: 9, lineHeight: 1.4 }]);
	}
	return generate({ template: { ...template, schemas }, inputs: [{ ...rendered, ...supplementalInputs }], plugins: { text },
																			options: { font: { [receiptFontName]: { data: fontData, fallback: true, subset: true } } } });
}
export async function downloadReceiptPdf(receipt: NativeReceipt): Promise<void> {
	const font = await window.fetch(fontUrl);
	if (!font.ok) throw new Error('Receipt font unavailable');
	const pdf = await createReceiptPdf(receipt, await font.arrayBuffer());
	const blob = new Blob([new Uint8Array(pdf)], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const a = window.document.createElement('a');
	a.href = url;
	a.download = `receipt-${receipt.order.id}.pdf`;
	a.click();
	URL.revokeObjectURL(url);
}
