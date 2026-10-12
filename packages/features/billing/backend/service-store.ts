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
import { MiBillingDetectedTransfer } from './models/BillingDetectedTransfer.js';
import { addServiceDuration, matchesOrder } from './service-receipt.js';
import type { ServiceOffer } from './api.definition.js';
import type { ReceiptResult, TransferEvidence } from './service-receipt.js';
import type { DataSource } from 'typeorm';

function sameOffer(left: ServiceOffer, right: ServiceOffer): boolean { return Object.entries(left).every(([key, value]) => right[key as keyof ServiceOffer] === value); }

function unavailable(): never { throw new ORPCError('BILLING_UNAVAILABLE'); }

function conflict(): never { throw new ORPCError('BILLING_CONFLICT'); }

function duplicate(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'; }

/** Transactions reserve evidence and grant a term exactly once. No wallet funds are held. */
export function createServiceBillingStore(db: DataSource, id: (now: number) => string, now = Date.now) {
	const offers = db.getRepository(MiBillingServiceOffer);
	const orders = db.getRepository(MiBillingServiceOrder);
	const transfers = db.getRepository(MiBillingDetectedTransfer);
	return {
		async listOffers() { return (await offers.find({ order: { id: 'ASC' }, take: 100 })).map(row => row.terms); },
		async saveOffer(terms: ServiceOffer, actorId: string) {
			await db.transaction(async manager => {
				await manager.query('LOCK TABLE billing_service_offer IN SHARE ROW EXCLUSIVE MODE');
				if (!await manager.existsBy(MiBillingServiceOffer, { id: terms.id }) && await manager.count(MiBillingServiceOffer) >= 100) unavailable();
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
		async reserveTransaction(userId: string, orderId: string, txHash?: string) {
			try {
				return await db.transaction(async manager => {
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
			} catch (error) { if (duplicate(error)) conflict(); throw error; }
		},
		async applyReceipt(userId: string, orderId: string, txHash: string, result: ReceiptResult) {
			return db.transaction(async manager => {
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
				row.paidAt = now(); row.startsAt = Math.max(row.paidAt, latest?.endsAt ?? 0);
				row.endsAt = addServiceDuration(row.startsAt, row.offer.duration, row.offer.durationUnit);
				if (!Number.isSafeInteger(row.endsAt) || row.endsAt <= row.startsAt) unavailable();
				row.status = 'paid';
				await manager.update(MiBillingServiceOrder, row.id, { status: row.status, paidAt: row.paidAt, startsAt: row.startsAt, endsAt: row.endsAt });
				return row;
			});
		},
		async listTransfers(userId: string) {
			return transfers.find({ where: [{ senderUserId: userId }, { recipientUserId: userId }], order: { id: 'DESC' }, take: 100 });
		},
		async recordTransfer(userId: string, chainId: number, txHash: string, log: TransferEvidence, timestamp: number) {
			return db.transaction(async manager => {
				// Participant IDs are pinned on first observation, including after unlink/deletion.
				const identity = { chainId, txHash, logIndex: log.logIndex };
				const existing = await manager.findOneBy(MiBillingDetectedTransfer, identity);
				if (existing) {
					if (existing.senderUserId !== userId && existing.recipientUserId !== userId) throw new ORPCError('BILLING_NOT_FOUND');
					return existing;
				}
				const wallets = await manager.getRepository(MiBillingWallet).createQueryBuilder('wallet')
					.where('wallet."chainId" = :chainId AND wallet.address IN (:...addresses)', { chainId, addresses: [log.fromAddress, log.toAddress] })
					.setLock('pessimistic_read').getMany();
				const sender = wallets.find(wallet => wallet.address === log.fromAddress);
				const recipient = wallets.find(wallet => wallet.address === log.toAddress);
				if (!sender || !recipient || sender.userId === recipient.userId || timestamp + 2000 < Math.max(sender.createdAt, recipient.createdAt) || timestamp > now() + 2000 || (sender.userId !== userId && recipient.userId !== userId)) throw new ORPCError('BILLING_NOT_FOUND');
				const observedAt = now();
				const row = manager.create(MiBillingDetectedTransfer, { id: id(observedAt), ...identity, ...log, senderUserId: sender.userId, recipientUserId: recipient.userId, observedAt });
				// Concurrency-safe: an event can never be remapped to newly linked accounts.
				await manager.createQueryBuilder().insert().into(MiBillingDetectedTransfer).values(row).orIgnore().execute();
				const recorded = await manager.findOneByOrFail(MiBillingDetectedTransfer, identity);
				if (recorded.senderUserId !== userId && recorded.recipientUserId !== userId) throw new ORPCError('BILLING_NOT_FOUND');
				return recorded;
			});
		},
	};
}
export type ServiceBillingStore = ReturnType<typeof createServiceBillingStore>;
