/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { offerAvailable, catalog, validPriceCatalog, immutablePriceMatches } from '../../backend/service-catalog.js';
import type { ServiceOffer } from '../../backend/api.definition.js';
const day = 86400000, at = Date.UTC(2026, 9, 15);
const offer: ServiceOffer = { id: 'old', serviceKey: 'basic', name: 'Basic', chainId: 1, contractAddress: '0x' + '1'.repeat(40), recipientAddress: '0x' + '2'.repeat(40), tokenSymbol: 'T', decimals: 6, amountBaseUnits: '100', duration: 30, durationUnit: 'days', confirmationsRequired: 2, isEnabled: true, priceStartsAt: at - 56 * day, priceExpiresAt: at - day };
test('scheduled prices activate and expire exactly; history supplies eligible source reference and next period', () => {
	const current = { ...offer, id: 'current', amountBaseUnits: '80', priceStartsAt: at - day, priceExpiresAt: at + day };
	const next = { ...offer, id: 'next', priceStartsAt: at + day, priceExpiresAt: null };
	expect(offerAvailable(current, at - day)).toBe(true); expect(offerAvailable(current, at + day)).toBe(false);
	const result = catalog([offer, current, next], at); expect(result).toHaveLength(1);
	expect(result[0].dealDisplay.canShowDeal).toBe(true); expect(result[0].priceDisplayWindow.nextPeriod?.priceId).toBe('next');
});
test('undated legacy offers never invent historical reference price', () => {
	const { priceStartsAt, priceExpiresAt, ...legacy } = offer;
	expect(catalog([legacy], at)[0].priceHistory).toEqual([]); expect(catalog([legacy], at)[0].dealDisplay.canShowDeal).toBe(false);
});
test('source overlapping duration and price rules; recorded price is immutable', () => {
	expect(validPriceCatalog({ ...offer, id: 'other' }, [offer])).toBe(false);
	expect(validPriceCatalog({ ...offer, id: 'longer', duration: 60, amountBaseUnits: '99' }, [offer])).toBe(false);
	expect(validPriceCatalog({ ...offer, id: 'longer', duration: 60, amountBaseUnits: '200' }, [offer])).toBe(true);
	expect(validPriceCatalog({ ...offer, id: 'next', priceStartsAt: at - day, priceExpiresAt: null }, [offer])).toBe(true);
	expect(immutablePriceMatches(offer, { ...offer, amountBaseUnits: '90' })).toBe(false);
	expect(immutablePriceMatches(offer, { ...offer, priceExpiresAt: at })).toBe(true);
});

test('one logical price may have multiple equivalent settlement deployments without doubling history', () => {
	const first = { ...offer, catalogPriceId: 'shared-price', pricingAssetKey: 'shared-units' };
	const other = { ...first, id: 'second-rail', chainId: 2, contractAddress: '0x' + '3'.repeat(40) };
	expect(validPriceCatalog(other, [first])).toBe(true);
	expect(validPriceCatalog({ ...other, amountBaseUnits: '101' }, [first])).toBe(false);
	const current = { ...first, id: 'current', catalogPriceId: 'current-price', amountBaseUnits: '80', priceStartsAt: at - day, priceExpiresAt: null };
	const result = catalog([first, other, current], at);
	expect(result[0].priceHistory).toHaveLength(2); expect(result[0].dealDisplay.referenceSoldMs).toBe(55 * day);
});
