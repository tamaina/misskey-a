/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { evaluateDealDisplayEligibility, getPriceDisplayWindow } from '../shared/price-history.js';
import type { PriceHistoryPeriod } from '../shared/price-history.js';
import type { ServiceOffer } from './api.definition.js';

export function offerAvailable(offer: ServiceOffer, at: number): boolean {
	return offer.isEnabled && (offer.priceStartsAt == null || offer.priceStartsAt <= at) && (offer.priceExpiresAt == null || offer.priceExpiresAt > at);
}

function assetId(offer: ServiceOffer): string {
	return `${offer.pricingAssetKey ?? `${offer.chainId}:${offer.contractAddress.toLowerCase()}`}:${offer.decimals}`;
}

export function priceId(offer: ServiceOffer): string { return offer.catalogPriceId ?? offer.id; }

function samePrice(before: ServiceOffer, after: ServiceOffer): boolean {
	return before.serviceKey === after.serviceKey && assetId(before) === assetId(after) && before.amountBaseUnits === after.amountBaseUnits
		&& before.duration === after.duration && before.durationUnit === after.durationUnit && before.priceStartsAt === after.priceStartsAt;
}

export function priceHistory(offers: ServiceOffer[]): PriceHistoryPeriod[] {
	// Undated legacy offers have no known selling period; never invent reference history.
	const periods = new Map<string, PriceHistoryPeriod>();
	for (const offer of offers) {
		if (offer.priceStartsAt == null) continue;
		const key = priceId(offer);
		const previous = periods.get(key);
		periods.set(key, {
			id: key, priceId: key, assetId: assetId(offer), planId: offer.serviceKey, amountBaseUnits: offer.amountBaseUnits,
			durationDays: offer.duration, durationUnit: offer.durationUnit, isEnabled: offer.isEnabled || previous?.isEnabled === true,
			startsAt: offer.priceStartsAt, expiresAt: offer.priceExpiresAt ?? null,
		});
	}
	return [...periods.values()];
}

export function catalog(offers: ServiceOffer[], at: number, recordedPrices: ServiceOffer[] = offers) {
	const history = priceHistory(recordedPrices);
	return offers.filter(offer => offerAvailable(offer, at)).map(offer => {
		const related = history.filter(period => period.assetId === assetId(offer) && period.planId === offer.serviceKey && period.durationDays === offer.duration && period.durationUnit === offer.durationUnit);
		return {
			offer,
			priceHistory: related,
			priceDisplayWindow: getPriceDisplayWindow(related, priceId(offer), at),
			dealDisplay: evaluateDealDisplayEligibility(related, { amountBaseUnits: offer.amountBaseUnits, assetId: assetId(offer), planId: offer.serviceKey, durationDays: offer.duration, durationUnit: offer.durationUnit }, at),
		};
	});
}

function durationOrder(offer: ServiceOffer): number {
	const date = new Date(Date.UTC(2024, 0, 1));
	if (offer.durationUnit === 'days') date.setUTCDate(date.getUTCDate() + offer.duration);
	if (offer.durationUnit === 'months') date.setUTCMonth(date.getUTCMonth() + offer.duration);
	if (offer.durationUnit === 'years') date.setUTCFullYear(date.getUTCFullYear() + offer.duration);
	return date.getTime();
}

/** Source price rules: no equal-duration overlap and no reversed duration/price ordering. */
export function validPriceCatalog(input: ServiceOffer, offers: ServiceOffer[]): boolean {
	for (const offer of offers) {
		if (offer.id !== input.id && priceId(input) === priceId(offer)
			&& (!samePrice(input, offer) || (input.priceExpiresAt ?? null) !== (offer.priceExpiresAt ?? null))) return false;
	}
	if (input.priceStartsAt == null) return input.priceExpiresAt == null && input.amountBaseUnits !== '0';
	if (input.priceExpiresAt != null && input.priceExpiresAt <= input.priceStartsAt) return false;
	for (const offer of offers) {
		if (offer.id === input.id) continue;
		if (priceId(input) === priceId(offer)) continue;
		if (offer.priceStartsAt == null || assetId(offer) !== assetId(input) || offer.serviceKey !== input.serviceKey) continue;
		if (input.priceStartsAt >= (offer.priceExpiresAt ?? Number.MAX_SAFE_INTEGER) || (input.priceExpiresAt ?? Number.MAX_SAFE_INTEGER) <= offer.priceStartsAt) continue;
		if (offer.duration === input.duration && offer.durationUnit === input.durationUnit) return false;
		const difference = durationOrder(input) - durationOrder(offer);
		if (difference > 0 && BigInt(input.amountBaseUnits) < BigInt(offer.amountBaseUnits)) return false;
		if (difference < 0 && BigInt(input.amountBaseUnits) > BigInt(offer.amountBaseUnits)) return false;
	}
	return true;
}
export function immutablePriceMatches(before: ServiceOffer, after: ServiceOffer): boolean {
	if (before.priceStartsAt == null) return true;
	return before.catalogPriceId === after.catalogPriceId && samePrice(before, after);
}
