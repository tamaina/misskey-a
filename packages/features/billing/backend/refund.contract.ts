/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { receiptSeller, receiptSnapshot } from './policy.schema.js';
import { serviceOffer } from './api.definition.js';
import { receiptEvidenceSchema } from './transfer.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
const time = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const address = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{40}$/));
const hash = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{64}$/));
const units = v.pipe(v.string(), v.regex(/^(0|[1-9][0-9]{0,77})$/));
const reason = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000));
const term = v.strictObject({ id, orderId: id, offer: serviceOffer, startsAt: time, expiresAt: time, provenanceComplete: v.boolean() });
const line = v.strictObject({ id, assignmentId: id, amountBaseUnits: units, sourceOrder: v.strictObject({ id, payerAddress: address, chainId: time, contractAddress: address, decimals: time }) });
const group = v.strictObject({ id, payerAddress: address, chainId: time, contractAddress: address, decimals: time, amountBaseUnits: units, lines: v.array(line), confirmations: time });
const quote = v.strictObject({ revision: time, effectiveCutoffAt: time, assignments: v.array(term), groups: v.array(group), reviewReasons: v.array(v.string()) });
export const refundDocumentSchema = v.strictObject({ adjustmentReason: v.exactOptional(v.string()), seller: v.exactOptional(v.nullable(receiptSeller)), taxAdjustments: v.exactOptional(v.array(v.strictObject({ lineId: id, sourceOrderId: id, tax: v.nullable(receiptSnapshot.entries.tax) }))), id, completedAt: time, requestedCutoffAt: time, effectiveCutoffAt: time, groups: v.array(group),
																																																					proofs: v.array(v.strictObject({ transferId: id, senderAddress: address, evidence: receiptEvidenceSchema })),
																																																					originalPurchases: v.array(v.strictObject({ id, payerAddress: address, offer: serviceOffer, cashAmountBaseUnits: units, receiptSnapshot: v.exactOptional(v.nullable(receiptSnapshot)), txHash: v.nullable(hash), paidAt: v.nullable(time) })),
});
export const refundViewSchema = v.strictObject({ id, version: time, status: v.picklist(['requested', 'review_required', 'prepared', 'processing', 'rejected', 'cancelled', 'completed']), requestedMode: v.picklist(['immediate', 'scheduled']), requestedCutoffAt: time, effectiveCutoffAt: v.nullable(time), reason, createdAt: time, quote: v.nullable(quote),
																																																	transfers: v.array(v.strictObject({ id, status: v.picklist(['prepared', 'broadcast_pending', 'submitted']), senderAddress: v.nullable(address), startedAt: v.nullable(time), txHash: v.nullable(hash) })),
																																																	events: v.array(v.strictObject({ actorId: id, at: time, action: v.string(), reason: v.string() })), document: v.nullable(refundDocumentSchema),
});
const errors = { ...commonErrors, BILLING_NOT_FOUND: { status: 404, data: apiErrorData }, BILLING_CONFLICT: { status: 409, data: apiErrorData }, BILLING_REVIEW_REQUIRED: { status: 409, data: apiErrorData } };
const read = { requireCredential: true, kind: 'read:account' } as const;
const write = { requireCredential: true, kind: 'write:account', limit: { duration: 60000, max: 10 } } as const;
const adminRead = { requireCredential: true, requireAdmin: true, kind: 'read:admin:meta' } as const;
const adminWrite = { ...adminRead, kind: 'write:admin:meta', limit: write.limit } as const;
const page = v.strictObject({ cursor: v.exactOptional(id), limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20) });
const outputPage = v.strictObject({ items: v.array(refundViewSchema), nextCursor: v.nullable(id) });
const procedure = <const Name extends string, const Meta extends typeof read | typeof write | typeof adminRead | typeof adminWrite>(requestName: Name, meta: Meta) => oc.errors(errors).$meta({ ...meta, requestName } satisfies ApiProcedureMetadata).route({ method: 'POST', path: `/${requestName}` });
export const refundContract = {
	requestRefund: procedure('billing/refunds/request', write).input(v.strictObject({ requestKey: id, cutoffAt: v.exactOptional(time), reason })).output(refundViewSchema),
	listRefunds: procedure('billing/refunds/list', read).input(page).output(outputPage),
	showRefund: procedure('billing/refunds/show', read).input(v.strictObject({ requestId: id })).output(refundViewSchema),
	cancelRefund: procedure('billing/refunds/cancel', write).input(v.strictObject({ requestId: id })).output(refundViewSchema),
	refundDocument: procedure('billing/refunds/document', read).input(v.strictObject({ requestId: id })).output(refundDocumentSchema),
	adminListRefunds: procedure('admin/billing/refunds/list', adminRead).input(page).output(outputPage),
	adminShowRefund: procedure('admin/billing/refunds/show', adminRead).input(v.strictObject({ requestId: id })).output(refundViewSchema),
	decideRefund: procedure('admin/billing/refunds/decide', adminWrite).input(v.strictObject({ requestId: id, version: time, decision: v.picklist(['approve', 'reject']), effectiveCutoffAt: v.exactOptional(time), reason })).output(refundViewSchema),
	startRefundTransfer: procedure('admin/billing/refunds/start', adminWrite).input(v.strictObject({ requestId: id, transferId: id, version: time, senderAddress: address })).output(refundViewSchema),
	submitRefundTransfer: procedure('admin/billing/refunds/submit', adminWrite).input(v.strictObject({ requestId: id, transferId: id, txHash: hash })).output(refundViewSchema),
	checkRefund: procedure('admin/billing/refunds/check', adminWrite).input(v.strictObject({ requestId: id })).output(refundViewSchema),
};
