/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement, ORPCError } from '@orpc/server';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { refundContract } from './refund.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { RefundStore } from './refund-store.js';
export function createRefundRouter<Actor extends ApiActor>(store: RefundStore) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(refundContract).$context<ApiContext<Actor>>().router({
		requestRefund: procedure(refundContract.requestRefund).use(account).handler(({ input, context }) => store.request(context.principal.id, input.requestKey, input.cutoffAt, input.reason)),
		listRefunds: procedure(refundContract.listRefunds).use(account).handler(({ input, context }) => store.list(context.principal.id, input.cursor, input.limit)),
		showRefund: procedure(refundContract.showRefund).use(account).handler(({ input, context }) => store.show(input.requestId, context.principal.id)),
		cancelRefund: procedure(refundContract.cancelRefund).use(account).handler(({ input, context }) => store.cancel(input.requestId, context.principal.id, context.principal.id)),
		refundDocument: procedure(refundContract.refundDocument).use(account).handler(async ({ input, context }) => { const row = await store.show(input.requestId, context.principal.id); if (!row.document) throw new ORPCError('BILLING_NOT_FOUND'); return row.document; }),
		adminListRefunds: procedure(refundContract.adminListRefunds).handler(({ input }) => store.list(undefined, input.cursor, input.limit)),
		adminShowRefund: procedure(refundContract.adminShowRefund).handler(({ input }) => store.show(input.requestId)),
		decideRefund: procedure(refundContract.decideRefund).use(account).handler(({ input, context }) => store.decide(input.requestId, input.version, context.principal.id, input.decision, input.effectiveCutoffAt, input.reason)),
		startRefundTransfer: procedure(refundContract.startRefundTransfer).use(account).handler(({ input, context }) => store.start(input.requestId, input.transferId, input.version, input.senderAddress, context.principal.id)),
		submitRefundTransfer: procedure(refundContract.submitRefundTransfer).use(account).handler(({ input, context }) => store.submit(input.requestId, input.transferId, input.txHash, context.principal.id)),
		checkRefund: procedure(refundContract.checkRefund).use(account).handler(({ input, context }) => store.check(input.requestId, context.principal.id)),
	});
}
