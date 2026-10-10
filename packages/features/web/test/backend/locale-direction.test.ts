/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { languages } from '../../../../i18n/src/const.js';
import { buildLocaleDirections, getLocaleDirection } from '../../backend/locale-direction.js';

test('derives direction for every canonical locale including legacy kab-KAB', () => {
	const directions = buildLocaleDirections(languages);
	expect(Object.keys(directions)).toEqual([...languages]);
	expect(Object.entries(directions).filter(([, value]) => value === 'rtl').map(([language]) => language)).toEqual(['ar-SA', 'ug-CN']);
	expect(directions['kab-KAB']).toBe('ltr');
});

test('preserves explicit script variants and rejects invalid language subtags', () => {
	expect(getLocaleDirection('az-Arab')).toBe('rtl');
	expect(getLocaleDirection('az-Latn')).toBe('ltr');
	expect(() => getLocaleDirection('not_a_language')).toThrow(RangeError);
});

test('supports the Node 22 textInfo getter without the newer method', () => {
	const OriginalLocale = Intl.Locale;
	class LegacyLocale extends OriginalLocale {
		readonly textInfo: ReturnType<Intl.Locale['getTextInfo']>;
		constructor(language: string | Intl.Locale) {
			super(language);
			const original = new OriginalLocale(language) as Intl.Locale & { textInfo?: ReturnType<Intl.Locale['getTextInfo']> };
			const info = typeof original.getTextInfo === 'function' ? original.getTextInfo() : original.textInfo;
			if (info == null) throw new Error('Original Intl.Locale has no direction API');
			this.textInfo = info;
			Object.defineProperty(this, 'getTextInfo', { value: undefined });
		}
	}
	const mock = vi.spyOn(Intl, 'Locale').mockImplementation(LegacyLocale);
	try {
		expect(getLocaleDirection('ar-SA')).toBe('rtl');
		expect(getLocaleDirection('ug-CN')).toBe('rtl');
		expect(getLocaleDirection('fr-FR')).toBe('ltr');
		expect(getLocaleDirection('kab-KAB')).toBe('ltr');
	} finally {
		mock.mockRestore();
	}
});

test('supports the newer method without relying on the legacy getter', () => {
	const OriginalLocale = Intl.Locale;
	class ModernLocale extends OriginalLocale {
		constructor(language: string | Intl.Locale) {
			super(language);
			const original = new OriginalLocale(language) as Intl.Locale & { textInfo?: ReturnType<Intl.Locale['getTextInfo']> };
			const info = typeof original.getTextInfo === 'function' ? original.getTextInfo() : original.textInfo;
			if (info == null) throw new Error('Original Intl.Locale has no direction API');
			Object.defineProperty(this, 'getTextInfo', { value: () => info });
			Object.defineProperty(this, 'textInfo', { value: undefined });
		}
	}
	const mock = vi.spyOn(Intl, 'Locale').mockImplementation(ModernLocale);
	try {
		expect(getLocaleDirection('ar-SA')).toBe('rtl');
		expect(getLocaleDirection('ug-CN')).toBe('rtl');
		expect(getLocaleDirection('fr-FR')).toBe('ltr');
		expect(getLocaleDirection('kab-KAB')).toBe('ltr');
	} finally {
		mock.mockRestore();
	}
});
