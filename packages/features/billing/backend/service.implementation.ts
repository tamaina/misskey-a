/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement, ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { serviceBillingContract, serviceOffer, serviceOrder, catalogOffer } from './api.definition.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { ServiceBillingStore } from './service-store.js';
import type { ReceiptReader } from './service-receipt.js';

export interface ServiceBillingDependencies {
	store: ServiceBillingStore;
	readReceipt: ReceiptReader;
	rpcUrl(chainId: number): Promise<string | null>;
}

function publicOrder(row: Awaited<ReturnType<ServiceBillingStore['createOrder']>>) {
	return v.parse(serviceOrder, { id: row.id, offer: row.offer, payerAddress: row.payerAddress, status: row.status, txHash: row.txHash,
																																amountBaseUnits: row.cashAmountBaseUnits ?? row.offer.amountBaseUnits, quote: row.quote, createdAt: row.createdAt, expiresAt: row.expiresAt, paidAt: row.paidAt, startsAt: row.startsAt, endsAt: row.endsAt });
}

export function createServiceBillingRouter<Actor extends ApiActor>(deps: ServiceBillingDependencies) {
	const procedure = createApiProcedure<Actor>();
	const account = requirePrincipal<Actor>();
	return implement(serviceBillingContract).$context<ApiContext<Actor>>().router({
		listCatalog: procedure(serviceBillingContract.listCatalog).handler(async () => {
			const items = [];
			for (const item of await deps.store.listCatalog()) if (await deps.rpcUrl(item.offer.chainId)) items.push(item);
			return v.parse(v.array(catalogOffer), items);
		}),
		cancelOrder: procedure(serviceBillingContract.cancelOrder).use(account).handler(({ input, context }) => deps.store.cancelOrder(context.principal.id, input.orderId)),
		quoteOrder: procedure(serviceBillingContract.quoteOrder).use(account).handler(({ input, context }) => deps.store.quoteOrder(context.principal.id, input.offerId)),
		listOfferSettings: procedure(serviceBillingContract.listOfferSettings).handler(async () => v.parse(v.array(serviceOffer), await deps.store.listOffers())),
		upsertOffer: procedure(serviceBillingContract.upsertOffer).use(account).handler(async ({ input, context }) => {
			const normalized = { ...input, contractAddress: input.contractAddress.toLowerCase(), recipientAddress: input.recipientAddress.toLowerCase() };
			if (normalized.isEnabled && !await deps.rpcUrl(normalized.chainId)) throw new ORPCError('BILLING_UNAVAILABLE');
			return deps.store.saveOffer(normalized, context.principal.id);
		}),
		listOffers: procedure(serviceBillingContract.listOffers).handler(async () => {
			const result = [];
			for (const { offer } of await deps.store.listCatalog()) if (await deps.rpcUrl(offer.chainId)) result.push(v.parse(serviceOffer, offer));
			return result;
		}),
		createOrder: procedure(serviceBillingContract.createOrder).use(account).handler(async ({ input, context }) => {
			const offer = (await deps.store.listOffers()).find(row => row.id === input.offerId);
			if (!offer || !await deps.rpcUrl(offer.chainId)) throw new ORPCError('BILLING_UNAVAILABLE');
			return publicOrder(await deps.store.createOrder(context.principal.id, input.offerId, input.walletId, input.requestKey, input.quotedOffer, input.quotedQuote));
		}),
		checkOrder: procedure(serviceBillingContract.checkOrder).use(account).handler(async ({ input, context }) => {
			const row = await deps.store.submitTransaction(context.principal.id, input.orderId, input.txHash?.toLowerCase());
			if (row.status !== 'pending' || !row.txHash) return publicOrder(row);
			const receipt = await deps.readReceipt(row.chainId, row.txHash, row.offer.confirmationsRequired);
			return publicOrder(await deps.store.applyReceipt(context.principal.id, row.id, row.txHash, receipt));
		}),
		listOrders: procedure(serviceBillingContract.listOrders).use(account).handler(async ({ context }) => {
			const rows = await deps.store.listOrders(context.principal.id);
			if (rows.some(row => row.userId !== context.principal.id)) throw new Error('Invalid billing owner');
			return rows.map(publicOrder);
		}),
	});
}
