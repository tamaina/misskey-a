/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { createTransferReceiptReader as createServiceReceiptReader } from './transfer-confirmation.js';
export type { ReceiptEvidence, TransferEvidence, ReceiptResult, ReceiptReader } from './transfer-confirmation.js';
import type { ReceiptEvidence } from './transfer-confirmation.js';

export { addPaymentDuration as addServiceDuration } from '../shared/payment-quote.js';

export function matchesOrder(evidence: ReceiptEvidence, order: { offer: { chainId: number; contractAddress: string; recipientAddress: string; amountBaseUnits: string }; cashAmountBaseUnits?: string | null; payerAddress: string; txHash: string | null; createdAt: number; expiresAt: number }): boolean {
	return evidence.chainId === order.offer.chainId && evidence.txHash === order.txHash && evidence.timestamp + 2000 >= order.createdAt && evidence.timestamp - 2000 <= order.expiresAt && evidence.transfers.some(log => log.contractAddress === order.offer.contractAddress && log.fromAddress === order.payerAddress && log.toAddress === order.offer.recipientAddress && BigInt(log.amountBaseUnits) >= BigInt(order.cashAmountBaseUnits ?? order.offer.amountBaseUnits));
}
