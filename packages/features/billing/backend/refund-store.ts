/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isDeepStrictEqual } from 'node:util';
import { ORPCError } from '@orpc/server';
import { calculateRefundTaxBaseUnits } from '../shared/billing-tax.js';
import { fundingIntervalAmount } from '../shared/billing-funding.js';
import { groupBillingRefundLines } from '../shared/billing-refund-groups.js';
import { splitBillingRefundPeriod } from '../shared/billing-refund-period.js';
import { MiBillingPolicy } from './models/BillingPolicy.js';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import { MiBillingRefund } from './models/BillingRefund.js';
import { MiBillingTransactionClaim } from './models/BillingTransactionClaim.js';
import { lockBillingState, saveBillingState, billingConflict } from './billing-state.js';
import type { BillingState } from './billing-state.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { ReceiptEvidence, ReceiptReader } from './transfer-confirmation.js';
import type { RefundData, RefundDocument, RefundQuote, RefundTransfer } from '../shared/refund-types.js';
import type { BillingRefundLine } from '../shared/billing-refund-groups.js';

function missing(): never { throw new ORPCError('BILLING_NOT_FOUND'); }

function reviewRequired(): never { throw new ORPCError('BILLING_REVIEW_REQUIRED'); }

export async function calculateRefundQuote(manager: EntityManager, userId: string, state: BillingState, cutoffAt: number): Promise<RefundQuote> {
	const assignments = state.terms.filter(term => term.expiresAt > cutoffAt);
	const lines: BillingRefundLine[] = [], reviewReasons: string[] = [];
	const orders = new Map<string, MiBillingServiceOrder>();
	for (const term of assignments) {
		const lots = state.lots.filter(lot => lot.termId === term.id);
		if (!term.provenanceComplete || !lots.length) { reviewReasons.push(`利用期間 ${term.id}: 原購入・充当の由来不明`); continue; }
		for (const lot of lots) {
			let order = orders.get(lot.sourceOrderId);
			if (!order) { order = await manager.findOneBy(MiBillingServiceOrder, { id: lot.sourceOrderId, userId, status: 'paid' }) ?? undefined; if (!order || order.cashAmountBaseUnits === null) reviewRequired(); orders.set(order.id, order); }
			lines.push({ id: lot.id, assignmentId: term.id, amountBaseUnits: fundingIntervalAmount(lot, cutoffAt, term.expiresAt).toString(), sourceOrder: { id: order.id, payerAddress: order.payerAddress, chainId: order.chainId, contractAddress: order.offer.contractAddress, decimals: order.offer.decimals } });
		}
	}
	for (const order of orders.values()) {
		const allocated = lines.filter(line => line.sourceOrder.id === order.id).reduce((sum, line) => sum + BigInt(line.amountBaseUnits), 0n);
		if (allocated + BigInt(state.refunded[order.id] ?? '0') > BigInt(order.cashAmountBaseUnits!)) reviewReasons.push(`原注文 ${order.id}: 累積返金上限を超える配賦`);
	}
	const groups = groupBillingRefundLines(lines).filter(group => BigInt(group.amountBaseUnits) > 0n).map((group, index) => ({ ...group, id: String(index), confirmations: Math.max(...group.lines.map(line => orders.get(line.sourceOrder.id)!.offer.confirmationsRequired)) }));
	if (groups.length > 20 || groups.some(group => BigInt(group.amountBaseUnits) >= 2n ** 256n) || assignments.length > 1000) reviewReasons.push('一括処理の上限を超えるため確認が必要');
	return { revision: state.revision, effectiveCutoffAt: cutoffAt, assignments, groups, reviewReasons };
}

/** Refund proof is exact, canonical and directed to the ORIGINAL payer. No purchase matcher reuse. */
export function matchesRefund(group: RefundQuote['groups'][number], transfer: RefundTransfer, evidence: ReceiptEvidence): boolean {
	return evidence.chainId === group.chainId && evidence.txHash === transfer.txHash && typeof evidence.blockHash === 'string' && typeof evidence.blockNumber === 'string'
		&& transfer.startedAt !== null && evidence.timestamp + 2000 >= transfer.startedAt
		&& evidence.transfers.some(log => log.contractAddress === group.contractAddress && log.fromAddress === transfer.senderAddress && log.toAddress === group.payerAddress && log.amountBaseUnits === group.amountBaseUnits);
}

/** PostgreSQL user locks participate in purchases too; no entitlement changes before all proofs. */
export function createRefundStore(db: DataSource, id: () => string, readReceipt: ReceiptReader, now = Date.now) {
	const rows = db.getRepository(MiBillingRefund);

	async function withRequest<T>(requestId: string, action: (manager: EntityManager, row: MiBillingRefund, state: BillingState) => Promise<T>) {
		const hint = await rows.findOneBy({ id: requestId }); if (!hint?.userId) missing();
		return db.transaction(async manager => {
			const state = await lockBillingState(manager, hint.userId!);
			const row = await manager.findOneBy(MiBillingRefund, { id: requestId, userId: hint.userId! }); if (!row) missing();
			return action(manager, row, state);
		});
	}

	async function save(manager: EntityManager, row: MiBillingRefund, state: BillingState, actorId: string, action: string) {
		row.data.version++; row.data.events.push({ actorId, action, at: now(), reason: row.data.reason });
		await manager.update(MiBillingRefund, row.id, { data: row.data }); await saveBillingState(manager, row.userId!, state);
		return row.data;
	}

	return {
		async list(userId?: string, cursor?: string, limit = 20) {
			const query = rows.createQueryBuilder('refund').orderBy('refund.id', 'DESC').take(limit + 1);
			if (userId) query.where('refund."userId" = :userId', { userId });
			if (cursor) query.andWhere('refund.id < :cursor', { cursor });
			const result = await query.getMany(); return { items: result.slice(0, limit).map(row => row.data), nextCursor: result.length > limit ? result[limit - 1].id : null };
		},
		async show(requestId: string, userId?: string) { const row = await rows.findOneBy({ id: requestId, ...(userId ? { userId } : {}) }); if (!row) missing(); return row.data; },
		async request(userId: string, requestKey: string, cutoffAt: number | undefined, reason: string) {
			return db.transaction(async manager => {
				const state = await lockBillingState(manager, userId);
				const prior = await manager.findOneBy(MiBillingRefund, { userId, requestKey });
				if (prior) { if (prior.data.requestedMode !== (cutoffAt === undefined ? 'immediate' : 'scheduled') || (cutoffAt !== undefined && prior.data.requestedCutoffAt !== cutoffAt) || prior.data.events[0].reason !== reason) billingConflict(); return prior.data; }
				const requestedCutoffAt = cutoffAt ?? now();
				if (!Number.isSafeInteger(requestedCutoffAt) || (cutoffAt !== undefined && cutoffAt < now()) || state.lockRequestId) billingConflict();
				const quote = await calculateRefundQuote(manager, userId, state, requestedCutoffAt);
				const requestId = id();
				const data: RefundData = { id: requestId, version: 0, status: quote.reviewReasons.length ? 'review_required' : 'requested', requestedMode: cutoffAt === undefined ? 'immediate' : 'scheduled', requestedCutoffAt, effectiveCutoffAt: null, reason, createdAt: now(), quote, transfers: [], events: [{ actorId: userId, action: 'requested', at: now(), reason }], document: null };
				await manager.insert(MiBillingRefund, { id: requestId, userId, requestKey, data }); return data;
			});
		},
		async decide(requestId: string, version: number, actorId: string, decision: 'approve' | 'reject', effectiveCutoffAt: number | undefined, reason: string) {
			return withRequest(requestId, async (manager, row, state) => {
				if (row.data.version !== version || !['requested', 'review_required'].includes(row.data.status)) billingConflict();
				row.data.reason = reason;
				if (decision === 'reject') { row.data.status = 'rejected'; return save(manager, row, state, actorId, 'rejected'); }
				if (state.lockRequestId) billingConflict();
				const pending = await manager.findBy(MiBillingServiceOrder, { userId: row.userId!, status: 'pending' });
				if (pending.some(order => order.txHash || order.expiresAt > now())) billingConflict();
				const cutoff = effectiveCutoffAt ?? row.data.requestedCutoffAt;
				if (!Number.isSafeInteger(cutoff) || cutoff < row.data.requestedCutoffAt) billingConflict();
				const quote = await calculateRefundQuote(manager, row.userId!, state, cutoff);
				if (!quote.assignments.length) billingConflict();
				row.data.quote = quote; row.data.effectiveCutoffAt = cutoff;
				if (quote.reviewReasons.length) { row.data.status = 'review_required'; return save(manager, row, state, actorId, 'review_required'); }
				state.lockRequestId = row.id; row.data.status = 'prepared';
				row.data.transfers = quote.groups.map(group => ({ id: group.id, status: 'prepared', senderAddress: null, startedAt: null, txHash: null }));
				return save(manager, row, state, actorId, 'approved');
			});
		},
		async cancel(requestId: string, actorId: string, userId?: string) {
			return withRequest(requestId, async (manager, row, state) => {
				if (userId && row.userId !== userId) missing();
				if (row.data.status === 'cancelled') return row.data;
				if (!['requested', 'review_required', 'prepared'].includes(row.data.status) || row.data.transfers.some(transfer => transfer.status !== 'prepared')) billingConflict();
				if (state.lockRequestId === row.id) state.lockRequestId = null;
				row.data.status = 'cancelled'; return save(manager, row, state, actorId, 'cancelled');
			});
		},
		async start(requestId: string, transferId: string, version: number, senderAddress: string, actorId: string) {
			return withRequest(requestId, async (manager, row, state) => {
				const transfer = row.data.transfers.find(item => item.id === transferId); if (!transfer) missing();
				if (row.data.version !== version || state.lockRequestId !== row.id || transfer.status !== 'prepared' || !['prepared', 'processing'].includes(row.data.status)) billingConflict();
				transfer.status = 'broadcast_pending'; transfer.senderAddress = senderAddress.toLowerCase(); transfer.startedAt = now(); row.data.status = 'processing';
				return save(manager, row, state, actorId, 'broadcast_intent');
			});
		},
		async submit(requestId: string, transferId: string, txHash: string, actorId: string) {
			return withRequest(requestId, async (manager, row, state) => {
				const transfer = row.data.transfers.find(item => item.id === transferId); if (!transfer) missing();
				const hash = txHash.toLowerCase(); if (transfer.txHash === hash) return row.data;
				if (state.lockRequestId !== row.id || row.data.status !== 'processing' || transfer.status !== 'broadcast_pending' || transfer.txHash) billingConflict();
				const group = row.data.quote!.groups.find(item => item.id === transferId)!;
				await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${group.chainId}:${hash}`]);
				if (await manager.existsBy(MiBillingTransactionClaim, { chainId: String(group.chainId), txHash: hash }) || await manager.existsBy(MiBillingServiceOrder, { chainId: group.chainId, txHash: hash, status: 'paid' })) billingConflict();
				await manager.insert(MiBillingTransactionClaim, { chainId: String(group.chainId), txHash: hash, ownerId: `${row.id}:${transferId}` });
				transfer.txHash = hash; transfer.status = 'submitted'; return save(manager, row, state, actorId, 'submitted');
			});
		},
		async check(requestId: string, actorId: string) {
			const hint = await rows.findOneBy({ id: requestId }); if (!hint?.userId) missing();
			if (hint.data.status === 'completed') return hint.data;
			if (!['prepared', 'processing'].includes(hint.data.status) || !hint.data.quote) billingConflict();
			const proofs: RefundDocument['proofs'] = [];
			for (let pass = 0; pass < 2; pass++) {
				for (const group of hint.data.quote.groups) {
					const transfer = hint.data.transfers.find(item => item.id === group.id)!;
					if (!transfer.txHash || !transfer.senderAddress) return hint.data;
					const result = await readReceipt(group.chainId, transfer.txHash, group.confirmations);
					if (result.status !== 'confirmed' || !matchesRefund(group, transfer, result.evidence)) return hint.data;
					if (pass === 0) proofs.push({ transferId: transfer.id, senderAddress: transfer.senderAddress, evidence: result.evidence });
					else if (!isDeepStrictEqual(proofs.find(proof => proof.transferId === transfer.id)!.evidence, result.evidence)) return hint.data;
				}
			}
			return withRequest(requestId, async (manager, row, state) => {
				if (row.data.status === 'completed') return row.data;
				if (row.data.version !== hint.data.version || state.lockRequestId !== row.id || state.revision !== hint.data.quote!.revision || !isDeepStrictEqual(row.data, hint.data)) billingConflict();
				const freshQuote = await calculateRefundQuote(manager, row.userId!, state, row.data.effectiveCutoffAt!);
				if (!isDeepStrictEqual(freshQuote, row.data.quote) || freshQuote.reviewReasons.length) billingConflict();
				for (const transfer of row.data.transfers) {
					const group = freshQuote.groups.find(item => item.id === transfer.id)!;
					const claim = await manager.findOneBy(MiBillingTransactionClaim, { chainId: String(group.chainId), txHash: transfer.txHash! });
					if (claim?.ownerId !== `${row.id}:${transfer.id}`) billingConflict();
				}
				const originalPurchases: RefundDocument['originalPurchases'] = [];
				const targetIds = new Set(freshQuote.assignments.map(term => term.id));
				const sourceIds = new Set([...freshQuote.assignments.map(term => term.orderId), ...state.lots.filter(lot => targetIds.has(lot.termId)).map(lot => lot.sourceOrderId)]);
				for (const sourceId of sourceIds) {
					const source = await manager.findOneByOrFail(MiBillingServiceOrder, { id: sourceId, userId: row.userId!, status: 'paid' });
					const amount = freshQuote.groups.flatMap(group => group.lines).filter(line => line.sourceOrder.id === sourceId).reduce((sum, line) => sum + BigInt(line.amountBaseUnits), 0n);
					state.refunded[sourceId] = (BigInt(state.refunded[sourceId] ?? '0') + amount).toString();
					originalPurchases.push({ id: source.id, payerAddress: source.payerAddress, offer: source.offer, cashAmountBaseUnits: source.cashAmountBaseUnits!, receiptSnapshot: source.receiptSnapshot ?? null, txHash: source.txHash, paidAt: source.paidAt });
				}
				const cutoff = freshQuote.effectiveCutoffAt, targets = new Set(freshQuote.assignments.map(term => term.id));
				state.terms = state.terms.flatMap(term => { if (!targets.has(term.id)) return [term]; const kept = splitBillingRefundPeriod(term, cutoff).retainedPeriod; return kept ? [{ ...term, ...kept }] : []; });
				state.lots = state.lots.flatMap(lot => { if (!targets.has(lot.termId)) return [lot]; const kept = splitBillingRefundPeriod(lot, cutoff).retainedPeriod; return kept ? [{ ...lot, ...kept }] : []; });
				state.lockRequestId = null; state.revision++; row.data.status = 'completed';
				await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
				const seller = (await manager.findOneBy(MiBillingPolicy, { id: 'server' }))?.policy.seller ?? null;
				const taxAdjustments = freshQuote.groups.flatMap(group => group.lines.map(line => {
					const tax = originalPurchases.find(source => source.id === line.sourceOrder.id)?.receiptSnapshot?.tax;
					return { lineId: line.id, sourceOrderId: line.sourceOrder.id, tax: tax ? { ...tax, includedBaseUnits: line.amountBaseUnits, ...calculateRefundTaxBaseUnits(line.amountBaseUnits, tax.includedBaseUnits, tax.taxBaseUnits) } : null };
				}));
				row.data.document = { adjustmentReason: row.data.events.findLast(event => event.action === 'approved')?.reason ?? row.data.reason, seller, taxAdjustments, id: row.id, completedAt: now(), requestedCutoffAt: row.data.requestedCutoffAt, effectiveCutoffAt: cutoff, groups: freshQuote.groups, proofs, originalPurchases };
				return save(manager, row, state, actorId, 'completed');
			});
		},
	};
}
export type RefundStore = ReturnType<typeof createRefundStore>;
