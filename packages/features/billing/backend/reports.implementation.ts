/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement, ORPCError } from '@orpc/server';
import { createApiProcedure } from '../../api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../api/backend/transport/middleware.js';
import { billingReportsContract } from './reports.contract.js';
import { publicOrder } from './service.implementation.js';
import type { ServiceBillingDependencies } from './service.implementation.js';
import type { BillingReportsStore } from './reports-store.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';

function publicAdminOrder(row: Awaited<ReturnType<BillingReportsStore['find']>>) { return { userId: row.userId, order: publicOrder(row), snapshot: row.receiptSnapshot ?? null }; }

export function createBillingReportsRouter<Actor extends ApiActor>(reports: BillingReportsStore, deps: ServiceBillingDependencies) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(billingReportsContract).$context<ApiContext<Actor>>().router({
		listBillingOrderHistory: procedure(billingReportsContract.listBillingOrderHistory).use(account).handler(async ({ input, context }) => { const page = await reports.list({ ...input, userId: context.principal.id }); if (page.items.some(row => row.userId !== context.principal.id)) throw new Error('Invalid billing owner'); return { ...page, items: page.items.map(publicOrder) }; }),
		listAdminBillingOrders: procedure(billingReportsContract.listAdminBillingOrders).handler(async ({ input }) => { const page = await reports.list(input); return { ...page, items: page.items.map(publicAdminOrder) }; }),
		getBillingSalesSummary: procedure(billingReportsContract.getBillingSalesSummary).handler(({ input }) => reports.summary(input.from, input.to)),
		checkAdminBillingOrder: procedure(billingReportsContract.checkAdminBillingOrder).use(account).handler(async ({ input, context }) => {
			let row = await reports.find(input.orderId);
			if (row.status === 'pending') {
				if (!row.userId) throw new ORPCError('BILLING_UNAVAILABLE');
				row = await deps.store.submitTransaction(row.userId, row.id);
				if (row.status === 'pending' && row.txHash) row = await deps.store.applyReceipt(row.userId!, row.id, row.txHash, await deps.readReceipt(row.chainId, row.txHash, row.offer.confirmationsRequired), context.principal.id);
			}
			if (row.status === 'paid' && deps.notifyPurchase) void deps.notifyPurchase(row.id).catch(() => { console.warn('Purchase receipt notification attempt failed; reservation retained'); });
			return publicAdminOrder(row);
		}),
	});
}
