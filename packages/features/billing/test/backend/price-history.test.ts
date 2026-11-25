/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { evaluateDealDisplayEligibility } from '../../shared/price-history.js';
import type { PriceHistoryPeriod } from '../../shared/price-history.js';

describe('deal display eligibility', () => {
	const now = Date.UTC(2026, 2, 1);
	const day = 86_400_000;
	const currentPrice = {
		assetId: 'asset-usd',
		planId: 'plan-basic',
		amountBaseUnits: '25000000',
		durationDays: 90,
		durationUnit: 'days' as const,
	};

	function period(input: Partial<PriceHistoryPeriod>): PriceHistoryPeriod {
		return {
			id: input.id ?? `period-${Math.random()}`,
			priceId: input.priceId ?? 'price',
			assetId: input.assetId ?? currentPrice.assetId,
			planId: input.planId ?? currentPrice.planId,
			amountBaseUnits: input.amountBaseUnits ?? '30000000',
			durationDays: input.durationDays ?? currentPrice.durationDays,
			durationUnit: input.durationUnit ?? currentPrice.durationUnit,
			isEnabled: input.isEnabled ?? true,
			startsAt: input.startsAt ?? now - 56 * day,
			expiresAt: input.expiresAt ?? now - 7 * day,
		};
	}

	test('allows a deal when the reference price satisfies the recent-period rule', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '30000000', startsAt: now - 56 * day, expiresAt: now - 7 * day }),
			period({ priceId: 'current', amountBaseUnits: '25000000', startsAt: now - 7 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation).toMatchObject({
			canShowDeal: true,
			referenceAmountBaseUnits: '30000000',
			reason: 'eligible',
		});
	});

	test('rejects when no higher reference price exists', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '25000000', startsAt: now - 56 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation.canShowDeal).toBe(false);
		expect(evaluation.reason).toBe('reference_not_higher');
	});

	test('rejects when the reference price was not sold for a majority of the recent period', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '30000000', startsAt: now - 56 * day, expiresAt: now - 34 * day }),
			period({ priceId: 'current', amountBaseUnits: '25000000', startsAt: now - 34 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation.canShowDeal).toBe(false);
		expect(evaluation.reason).toBe('sold_less_than_half_recent_period');
	});

	test('rejects when the reference price was sold for less than two weeks', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '30000000', startsAt: now - 20 * day, expiresAt: now - 7 * day }),
			period({ priceId: 'current', amountBaseUnits: '25000000', startsAt: now - 7 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation.canShowDeal).toBe(false);
		expect(evaluation.reason).toBe('sold_less_than_two_weeks');
	});

	test('rejects when the reference price is too old', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '30000000', startsAt: now - 56 * day, expiresAt: now - 15 * day }),
			period({ priceId: 'current', amountBaseUnits: '25000000', startsAt: now - 15 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation.canShowDeal).toBe(false);
		expect(evaluation.reason).toBe('reference_too_old');
	});

	test('uses the shorter selling period when the price history is younger than eight weeks', () => {
		const evaluation = evaluateDealDisplayEligibility([
			period({ amountBaseUnits: '30000000', startsAt: now - 20 * day, expiresAt: now - 5 * day }),
			period({ priceId: 'current', amountBaseUnits: '25000000', startsAt: now - 5 * day, expiresAt: null }),
		], currentPrice, now);

		expect(evaluation.canShowDeal).toBe(true);
		expect(evaluation.checkedFrom).toBe(now - 20 * day);
	});
});
