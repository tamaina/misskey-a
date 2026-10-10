/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Host entry paths selected by VVI before the legacy main-language projection. */
export const localeEntryManifestFile = 'locale-entry-manifest.json';

export type LocaleEntryManifest = {
	version: 1;
	entries: Record<string, string>;
};

export function parseLocaleEntryManifest(value: unknown): LocaleEntryManifest {
	if (value === null || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('entries' in value) || value.entries === null || typeof value.entries !== 'object' || Array.isArray(value.entries)) {
		throw new Error('Invalid host locale entry manifest');
	}
	for (const [locale, file] of Object.entries(value.entries)) {
		if (!/^[A-Za-z0-9-]+$/.test(locale) || typeof file !== 'string' || !file.endsWith('.js') || file.split('/').some(part => !/^[A-Za-z0-9_.-]+$/.test(part) || part === '.' || part === '..')) {
			throw new Error('Invalid host locale entry path');
		}
	}
	return value as LocaleEntryManifest;
}
