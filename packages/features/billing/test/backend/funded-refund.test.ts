/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, test } from 'vitest';
import { applyFundedTerm, quoteServiceTerm } from '../../backend/billing-state.js';
import { fundingIntervalAmount } from '../../shared/billing-funding.js';
import { groupBillingRefundLines } from '../../shared/billing-refund-groups.js';
import { splitBillingRefundPeriod } from '../../shared/billing-refund-period.js';
import { matchesRefund } from '../../backend/refund-store.js';
import type { BillingState } from '../../backend/billing-state.js';
import type { ServiceOffer } from '../../backend/api.definition.js';
import type { MiBillingServiceOrder } from '../../backend/models/BillingServiceOrder.js';
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = `0x${'a'.repeat(64)}`;
const offer: ServiceOffer = { id: 'basic', serviceKey: 'basic', planGroup: 'plan', sortOrder: 1, name: 'Basic', chainId: 1, contractAddress: address(1), recipientAddress: address(2), tokenSymbol: 'TEST', decimals: 6, amountBaseUnits: '100', duration: 10, durationUnit: 'days', confirmationsRequired: 2, isEnabled: true };
const day = 86400000;

function fresh(): BillingState { return { revision: 0, lockRequestId: null, terms: [], lots: [], refunded: {} }; }

function buy(state: BillingState, price: ServiceOffer, at: number) {
	const quote = quoteServiceTerm(state, price, at); let seq = 0;
	const row = { id: `${price.id}-${at}`, offer: price, payerAddress: address(3), cashAmountBaseUnits: quote.payableAmountBaseUnits } as MiBillingServiceOrder;
	applyFundedTerm(state, row, quote, () => `${row.id}-${++seq}`); return { row, quote };
}

test('two upgrades inherit original cash lots and preserve immutable bases', () => {
	const state = fresh(); const first = buy(state, offer, 0);
	const second = buy(state, { ...offer, id: 'plus', serviceKey: 'plus', sortOrder: 2, amountBaseUnits: '200' }, 5 * day);
	expect(second.quote.discountBaseUnits).toBe('50'); expect(second.row.cashAmountBaseUnits).toBe('150');
	expect(state.lots.find(lot => lot.sourceOrderId === first.row.id && lot.startsAt === 0)?.basisAmountBaseUnits).toBe('100');
	const third = buy(state, { ...offer, id: 'max', serviceKey: 'max', sortOrder: 3, amountBaseUnits: '300' }, 10 * day);
	expect(third.quote.discountBaseUnits).toBe('100'); expect(third.row.cashAmountBaseUnits).toBe('200');
	const last = state.terms.find(term => term.orderId === third.row.id)!;
	expect(state.lots.filter(lot => lot.termId === last.id).map(lot => lot.sourceOrderId).sort()).toEqual([first.row.id, second.row.id, third.row.id].sort());
});
test('downgrade and renewal respect existing future tails', () => {
	const state = fresh(); buy(state, { ...offer, sortOrder: 3 }, 0);
	const q = quoteServiceTerm(state, { ...offer, serviceKey: 'lower', sortOrder: 1 }, day);
	expect(q.effectiveStartsAt).toBe(10 * day); expect(q.discountBaseUnits).toBe('0');
	buy(state, offer, day); expect(quoteServiceTerm(state, offer, 2 * day).effectiveStartsAt).toBe(20 * day);
});
test('zero cash upgrade inherits provenance; unknown funding remains unknown', () => {
	const state = fresh(); buy(state, { ...offer, amountBaseUnits: '1000' }, 0);
	const free = buy(state, { ...offer, serviceKey: 'upgrade', sortOrder: 2 }, day);
	expect(free.quote.payableAmountBaseUnits).toBe('0'); expect(state.terms.at(-1)?.provenanceComplete).toBe(true);
	state.terms.at(-1)!.provenanceComplete = false;
	buy(state, { ...offer, serviceKey: 'higher', sortOrder: 3, amountBaseUnits: '200' }, 2 * day);
	expect(state.terms.at(-1)?.provenanceComplete).toBe(false);
});
test('successive partial refunds floor against original funding basis and half-open bounds', () => {
	const basis = { basisAmountBaseUnits: '101', basisStartsAt: 0, basisExpiresAt: 10, startsAt: 0, expiresAt: 10 };
	expect(fundingIntervalAmount(basis, 7, 10)).toBe(30n);
	expect(fundingIntervalAmount({ ...basis, expiresAt: 7 }, 3, 7)).toBe(40n);
	expect(splitBillingRefundPeriod({ startsAt: 2, expiresAt: 10 }, 2).retainedPeriod).toBeNull();
	expect(splitBillingRefundPeriod({ startsAt: 2, expiresAt: 10 }, 10).cancelledPeriod).toBeNull();
	expect(() => fundingIntervalAmount({ ...basis, basisExpiresAt: 0 }, 0, 1)).toThrow();
});
test('groups use original payer and rail; duplicate lines and conflicting originals fail', () => {
	const source = { id: 'source', payerAddress: address(3), chainId: 1, contractAddress: address(1), decimals: 6 };
	const line = { id: 'line', assignmentId: 'term', amountBaseUnits: '10', sourceOrder: source };
	expect(groupBillingRefundLines([line, { ...line, id: 'other', sourceOrder: { ...source, id: 'source2', payerAddress: address(4) } }])).toHaveLength(2);
	expect(() => groupBillingRefundLines([line, line])).toThrow();
	expect(() => groupBillingRefundLines([line, { ...line, id: 'other', sourceOrder: { ...source, chainId: 2 } }])).toThrow();
});
test('proof requires canonical block, exact amount, original recipient, recorded sender and start', () => {
	const group = { id: 'g', payerAddress: address(3), chainId: 1, contractAddress: address(1), decimals: 6, amountBaseUnits: '10', lines: [], confirmations: 2 };
	const transfer = { id: 'g', status: 'submitted' as const, senderAddress: address(2), startedAt: 10000, txHash: hash };
	const evidence = { chainId: 1, txHash: hash, timestamp: 10000, blockHash: hash, blockNumber: '10', transfers: [{ logIndex: 1, contractAddress: address(1), fromAddress: address(2), toAddress: address(3), amountBaseUnits: '10' }] };
	expect(matchesRefund(group, transfer, evidence)).toBe(true);
	for (const change of [{ timestamp: 0 }, { chainId: 2 }, { blockHash: undefined }]) expect(matchesRefund(group, transfer, { ...evidence, ...change })).toBe(false);
	for (const change of [{ amountBaseUnits: '11' }, { fromAddress: address(4) }, { toAddress: address(4) }, { contractAddress: address(4) }]) expect(matchesRefund(group, transfer, { ...evidence, transfers: [{ ...evidence.transfers[0], ...change }] })).toBe(false);
});

test('non-overlapping unknown future funding is not consumed by an active upgrade', () => {
 const state = fresh(); buy(state, offer, 0);
 state.terms.push({ id: 'future', orderId: 'old', offer: { ...offer, serviceKey: 'old', sortOrder: 0 }, startsAt: 100 * day, expiresAt: 110 * day, provenanceComplete: false });
 const upgraded = buy(state, { ...offer, id: 'plus', serviceKey: 'plus', sortOrder: 2, amountBaseUnits: '200' }, 5 * day);
 expect(upgraded.quote.discountAssignmentIds).not.toContain('future'); expect(state.terms.at(-1)?.provenanceComplete).toBe(true);
});
