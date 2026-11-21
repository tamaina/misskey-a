/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function getLocaleDirection(language: string): 'ltr' | 'rtl' {
	let locale: Intl.Locale;
	try {
		locale = new Intl.Locale(language);
	} catch (error) {
		// The canonical language list includes kab-KAB, a legacy non-BCP-47 tag.
		// Keep its language subtag, while preserving explicit scripts on valid tags.
		if (!(error instanceof RangeError)) throw error;
		locale = new Intl.Locale(language.split('-')[0]);
	}
	// Node 22 exposes the same CLDR data through the older textInfo getter.
	const legacyLocale = locale as Intl.Locale & { textInfo?: { direction?: 'ltr' | 'rtl' } };
	const direction = typeof locale.getTextInfo === 'function' ? locale.getTextInfo().direction : legacyLocale.textInfo?.direction;
	if (direction !== 'ltr' && direction !== 'rtl') throw new Error(`Missing direction for locale: ${language}`);
	return direction;
}

export function buildLocaleDirections(languages: readonly string[]): Record<string, 'ltr' | 'rtl'> {
	return Object.fromEntries(languages.map(language => [language, getLocaleDirection(language)]));
}
