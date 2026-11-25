/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { trustedRegionSnapshot, isBillingRegionAllowed, validateTrustedProxyCidrs } from '../../backend/policy-region.js';
import { calculateIncludedTaxBaseUnits, calculateRefundTaxBaseUnits } from '../../shared/billing-tax.js';
const headers = { 'cf-ipcountry': 'JP', 'cf-region-code': '13', 'cf-ipcity': 'Tokyo', 'x-forwarded-for': '127.0.0.1' };
test('geography is accepted only from actual trusted socket peer, not forwarded IP or arrays', () => {
	expect(trustedRegionSnapshot(undefined, headers, ['127.0.0.1/32'])).toBeNull();
	expect(trustedRegionSnapshot('192.0.2.1', headers, ['127.0.0.1/32'])).toBeNull();
	const region = trustedRegionSnapshot('::ffff:127.0.0.1', headers, ['127.0.0.1/32']);
	expect(region).toMatchObject({ country: 'JP', regionCode: '13', isEUCountry: false });
	expect(trustedRegionSnapshot('::1', headers, ['::1/128'])).toMatchObject({ country: 'JP' });
	for (const country of ['XX', 'T1', ['JP', 'US']]) expect(trustedRegionSnapshot('127.0.0.1', { 'cf-ipcountry': country }, ['127.0.0.1/32'])).toBeNull();
	for (const cidr of ['0.0.0.0/0', '::/0', 'example.test', '127.0.0.1/33', '::1/129', '127.0.0.1/32/0']) expect(() => validateTrustedProxyCidrs([cidr])).toThrow();
});
test('source allow/deny matching rejects ambiguous dimensions, but respects known nonmatches', () => {
	const snapshot = { ...trustedRegionSnapshot('127.0.0.1', headers, ['127.0.0.1/32'])!, isEUCountry: null };
	expect(trustedRegionSnapshot('127.0.0.1', { ...headers, 'cf-ipcountry': 'FR', 'x-misskey-billing-is-eu-country': 'false' }, ['127.0.0.1/32'])?.isEUCountry).toBe(true);
	expect(trustedRegionSnapshot('127.0.0.1', { ...headers, 'x-misskey-billing-is-eu-country': 'true' }, ['127.0.0.1/32'])?.isEUCountry).toBe(false);
	expect(isBillingRegionAllowed({ mode: 'allow', rules: [{ country: 'JP' }] }, snapshot)).toBe(true);
	expect(isBillingRegionAllowed({ mode: 'deny', rules: [{ country: 'JP' }] }, snapshot)).toBe(false);
	expect(isBillingRegionAllowed({ mode: 'deny', rules: [{ country: 'US', isEUCountry: true }] }, snapshot)).toBe(true);
	expect(isBillingRegionAllowed({ mode: 'deny', rules: [{ country: 'JP', continent: 'EU' }] }, snapshot)).toBe(false);
	expect(isBillingRegionAllowed({ mode: 'allow', rules: [{ isEUCountry: true }] }, snapshot)).toBe(false);
	expect(isBillingRegionAllowed({ mode: 'allow', rules: [{ country: 'JP' }, { isEUCountry: true }] }, snapshot)).toBe(true);
});
test('source tax arithmetic preserves large units, rounding, zero payable and invalid-rate fallback', () => {
	expect(calculateIncludedTaxBaseUnits('100', '0.1')).toEqual({ excludedBaseUnits: '90', taxBaseUnits: '10' });
	expect(calculateIncludedTaxBaseUnits('0', '0.1')).toEqual({ excludedBaseUnits: '0', taxBaseUnits: '0' });
	const total = '123456789012345678901234567890';
	const result = calculateIncludedTaxBaseUnits(total, '0.08');
	expect(BigInt(result.excludedBaseUnits) + BigInt(result.taxBaseUnits)).toBe(BigInt(total));
	expect(result.excludedBaseUnits).toBe((BigInt(total) * 100n / 108n).toString());
	expect(calculateIncludedTaxBaseUnits(total, '-0.1')).toEqual({ excludedBaseUnits: total, taxBaseUnits: '0' });
});

test('custom EU headers cannot override verified country membership', () => {
	for (const supplied of ['false', 'true', '0', '1']) {
		expect(trustedRegionSnapshot('127.0.0.1', { 'cf-ipcountry': 'DE', 'x-misskey-billing-is-eu-country': supplied }, ['127.0.0.1/32'])?.isEUCountry).toBe(true);
		expect(trustedRegionSnapshot('127.0.0.1', { 'cf-ipcountry': 'JP', 'x-misskey-billing-is-eu-country': supplied }, ['127.0.0.1/32'])?.isEUCountry).toBe(false);
	}
});

test('source partial refund tax uses saved tax floor allocation without cumulative over-reversal', () => {
	let sum = 0n;
	for (let n = 0; n < 101; n++) sum += BigInt(calculateRefundTaxBaseUnits('1', '101', '10').taxBaseUnits);
	expect(sum).toBeLessThanOrEqual(10n);
	expect(calculateRefundTaxBaseUnits('101', '101', '10')).toEqual({ excludedBaseUnits: '91', taxBaseUnits: '10' });
	expect(calculateRefundTaxBaseUnits('50', '100', '10')).toEqual({ excludedBaseUnits: '45', taxBaseUnits: '5' });
	expect(calculateRefundTaxBaseUnits('0', '0', '0')).toEqual({ excludedBaseUnits: '0', taxBaseUnits: '0' });
	expect(() => calculateRefundTaxBaseUnits('1', '0', '0')).toThrow();
});
