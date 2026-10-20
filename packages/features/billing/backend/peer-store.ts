/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ORPCError } from '@orpc/server';
import { encodeFunctionData, parseAbi } from 'viem';
import * as v from 'valibot';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBillingWallet } from './models/BillingWallet.js';
import { MiPeerPaymentToken, MiPeerPaymentIntent } from './models/PeerPayment.js';
import { requireCountryEligibility } from './country-eligibility.js';
import { peerTransfer } from './peer.contract.js';
import type { PeerToken, PreparePeerTransfer } from './peer.contract.js';
import type { ReceiptResult } from './transfer-confirmation.js';
import type { DataSource, EntityManager } from 'typeorm';

const abi = parseAbi(['function transfer(address to, uint256 amount) returns (bool)']);

function unavailable(): never { throw new ORPCError('PEER_UNAVAILABLE'); }

function missing(): never { throw new ORPCError('PEER_NOT_FOUND'); }

function conflict(): never { throw new ORPCError('PEER_CONFLICT'); }

const party = (row: MiPeerPaymentIntent, userId: string) => row.senderUserId === userId || row.recipientUserId === userId;
export function publicPeerTransfer(row: MiPeerPaymentIntent) {
	const { token, fromAddress, toAddress, amountBaseUnits } = row.terms;
	return v.parse(peerTransfer, { id: row.id, token, fromAddress, toAddress, amountBaseUnits, senderUserId: row.senderUserId, recipientUserId: row.recipientUserId,
																																createdAt: row.createdAt, expiresAt: row.expiresAt, status: row.status, txHash: row.txHash, logIndex: row.logIndex, confirmedAt: row.confirmedAt, broadcastStartedAt: row.broadcastStartedAt,
																																data: encodeFunctionData({ abi, functionName: 'transfer', args: [toAddress as `0x${string}`, BigInt(amountBaseUnits)] }) });
}

async function localRecipient(manager: EntityManager, userId: string) {
	const user = await manager.getRepository(MiUser).createQueryBuilder('user').select(['user.id', 'user.host', 'user.isSuspended', 'user.movedToUri']).where('user.id = :userId', { userId }).getOne();
	if (!user || user.host !== null || user.isSuspended || user.movedToUri) missing();
}

export function createPeerPaymentStore(db: DataSource, id: (now: number) => string, now = Date.now) {
	const intents = db.getRepository(MiPeerPaymentIntent), tokens = db.getRepository(MiPeerPaymentToken), wallets = db.getRepository(MiBillingWallet);
	return {
		async listTokens() { return (await tokens.find({ order: { id: 'ASC' }, take: 100 })).map(row => row.terms); },
		async saveToken(terms: PeerToken) {
			return db.transaction(async manager => {
				await manager.query('LOCK TABLE billing_peer_token IN SHARE ROW EXCLUSIVE MODE');
				if (!await manager.existsBy(MiPeerPaymentToken, { id: terms.id }) && await manager.count(MiPeerPaymentToken) >= 100) unavailable();
				await manager.upsert(MiPeerPaymentToken, { id: terms.id, terms }, ['id']); return terms;
			});
		},
		async ownPublication(userId: string) { return (await wallets.find({ where: { userId }, order: { id: 'ASC' } })).map(row => ({ walletId: row.id, chainId: row.chainId, address: row.address, isPublic: row.isPublicForPayments })); },
		async publish(userId: string, walletId: string, isPublic: boolean) {
			const updated = await wallets.update({ id: walletId, userId }, { isPublicForPayments: isPublic, updatedAt: now() });
			if (!updated.affected) missing(); return { isPublic };
		},
		async publicWallets(userId: string) {
			await localRecipient(db.manager, userId);
			return (await wallets.find({ where: { userId, isPublicForPayments: true }, order: { id: 'ASC' } })).map(row => ({ chainId: row.chainId, address: row.address }));
		},
		async prepare(userId: string, input: PreparePeerTransfer) {
			return db.transaction(async manager => {
				await manager.getRepository(MiUser).createQueryBuilder('user').select('user.id').where('user.id = :userId', { userId }).setLock('for_no_key_update').getOneOrFail();
				const existing = await manager.findOneBy(MiPeerPaymentIntent, { senderUserId: userId, requestKey: input.requestKey });
				if (existing) {
					if (existing.terms.senderWalletId !== input.walletId || existing.recipientUserId !== input.recipientUserId || existing.terms.toAddress !== input.recipientAddress || existing.terms.token.id !== input.tokenId || existing.terms.amountBaseUnits !== input.amountBaseUnits) conflict();
					return existing;
				}
				const countryEligibility = await requireCountryEligibility(manager, userId, input.recipientUserId);
				if (userId === input.recipientUserId) unavailable();
				await localRecipient(manager, input.recipientUserId);
				const token = await manager.getRepository(MiPeerPaymentToken).findOne({ where: { id: input.tokenId }, lock: { mode: 'pessimistic_read' } });
				if (!token?.terms.isEnabled) unavailable();
				const sender = await manager.findOneBy(MiBillingWallet, { id: input.walletId, userId, chainId: token.terms.chainId });
				const recipient = await manager.getRepository(MiBillingWallet).findOne({ where: { userId: input.recipientUserId, address: input.recipientAddress, chainId: token.terms.chainId, isPublicForPayments: true }, lock: { mode: 'pessimistic_read' } });
				if (!sender || !recipient) unavailable();
				const createdAt = now();
				if (Math.max(sender.createdAt, recipient.createdAt) > createdAt) unavailable();
				const row = manager.create(MiPeerPaymentIntent, { id: id(createdAt), senderUserId: userId, recipientUserId: input.recipientUserId, requestKey: input.requestKey, countryEligibility, broadcastCountryEligibility: null,
																																																						terms: { token: token.terms, senderWalletId: sender.id, recipientWalletId: recipient.id, fromAddress: sender.address, toAddress: recipient.address, amountBaseUnits: input.amountBaseUnits },
																																																						chainId: token.terms.chainId, createdAt, expiresAt: createdAt + 30 * 60 * 1000, status: 'pending', txHash: null, logIndex: null, confirmedAt: null, broadcastStartedAt: null });
				await manager.insert(MiPeerPaymentIntent, row); return row;
			});
		},
		async start(userId: string, intentId: string) {
			return db.transaction(async manager => {
				await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
				const row = await manager.getRepository(MiPeerPaymentIntent).findOne({ where: { id: intentId, senderUserId: userId }, lock: { mode: 'pessimistic_write' } });
				if (!row) missing();
				if (row.broadcastStartedAt !== null) conflict();
				if (!row.recipientUserId) unavailable();
				await localRecipient(manager, row.recipientUserId);
				const broadcastCountryEligibility = await requireCountryEligibility(manager, userId, row.recipientUserId);
				const startedAt = now();
				if (row.status !== 'pending' || row.txHash || row.expiresAt <= startedAt) unavailable();
				await manager.update(MiPeerPaymentIntent, row.id, { broadcastStartedAt: startedAt, broadcastCountryEligibility });
				return { ...row, broadcastStartedAt: startedAt, broadcastCountryEligibility };
			});
		},
		async submit(userId: string, intentId: string, txHash?: string) {
			return db.transaction(async manager => {
				const row = await manager.getRepository(MiPeerPaymentIntent).findOne({ where: { id: intentId }, lock: { mode: 'pessimistic_write' } });
				if (!row || !party(row, userId)) missing();
				// Only the payer can bind a new hash; either participant can retry verification.
				if (txHash && txHash !== row.txHash && row.senderUserId !== userId) missing();
				if (txHash && row.txHash && txHash !== row.txHash) conflict();
				if ((row.status === 'pending' || row.status === 'expired') && !row.txHash) {
					// Expiry stops a new wallet send, but must not discard a late approved/mined transfer.
					if (txHash) { row.txHash = txHash; row.status = 'pending'; } else if (now() >= row.expiresAt) row.status = 'expired';
					await manager.update(MiPeerPaymentIntent, row.id, { status: row.status, txHash: row.txHash });
				} return row;
			});
		},
		async apply(userId: string, intentId: string, txHash: string, result: ReceiptResult, logIndex?: number) {
			try {
				return await db.transaction(async manager => {
					const row = await manager.getRepository(MiPeerPaymentIntent).findOne({ where: { id: intentId }, lock: { mode: 'pessimistic_write' } });
					if (!row || !party(row, userId)) missing();
					if (row.txHash !== txHash) conflict();
					if (row.status !== 'pending' || result.status === 'pending') return row;
					if (result.status === 'invalid') { row.status = 'failed'; await manager.update(MiPeerPaymentIntent, row.id, { status: row.status }); return row; }
					const proof = result.evidence, terms = row.terms;
					if (proof.chainId !== row.chainId || proof.txHash !== txHash || proof.timestamp + 2000 < row.createdAt || proof.timestamp > now() + 2000) unavailable();
					const logs = proof.transfers.filter(log => log.contractAddress === terms.token.contractAddress && log.fromAddress === terms.fromAddress && log.toAddress === terms.toAddress && log.amountBaseUnits === terms.amountBaseUnits && (logIndex === undefined || log.logIndex === logIndex));
					if (logs.length !== 1) unavailable();
					row.status = 'confirmed'; row.logIndex = logs[0].logIndex; row.confirmedAt = now();
					await manager.update(MiPeerPaymentIntent, row.id, { status: row.status, logIndex: row.logIndex, confirmedAt: row.confirmedAt }); return row;
				});
			} catch (error) {
				if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505' && 'constraint' in error && error.constraint === 'billing_peer_intent_event_key') conflict();
				throw error;
			}
		},
		async list(userId: string) { return intents.find({ where: [{ senderUserId: userId }, { recipientUserId: userId }], order: { id: 'DESC' }, take: 100 }); },
	};
}
export type PeerPaymentStore = ReturnType<typeof createPeerPaymentStore>;
