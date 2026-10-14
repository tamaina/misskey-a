/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createReceiptSnapshot } from './policy-store.js';
import type { PurchaseContext } from './policy-store.js';
import { recordCatalogAudit } from './catalog-audit.js';
import { MiBillingWalletChain } from './models/BillingWalletChain.js';
import { MiBillingCatalogPrice } from './models/BillingCatalogPrice.js';
import { MiBillingPricingAsset } from './models/BillingPricingAsset.js';
import { MiBillingAssetDeployment } from './models/BillingAssetDeployment.js';
import { offerAvailable, catalog, priceId, validPriceCatalog, immutablePriceMatches } from './service-catalog.js';
import { isDeepStrictEqual } from 'node:util';
import { lockBillingState, saveBillingState, quoteServiceTerm, applyFundedTerm } from './billing-state.js';
import type { PaymentQuote } from '../shared/payment-quote.js';
import { ORPCError } from '@orpc/server';
import { MiBillingWallet } from './models/BillingWallet.js';
import { MiBillingServiceOffer } from './models/BillingServiceOffer.js';
import { MiBillingTransactionClaim } from './models/BillingTransactionClaim.js';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import { MiRole } from '@features/roles/backend/models/Role.js';
import { matchesOrder } from './service-receipt.js';
import type { ServiceOffer } from './api.definition.js';
import type { ReceiptResult } from './service-receipt.js';
import type { DataSource, EntityManager } from 'typeorm';

function sameOffer(left: ServiceOffer, right: ServiceOffer): boolean { return Object.entries(left).every(([key, value]) => right[key as keyof ServiceOffer] === value); }

function unavailable(): never { throw new ORPCError('BILLING_UNAVAILABLE'); }

function conflict(): never { throw new ORPCError('BILLING_CONFLICT'); }

function duplicateClaim(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505' && 'constraint' in error && error.constraint === 'billing_service_order_transaction_key'; }

/** Payment can never confer administrative, moderation or conditional roles. */
async function requirePurchasableRole(manager: EntityManager, roleId?: string | null) {
	if (!roleId) return;
	const role = await manager.getRepository(MiRole).createQueryBuilder('role').select(['role.id', 'role.target', 'role.isAdministrator', 'role.isModerator']).where('role.id = :roleId', { roleId }).setLock('pessimistic_read').getOne();
	if (!role || role.target !== 'manual' || role.isAdministrator || role.isModerator) unavailable();
}

/** Only matching confirmed receipts acquire a global claim, atomically with their term. */
async function managedOffer(manager: EntityManager, offer: ServiceOffer, enabled: boolean): Promise<ServiceOffer> {
	if (!offer.deploymentId) return offer;
	const deployment = await manager.findOneBy(MiBillingAssetDeployment, { id: offer.deploymentId });
	if (!deployment) unavailable();
	const chain = await manager.findOneBy(MiBillingWalletChain, { chainId: deployment!.chainId });
	if (!chain || (enabled && !chain.isEnabled)) unavailable();
	const asset = await manager.findOneBy(MiBillingPricingAsset, { id: deployment!.assetId });
	if (!asset || (enabled && (!asset.data.isEnabled || !deployment!.data.isEnabled))) unavailable();
	if (offer.pricingAssetKey !== asset!.pricingAssetKey || offer.decimals !== deployment!.data.decimals || offer.chainId !== deployment!.chainId || offer.contractAddress.toLowerCase() !== deployment!.contractAddress || offer.recipientAddress.toLowerCase() !== deployment!.data.recipientAddress) conflict();
	return { ...offer, currencyCode: asset!.data.currencyCode, tokenSymbol: deployment!.data.tokenSymbol };
}

export function createServiceBillingStore(db: DataSource, id: (now: number) => string, now = Date.now) {
	const offers = db.getRepository(MiBillingServiceOffer);
	const orders = db.getRepository(MiBillingServiceOrder);
	return {
		async quoteOrder(userId: string, offerId: string) {
			return db.transaction(async manager => {
				const state = await lockBillingState(manager, userId);
				if (state.lockRequestId) conflict();
				const offer = await manager.findOneBy(MiBillingServiceOffer, { id: offerId });
				if (!offer || !offerAvailable(offer.terms, now())) unavailable();
				return { revision: state.revision, quote: quoteServiceTerm(state, await managedOffer(manager, offer.terms, true), now()) };
			});
		},
		async cancelOrder(userId: string, orderId: string) {
			return db.transaction(async manager => {
				const state = await lockBillingState(manager, userId);
				const row = await manager.findOneBy(MiBillingServiceOrder, { id: orderId, userId });
				if (!row) throw new ORPCError('BILLING_NOT_FOUND');
				if (state.lockRequestId || row.status !== 'pending' || row.txHash) conflict();
				await manager.update(MiBillingServiceOrder, row.id, { status: 'expired' });
				return { ok: true as const };
			});
		},
		async listOffers() { return (await offers.find({ order: { id: 'ASC' }, take: 1000 })).map(row => row.terms); },
		async listCatalog() {
			const available = [];
			for (const offer of await this.listOffers()) {
				try { available.push(await managedOffer(db.manager, offer, true)); } catch (error) { if (!(error instanceof ORPCError)) throw error; }
			}
			return catalog(available, now(), (await db.manager.find(MiBillingCatalogPrice)).map(row => row.terms));
		},
		async saveOffer(terms: ServiceOffer, actorId: string) {
			await db.transaction(async manager => {
				await manager.query("SELECT pg_advisory_xact_lock(hashtextextended('billing-price-catalog', 0))");
				terms = await managedOffer(manager, terms, false);
				const rows = await manager.find(MiBillingServiceOffer);
				const previous = rows.find(row => row.id === terms.id);
				const recorded = await manager.find(MiBillingCatalogPrice);
				const original = recorded.find(row => row.id === priceId(terms));
				if (original && !immutablePriceMatches({ ...original.terms, catalogPriceId: priceId(terms) }, { ...terms, catalogPriceId: priceId(terms) })) conflict();
				const catalogRows = [...rows, ...recorded].map(row => terms.priceStartsAt != null && priceId(terms) === priceId(row.terms) ? { ...row.terms, priceExpiresAt: terms.priceExpiresAt ?? null } : row.terms);
				if (!validPriceCatalog(terms, catalogRows) || (previous && !immutablePriceMatches(previous.terms, terms))) conflict();
				await manager.query('LOCK TABLE billing_service_offer IN SHARE ROW EXCLUSIVE MODE');
				if (!await manager.existsBy(MiBillingServiceOffer, { id: terms.id }) && await manager.count(MiBillingServiceOffer) >= 1000) unavailable();
				await requirePurchasableRole(manager, terms.roleId);
				await recordCatalogAudit(manager, actorId, id(now()), 'upsertPrice', terms.id, previous?.terms ?? null, terms);
				await manager.upsert(MiBillingServiceOffer, { id: terms.id, terms, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
				if (terms.priceStartsAt != null) {
					if (!recorded.some(row => row.id === priceId(terms)) && recorded.length >= 1000) unavailable();
					await manager.upsert(MiBillingCatalogPrice, { id: priceId(terms), terms: { ...terms, catalogPriceId: priceId(terms), isEnabled: terms.isEnabled || rows.some(row => row.id !== terms.id && priceId(row.terms) === priceId(terms) && row.terms.isEnabled) }, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
				}
				if (terms.priceStartsAt != null) for (const row of rows) if (row.id !== terms.id && priceId(row.terms) === priceId(terms)) {
					await manager.update(MiBillingServiceOffer, row.id, { terms: { ...row.terms, priceExpiresAt: terms.priceExpiresAt ?? null }, updatedAt: new Date(now()), updatedByUserId: actorId });
				}
			});
			return terms;
		},
		async getReceipt(userId: string, orderId: string) { const row = await orders.findOneBy({ id: orderId, userId, status: 'paid' }); if (!row) throw new ORPCError('BILLING_NOT_FOUND'); return row; },
		async listOrders(userId: string) { return orders.find({ where: { userId }, order: { id: 'DESC' }, take: 100 }); },
		async createOrder(userId: string, offerId: string, walletId: string, requestKey: string, quotedOffer: ServiceOffer, quotedQuote?: { revision: number; quote: PaymentQuote }, purchase?: PurchaseContext) {
			return db.transaction(async manager => {
				const state = await lockBillingState(manager, userId);
				const existing = await manager.findOneBy(MiBillingServiceOrder, { userId, requestKey });
				if (existing) {
					if (existing.offer.id !== offerId || existing.walletId !== walletId || !sameOffer(existing.offer, quotedOffer) || (quotedQuote && (!isDeepStrictEqual(existing.quote, quotedQuote.quote) || existing.billingRevision !== quotedQuote.revision))) conflict();
					if (existing.receiptSnapshot && purchase?.consent?.statementId !== existing.receiptSnapshot.statement.id) conflict();
					return existing;
				}
				const offer = await manager.getRepository(MiBillingServiceOffer).findOne({ where: { id: offerId }, lock: { mode: 'pessimistic_read' } });
				if (offer) offer.terms = await managedOffer(manager, offer.terms, true);
				const wallet = await manager.findOneBy(MiBillingWallet, { id: walletId, userId });
				if (!offer || !offerAvailable(offer.terms, now()) || !wallet || wallet.chainId !== offer.terms.chainId) unavailable();
				if (!sameOffer(offer.terms, quotedOffer)) conflict();
				const createdAt = now();
				if (state.lockRequestId) conflict();
				if ((offer.terms.planGroup || offer.terms.amountBaseUnits === '0') && !quotedQuote) conflict();
				const pendingOrders = await manager.findBy(MiBillingServiceOrder, { userId, status: 'pending' });
				if (pendingOrders.some(row => row.quote && (row.txHash || row.expiresAt > createdAt))) conflict();
				let quote: PaymentQuote | null = null;
				if (quotedQuote) {
					if (quotedQuote.revision !== state.revision || quotedQuote.quote.quoteCreatedAt > createdAt + 60000 || quotedQuote.quote.quoteExpiresAt <= createdAt) conflict();
					quote = quoteServiceTerm(state, offer.terms, quotedQuote.quote.quoteCreatedAt);
					if (!isDeepStrictEqual(quote, quotedQuote.quote)) conflict();
					const pending = await manager.findBy(MiBillingServiceOrder, { userId, status: 'pending' });
					if (pending.some(row => row.txHash || row.expiresAt > createdAt)) conflict();
				}
				const snapshot = await createReceiptSnapshot(manager, purchase, quote?.payableAmountBaseUnits ?? offer.terms.amountBaseUnits, offer.terms.currencyCode, createdAt, () => id(createdAt));
				const row = manager.create(MiBillingServiceOrder, { id: id(createdAt), userId, walletId, requestKey, receiptSnapshot: snapshot,
																																																								quote, billingRevision: quotedQuote?.revision ?? null, cashAmountBaseUnits: quote?.payableAmountBaseUnits ?? offer.terms.amountBaseUnits, offer: offer.terms, chainId: wallet.chainId, payerAddress: wallet.address,
																																																								status: 'pending', createdAt, expiresAt: createdAt + 30 * 60 * 1000,
																																																								txHash: null, paidAt: null, startsAt: null, endsAt: null });
				await manager.insert(MiBillingServiceOrder, row);
				if (quote?.payableAmountBaseUnits === '0') {
					await requirePurchasableRole(manager, row.offer.roleId);
					row.status = 'paid'; row.paidAt = createdAt; row.startsAt = quote.effectiveStartsAt; row.endsAt = quote.effectiveExpiresAt;
					applyFundedTerm(state, row, quote, () => id(now()));
					await manager.update(MiBillingServiceOrder, row.id, { status: row.status, paidAt: row.paidAt, startsAt: row.startsAt, endsAt: row.endsAt });
					await saveBillingState(manager, userId, state);
				}
				return row;
			});
		},
		/** Stores a per-order retry hint; it is not a global claim until proof matches. */
		async submitTransaction(userId: string, orderId: string, txHash?: string) {
			return db.transaction(async manager => {
				const state = await lockBillingState(manager, userId);
				const row = await manager.getRepository(MiBillingServiceOrder).findOne({ where: { id: orderId, userId }, lock: { mode: 'pessimistic_write' } });
				if (!row) throw new ORPCError('BILLING_NOT_FOUND');
				if (txHash && row.txHash && txHash !== row.txHash) conflict();
				if (row.status !== 'pending') return row;
				if (state.lockRequestId) conflict();
				if (row.txHash === null) {
					if (row.expiresAt <= now()) row.status = 'expired';
					else if (txHash) {
						await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${row.chainId}:${txHash}`]);
						if (await manager.existsBy(MiBillingTransactionClaim, { chainId: String(row.chainId), txHash })) conflict();
						row.txHash = txHash;
					}
					await manager.update(MiBillingServiceOrder, row.id, { status: row.status, txHash: row.txHash });
				}
				return row;
			});
		},
		async applyReceipt(userId: string, orderId: string, txHash: string, result: ReceiptResult) {
			try {
				return await db.transaction(async manager => {
					const state = await lockBillingState(manager, userId);
				const row = await manager.getRepository(MiBillingServiceOrder).findOne({ where: { id: orderId, userId }, lock: { mode: 'pessimistic_write' } });
					if (!row) throw new ORPCError('BILLING_NOT_FOUND');
					if (row.txHash !== txHash) conflict();
					if (row.status !== 'pending' || result.status === 'pending') return row;
					if (result.status === 'invalid' || !matchesOrder(result.evidence, row)) {
						row.status = 'failed';
						await manager.update(MiBillingServiceOrder, row.id, { status: row.status });
						return row;
					}
					if (state.lockRequestId || (row.billingRevision !== null && row.billingRevision !== state.revision)) conflict();
					await requirePurchasableRole(manager, row.offer.roleId);
					await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${row.chainId}:${txHash}`]);
					if (await manager.existsBy(MiBillingTransactionClaim, { chainId: String(row.chainId), txHash })) conflict();
					await manager.insert(MiBillingTransactionClaim, { chainId: String(row.chainId), txHash, ownerId: row.id });
					row.paidAt = now();
					const quote = row.quote ?? quoteServiceTerm(state, row.offer, row.paidAt);
					row.startsAt = quote.effectiveStartsAt; row.endsAt = quote.effectiveExpiresAt;
					if (!Number.isSafeInteger(row.endsAt) || row.endsAt <= row.startsAt) unavailable();
					row.status = 'paid';
					applyFundedTerm(state, row, quote, () => id(now()));
					await saveBillingState(manager, userId, state);
					await manager.update(MiBillingServiceOrder, row.id, { status: row.status, paidAt: row.paidAt, startsAt: row.startsAt, endsAt: row.endsAt });
					return row;
				});
			} catch (error) { if (duplicateClaim(error)) conflict(); throw error; }
		},
	};
}
export type ServiceBillingStore = ReturnType<typeof createServiceBillingStore>;
