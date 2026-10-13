/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const address = v.pipe(v.string(), v.regex(/^0x[0-9a-f]{40}$/));
const hash = v.pipe(v.string(), v.regex(/^0x[0-9a-f]{64}$/));
const safeInteger = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const chainId = v.pipe(safeInteger, v.minValue(1));
const positiveUint256 = v.pipe(v.string(), v.regex(/^[1-9][0-9]{0,77}$/), v.check(value => BigInt(value) < 2n ** 256n));

/** Evidence DTO only; it confers no account ownership, purchase or monetary credit. */
export const transferEvidenceSchema = v.strictObject({
	logIndex: safeInteger,
	contractAddress: address,
	fromAddress: address,
	toAddress: address,
	amountBaseUnits: positiveUint256,
});
export const receiptEvidenceSchema = v.strictObject({
	chainId,
	txHash: hash,
	timestamp: safeInteger,
	transfers: v.array(transferEvidenceSchema),
});
export const receiptRequestSchema = v.strictObject({
	chainId,
	txHash: hash,
	confirmations: v.pipe(safeInteger, v.minValue(1)),
});
export type TransferEvidence = v.InferOutput<typeof transferEvidenceSchema>;
export type ReceiptEvidence = v.InferOutput<typeof receiptEvidenceSchema>;
