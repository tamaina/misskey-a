/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ORPCError } from '@orpc/server';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import { MiBillingAccountState } from './models/BillingAccountState.js';
import { addPaymentDuration, calculatePaymentQuote } from '../shared/payment-quote.js';
import { fundingIntervalAmount } from '../shared/billing-funding.js';
import type { EntityManager } from 'typeorm';
import type { ServiceOffer } from './api.definition.js';
import type { PaymentQuote, PaymentQuoteCurrentPlan } from '../shared/payment-quote.js';

export type { BillingTerm, BillingState, FundingLot } from '../shared/billing-state.js';
import type { BillingTerm, BillingState, FundingLot } from '../shared/billing-state.js';
export function billingConflict(): never { throw new ORPCError('BILLING_CONFLICT'); }
export const planGroup = (offer: ServiceOffer) => offer.planGroup ?? offer.serviceKey;
export const planRank = (offer: ServiceOffer) => offer.sortOrder ?? 0;
export const sameAsset = (a: ServiceOffer, b: ServiceOffer) => a.decimals === b.decimals && ((a.pricingAssetKey && b.pricingAssetKey && a.pricingAssetKey === b.pricingAssetKey) || (a.chainId === b.chainId && a.contractAddress === b.contractAddress));

/** Every purchase/refund writer takes the same user-first lock. Legacy cash is never inferred. */
export async function lockBillingState(manager: EntityManager, userId: string): Promise<BillingState> {
	await manager.getRepository(MiUser).createQueryBuilder('user').select('user.id').where('user.id = :userId', { userId }).setLock('for_no_key_update').getOneOrFail();
	const stored = await manager.findOneBy(MiBillingAccountState, { userId });
	if (stored) return stored.data;
	const paid = await manager.findBy(MiBillingServiceOrder, { userId, status: 'paid' });
	const data: BillingState = { revision: 0, lockRequestId: null, lots: [], refunded: {}, terms: paid.map(row => ({ id: row.id, orderId: row.id, offer: row.offer, startsAt: row.startsAt!, expiresAt: row.endsAt!, provenanceComplete: false })) };
	await manager.insert(MiBillingAccountState, { userId, data });
	return data;
}
export async function saveBillingState(manager: EntityManager, userId: string, data: BillingState) {
	await manager.update(MiBillingAccountState, userId, { data });
}

/** CFW starts an immediate initial term at server confirmation, retaining scheduled/upgrade periods. */
export function paidServiceQuote(quote: PaymentQuote, offer: ServiceOffer, paidAt: number): PaymentQuote {
	if (quote.currentPlan !== null || quote.effectiveStartsAt > quote.quoteCreatedAt) return quote;
	return { ...quote, effectiveStartsAt: paidAt, effectiveExpiresAt: addPaymentDuration(paidAt, offer.duration, offer.durationUnit) };
}

/** Source selection order: active upgrade, future upgrade, scheduled higher/same tail, active plan. */
export function quoteServiceTerm(state: BillingState, offer: ServiceOffer, at: number): PaymentQuote {
	const terms = state.terms.filter(term => planGroup(term.offer) === planGroup(offer) && term.expiresAt > at);
	const active = terms.filter(term => term.startsAt <= at).sort((a, b) => planRank(b.offer) - planRank(a.offer) || b.expiresAt - a.expiresAt)[0];
	const activeUpgrade = active && planRank(offer) > planRank(active.offer) ? active : undefined;
	const futureUpgrade = terms.filter(term => term.startsAt > at && planRank(term.offer) < planRank(offer)).sort((a, b) => a.startsAt - b.startsAt || planRank(a.offer) - planRank(b.offer) || b.expiresAt - a.expiresAt)[0];
	const tail = terms.filter(term => (term.offer.serviceKey === offer.serviceKey && term.startsAt > at) || planRank(term.offer) > planRank(offer)).sort((a, b) => b.expiresAt - a.expiresAt || b.startsAt - a.startsAt)[0];
	const reference = activeUpgrade ?? futureUpgrade ?? tail ?? active;
	const toPlan = (term: BillingTerm): PaymentQuoteCurrentPlan => ({ id: term.offer.serviceKey, assignmentId: term.id, name: term.offer.name, sortOrder: planRank(term.offer), startsAt: term.startsAt, expiresAt: term.expiresAt,
		price: { amountBaseUnits: sameAsset(term.offer, offer) ? term.offer.amountBaseUnits : '0', durationDays: term.offer.duration, durationUnit: term.offer.durationUnit } });
	const upgradeBaseAt = reference && reference.offer.serviceKey !== offer.serviceKey && planRank(reference.offer) < planRank(offer) ? Math.max(at, reference.startsAt) : null;
	const upgradeEndAt = upgradeBaseAt === null ? null : addPaymentDuration(upgradeBaseAt, offer.duration, offer.durationUnit);
	return calculatePaymentQuote({ quoteCreatedAt: at, quoteTtlMs: 15 * 60 * 1000, targetPlanId: offer.serviceKey, targetPlanSortOrder: planRank(offer),
		targetPlanPrice: { amountBaseUnits: offer.amountBaseUnits, durationDays: offer.duration, durationUnit: offer.durationUnit }, currentPlan: reference ? toPlan(reference) : null,
		currentPlans: upgradeBaseAt === null || upgradeEndAt === null ? undefined : terms.filter(term => sameAsset(term.offer, offer) && term.startsAt < upgradeEndAt && term.expiresAt > upgradeBaseAt).map(toPlan) });
}

/** Cash and inherited credit follow independent active terms; immutable receipts are retained. */
export function applyFundedTerm(state: BillingState, order: MiBillingServiceOrder, quote: PaymentQuote, id: () => string) {
	const term: BillingTerm = { id: id(), orderId: order.id, offer: order.offer, startsAt: quote.effectiveStartsAt, expiresAt: quote.effectiveExpiresAt, provenanceComplete: order.cashAmountBaseUnits !== null };
	const inherited: FundingLot[] = [];
	for (const termId of quote.discountAssignmentIds) {
		const old = state.terms.find(item => item.id === termId);
		if (!old) billingConflict();
		const lots = state.lots.filter(lot => lot.termId === old.id);
		if (!old.provenanceComplete || !lots.length) term.provenanceComplete = false;
		const start = Math.max(old.startsAt, term.startsAt), end = Math.min(old.expiresAt, term.expiresAt);
		if (end <= start) continue;
		state.terms = state.terms.filter(item => item.id !== old.id);
		state.lots = state.lots.filter(lot => lot.termId !== old.id);
		for (const period of [{ startsAt: old.startsAt, expiresAt: start }, { startsAt: end, expiresAt: old.expiresAt }].filter(item => item.expiresAt > item.startsAt)) {
			const retainedId = id(); state.terms.push({ ...old, ...period, id: retainedId });
			for (const lot of lots) { const from = Math.max(lot.startsAt, period.startsAt), to = Math.min(lot.expiresAt, period.expiresAt); if (to > from) state.lots.push({ ...lot, id: id(), termId: retainedId, startsAt: from, expiresAt: to }); }
		}
		for (const lot of lots) {
			const amount = fundingIntervalAmount(lot, start, end);
			if (amount > 0n) inherited.push({ id: id(), termId: term.id, sourceOrderId: lot.sourceOrderId, basisAmountBaseUnits: amount.toString(), basisStartsAt: term.startsAt, basisExpiresAt: term.expiresAt, startsAt: term.startsAt, expiresAt: term.expiresAt });
		}
	}
	state.terms.push(term);
	state.lots.push(...inherited);
	if (order.cashAmountBaseUnits !== null) state.lots.push({ id: id(), termId: term.id, sourceOrderId: order.id, basisAmountBaseUnits: order.cashAmountBaseUnits, basisStartsAt: term.startsAt, basisExpiresAt: term.expiresAt, startsAt: term.startsAt, expiresAt: term.expiresAt });
	state.revision++;
}
