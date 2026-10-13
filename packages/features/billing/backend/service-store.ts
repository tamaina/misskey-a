/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ORPCError } from '@orpc/server';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBillingWallet } from './models/BillingWallet.js';
import { MiBillingServiceOffer } from './models/BillingServiceOffer.js';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import { MiRole } from '@features/roles/backend/models/Role.js';
import { matchesOrder } from './service-receipt.js';
import { calculatePaymentQuote } from '../shared/payment-quote.js';
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
export function createServiceBillingStore(db: DataSource, id: (now: number) => string, now = Date.now) {
	const offers = db.getRepository(MiBillingServiceOffer);
	const orders = db.getRepository(MiBillingServiceOrder);
	return {
		async listOffers() { return (await offers.find({ order: { id: 'ASC' }, take: 100 })).map(row => row.terms); },
		async saveOffer(terms: ServiceOffer, actorId: string) {
			await db.transaction(async manager => {
				await manager.query('LOCK TABLE billing_service_offer IN SHARE ROW EXCLUSIVE MODE');
				if (!await manager.existsBy(MiBillingServiceOffer, { id: terms.id }) && await manager.count(MiBillingServiceOffer) >= 100) unavailable();
				await requirePurchasableRole(manager, terms.roleId);
				await manager.upsert(MiBillingServiceOffer, { id: terms.id, terms, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
			});
			return terms;
		},
		async listOrders(userId: string) { return orders.find({ where: { userId }, order: { id: 'DESC' }, take: 100 }); },
		async createOrder(userId: string, offerId: string, walletId: string, requestKey: string, quotedOffer: ServiceOffer) {
			return db.transaction(async manager => {
				// Also serializes idempotent create and same-service renewal for this account.
				await manager.getRepository(MiUser).createQueryBuilder('user').select('user.id').where('user.id = :userId', { userId }).setLock('for_no_key_update').getOneOrFail();
				const existing = await manager.findOneBy(MiBillingServiceOrder, { userId, requestKey });
				if (existing) {
					if (existing.offer.id !== offerId || existing.walletId !== walletId || !sameOffer(existing.offer, quotedOffer)) conflict();
					return existing;
				}
				const offer = await manager.getRepository(MiBillingServiceOffer).findOne({ where: { id: offerId }, lock: { mode: 'pessimistic_read' } });
				const wallet = await manager.findOneBy(MiBillingWallet, { id: walletId, userId });
				if (!offer?.terms.isEnabled || !wallet || wallet.chainId !== offer.terms.chainId) unavailable();
				if (!sameOffer(offer.terms, quotedOffer)) conflict();
				const createdAt = now();
				const row = manager.create(MiBillingServiceOrder, { id: id(createdAt), userId, walletId, requestKey,
																																																								offer: offer.terms, chainId: wallet.chainId, payerAddress: wallet.address,
																																																								status: 'pending', createdAt, expiresAt: createdAt + 30 * 60 * 1000,
																																																								txHash: null, paidAt: null, startsAt: null, endsAt: null });
				await manager.insert(MiBillingServiceOrder, row);
				return row;
			});
		},
		/** Stores a per-order retry hint; it is not a global claim until proof matches. */
		async submitTransaction(userId: string, orderId: string, txHash?: string) {
			return db.transaction(async manager => {
				const row = await manager.getRepository(MiBillingServiceOrder).findOne({ where: { id: orderId, userId }, lock: { mode: 'pessimistic_write' } });
				if (!row) throw new ORPCError('BILLING_NOT_FOUND');
				if (txHash && row.txHash && txHash !== row.txHash) conflict();
				if (row.status !== 'pending') return row;
				if (row.txHash === null) {
					if (row.expiresAt <= now()) row.status = 'expired';
					else if (txHash) row.txHash = txHash;
					await manager.update(MiBillingServiceOrder, row.id, { status: row.status, txHash: row.txHash });
				}
				return row;
			});
		},
		async applyReceipt(userId: string, orderId: string, txHash: string, result: ReceiptResult) {
			try {
				return await db.transaction(async manager => {
					const row = await manager.getRepository(MiBillingServiceOrder).findOne({ where: { id: orderId, userId }, lock: { mode: 'pessimistic_write' } });
					if (!row) throw new ORPCError('BILLING_NOT_FOUND');
					if (row.txHash !== txHash) conflict();
					if (row.status !== 'pending' || result.status === 'pending') return row;
					if (result.status === 'invalid' || !matchesOrder(result.evidence, row)) {
						row.status = 'failed';
						await manager.update(MiBillingServiceOrder, row.id, { status: row.status });
						return row;
					}
					await manager.getRepository(MiUser).createQueryBuilder('user').select('user.id').where('user.id = :userId', { userId }).setLock('for_no_key_update').getOneOrFail();
					const latest = await manager.getRepository(MiBillingServiceOrder).createQueryBuilder('term')
						.where('term."userId" = :userId AND term.status = :status AND term.offer->>\'serviceKey\' = :key', { userId, status: 'paid', key: row.offer.serviceKey })
						.orderBy('term.endsAt', 'DESC').getOne();
					await requirePurchasableRole(manager, row.offer.roleId);
					row.paidAt = now();
					// The representative slice uses the source kernel's initial/same-plan branches.
					// Different plan ranks, discounts and assignment trimming remain unimplemented.
					const quote = calculatePaymentQuote({ quoteCreatedAt: row.paidAt, quoteTtlMs: 30 * 60 * 1000,
						targetPlanId: row.offer.serviceKey, targetPlanSortOrder: 0,
						targetPlanPrice: { amountBaseUnits: row.offer.amountBaseUnits, durationDays: row.offer.duration, durationUnit: row.offer.durationUnit },
						currentPlan: latest?.endsAt && latest.endsAt > row.paidAt ? { id: row.offer.serviceKey, name: latest.offer.name, sortOrder: 0,
							startsAt: latest.startsAt ?? undefined, expiresAt: latest.endsAt,
							price: { amountBaseUnits: latest.offer.amountBaseUnits, durationDays: latest.offer.duration, durationUnit: latest.offer.durationUnit } } : null });
					row.startsAt = quote.effectiveStartsAt; row.endsAt = quote.effectiveExpiresAt;
					if (!Number.isSafeInteger(row.endsAt) || row.endsAt <= row.startsAt) unavailable();
					row.status = 'paid';
					await manager.update(MiBillingServiceOrder, row.id, { status: row.status, paidAt: row.paidAt, startsAt: row.startsAt, endsAt: row.endsAt });
					return row;
				});
			} catch (error) { if (duplicateClaim(error)) conflict(); throw error; }
		},
	};
}
export type ServiceBillingStore = ReturnType<typeof createServiceBillingStore>;
