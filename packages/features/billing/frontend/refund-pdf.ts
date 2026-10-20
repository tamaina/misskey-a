/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';
import fontUrl from '../../../frontend/assets/ibm-plex-sans-jp/IBMPlexSansJP-Regular.ttf?url';
import { wrapPdfLines } from './pdf-lines.js';
import { formatServiceAmount } from './service-client.js';
import type { RefundDocument } from '../shared/refund-types.js';
/** Source pdfme evidence keeps original purchases and confirmed transfer proofs. */
export function refundDocumentLines(document: RefundDocument): string[] {
	const lines = ['返金証憑', `申請ID: ${document.id}`, `返金確定: ${new Date(document.completedAt).toISOString()}`,
																`終了希望: ${new Date(document.requestedCutoffAt).toISOString()}`, `適用終了: ${new Date(document.effectiveCutoffAt).toISOString()}`,
																`日時調整理由: ${document.adjustmentReason || '-'}`,
																...(document.seller ? [`販売者: ${document.seller.name}`, `住所: ${document.seller.address}`, `登録番号: ${document.seller.invoiceRegistrationNumber}`] : ['保存済みの販売者情報はありません。']), ''];
	for (const group of document.groups) {
		const source = document.originalPurchases.find(order => order.id === group.lines[0]?.sourceOrder.id);
		lines.push(`返金額: ${formatServiceAmount(group.amountBaseUnits, group.decimals)} ${source?.offer.tokenSymbol ?? group.contractAddress} / ${group.chainId}`,
			`返金先: ${group.payerAddress}`, `トークン契約: ${group.contractAddress}`,
			`Tx Hash: ${document.proofs.find(proof => proof.transferId === group.id)?.evidence.txHash ?? '-'}`);
		for (const line of group.lines) {
			const tax = document.taxAdjustments?.find(item => item.lineId === line.id)?.tax;
			lines.push(`原注文: ${line.sourceOrder.id} / 割当: ${line.assignmentId}`, `返金明細: ${formatServiceAmount(line.amountBaseUnits, group.decimals)}`,
				tax ? `税: ${tax.name} ${tax.rate} / 税額 ${formatServiceAmount(tax.taxBaseUnits, group.decimals)} ${tax.currencyCode}` : '原注文の保存済み税情報はありません。');
		}
		lines.push('');
	}
	return lines;
}
export async function createRefundPdf(document: RefundDocument, fontData: ArrayBuffer): Promise<Uint8Array> {
	const lines = wrapPdfLines(refundDocumentLines(document)), chunks: string[] = [];
	for (let index = 0; index < lines.length; index += 26) chunks.push(lines.slice(index, index + 26).join('\n'));
	const fontName = 'IBMPlexSansJP';
	const schema = { name: 'body', type: 'text', fontName, position: { x: 15, y: 15 }, width: 180, height: 265, fontSize: 9, lineHeight: 1.4 };
	return generate({ template: { basePdf: { width: 210, height: 297, padding: [15, 15, 15, 15] }, schemas: chunks.map((_, index) => [{ ...schema, name: `body${index}` }]) },
																			inputs: [Object.fromEntries(chunks.map((chunk, index) => [`body${index}`, chunk]))],
																			plugins: { text }, options: { font: { [fontName]: { data: fontData, fallback: true } } } });
}
export async function downloadRefundPdf(document: RefundDocument): Promise<void> {
	const font = await window.fetch(fontUrl);
	if (!font.ok) throw new Error('Refund font unavailable');
	const pdf = await createRefundPdf(document, await font.arrayBuffer());
	const url = URL.createObjectURL(new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }));
	const a = window.document.createElement('a'); a.href = url; a.download = `refund-${document.id}.pdf`; a.click();
	URL.revokeObjectURL(url);
}
