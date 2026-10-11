/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { createApiProcedure } from '../../api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../api/backend/transport/middleware.js';
import { billingContract, disabledPaymentChain, paymentSummary } from '../contract/billing.js';
import type { DisabledPaymentChain, PaymentSummary } from '../contract/billing.js';

export interface BillingDependencies {
	/** Descending immutable source IDs, exclusive cursor, at most limit rows, filtered by userId. */
	listPayments(query: { userId: string; cursor?: string; limit: number }): Promise<readonly (PaymentSummary & { userId: string })[]>;
	/** Pilot catalog is bounded to 100 entries. Never expose RPC URLs or credentials. */
	listChains(): Promise<readonly DisabledPaymentChain[]>;
	/** Replace by chainId atomically; repeated identical calls must have identical effects. */
	upsertChain(chain: DisabledPaymentChain, actorId: string): Promise<void>;
}

/** Inactive application seam: host registration and production adapters require a later review. */
export function createBillingRouter<Actor extends ApiActor>(deps: BillingDependencies) {
	const procedure = createApiProcedure<Actor>();
	return implement(billingContract).$context<ApiContext<Actor>>().router({
		listMyPayments: procedure(billingContract.listMyPayments).use(requirePrincipal<Actor>()).handler(async ({ input, context }) => {
			const rows = await deps.listPayments({ userId: context.principal.id, ...input, limit: input.limit + 1 });
			// A misbound storage adapter must fail closed, not leak another account's history.
			if (rows.length > input.limit + 1 || rows.some(row => row.userId !== context.principal.id)) {
				throw new Error('Invalid billing history adapter result');
			}
			const items = rows.slice(0, input.limit).map(row => v.parse(paymentSummary, {
				id: row.id, status: row.status, chainId: row.chainId, tokenSymbol: row.tokenSymbol,
				amountBaseUnits: row.amountBaseUnits, decimals: row.decimals, planName: row.planName,
				createdAt: row.createdAt, paidAt: row.paidAt,
			}));
			return { items, nextCursor: rows.length > input.limit ? items.at(-1)?.id ?? null : null };
		}),
		listChains: procedure(billingContract.listChains).handler(async () => {
			return v.parse(v.pipe(v.array(disabledPaymentChain), v.maxLength(100)), await deps.listChains());
		}),
		upsertChain: procedure(billingContract.upsertChain).use(requirePrincipal<Actor>()).handler(async ({ input, context }) => {
			await deps.upsertChain(input, context.principal.id);
			return input;
		}),
	});
}
