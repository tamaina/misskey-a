/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { countryLabel } from '../../frontend/country-label.js';
import { residenceCountries } from '../../shared/residence-codes.schema.js';

test('country labels follow the UI language and retain the ISO code', () => {
	expect(countryLabel('JP', 'ja-JP')).toBe('JP / 日本');
	expect(countryLabel('US', 'ja-JP')).toBe('US / アメリカ合衆国');
	expect(countryLabel('JP', 'en-US')).toBe('JP / Japan');
	expect(countryLabel('US', 'en-US')).toBe('US / United States');
	for (const code of residenceCountries) expect(countryLabel(code, 'ja-JP')).toMatch(new RegExp(`^${code} / .+`));
});

test('unfinished admin input remains displayable without changing its value', () => {
	expect(countryLabel('', 'ja-JP')).toBe('');
	expect(countryLabel('u', 'ja-JP')).toBe('U');
	expect(countryLabel('US-CA', 'ja-JP')).toBe('US-CA');
	expect(countryLabel(' jp ', 'ja-JP')).toBe('JP / 日本');
});
