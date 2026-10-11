/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../api/backend/transport/errors.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
const timestamp = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const chainId = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER));
export const paymentSummary = v.strictObject({
	id,
	status: v.picklist(['pending', 'paid', 'expired', 'failed']),
	chainId,
	tokenSymbol: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
	amountBaseUnits: v.pipe(v.string(), v.regex(/^[0-9]{1,78}$/)),
	decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
	planName: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
	createdAt: timestamp,
	paidAt: v.nullable(timestamp),
});
export const disabledPaymentChain = v.strictObject({
	chainId,
	name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128)),
	confirmationsRequired: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)),
	isEnabled: v.literal(false),
});
export type PaymentSummary = v.InferOutput<typeof paymentSummary>;
export type DisabledPaymentChain = v.InferOutput<typeof disabledPaymentChain>;

const procedure = oc.errors(commonErrors);
export const billingContract = {
	listMyPayments: procedure.$meta({
		requestName: 'billing/list-my-payments', requireCredential: true, kind: 'read:account',
	} as const satisfies ApiProcedureMetadata)
		.input(v.intersect([v.strictObject({
			limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
			cursor: v.exactOptional(id),
		}), rawObjectInputGuard])).output(v.strictObject({ items: v.array(paymentSummary), nextCursor: v.nullable(id) })),
	listChains: procedure.$meta({
		requestName: 'admin/billing/list-chains', requireCredential: true, requireAdmin: true, kind: 'read:admin:meta',
	} as const satisfies ApiProcedureMetadata)
		.input(v.intersect([v.strictObject({}), rawObjectInputGuard])).output(v.array(disabledPaymentChain)),
	upsertChain: procedure.$meta({
		requestName: 'admin/billing/upsert-chain', requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	} as const satisfies ApiProcedureMetadata)
		.input(disabledPaymentChain).output(disabledPaymentChain),
};

export { walletContract } from './wallet.contract.js';
