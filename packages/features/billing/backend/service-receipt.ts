/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { createTransferReceiptReader as createServiceReceiptReader } from './transfer-confirmation.js';
export type { ReceiptEvidence, TransferEvidence, ReceiptResult, ReceiptReader } from './transfer-confirmation.js';
import type { ReceiptEvidence } from './transfer-confirmation.js';

/** UTC calendar clamp follows cfw-fileup addPaymentDuration. */
export function addServiceDuration(base: number, value: number, unit: 'days' | 'months' | 'years'): number {
	if (unit === 'days') return base + value * 86400000;
	const date = new Date(base);
	const month = date.getUTCMonth() + value * (unit === 'years' ? 12 : 1);
	const year = date.getUTCFullYear() + Math.floor(month / 12);
	const targetMonth = month % 12;
	return Date.UTC(year, targetMonth, Math.min(date.getUTCDate(), new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate()), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}

export function matchesOrder(evidence: ReceiptEvidence, order: { offer: { chainId: number; contractAddress: string; recipientAddress: string; amountBaseUnits: string }; payerAddress: string; txHash: string | null; createdAt: number; expiresAt: number }): boolean {
	return evidence.chainId === order.offer.chainId && evidence.txHash === order.txHash && evidence.timestamp + 2000 >= order.createdAt && evidence.timestamp - 2000 <= order.expiresAt && evidence.transfers.some(log => log.contractAddress === order.offer.contractAddress && log.fromAddress === order.payerAddress && log.toAddress === order.offer.recipientAddress && BigInt(log.amountBaseUnits) >= BigInt(order.offer.amountBaseUnits));
}
