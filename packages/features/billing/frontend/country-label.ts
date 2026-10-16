/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Display-only: country identifiers sent to the API remain unchanged. */
export function countryLabel(code: string, locale: string): string {
	const country = code.trim().toUpperCase();
	if (!/^[A-Z]{2}$/.test(country)) return country;
	const names = new Intl.DisplayNames([locale, 'en'], { type: 'region', fallback: 'none' });
	const name = names.of(country);
	return name ? `${country} / ${name}` : country;
}
