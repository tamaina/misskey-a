/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { languages } from 'i18n';
import history from './catalog-history.json';
import type { Locale } from './pruned-global-locale-types.js';

type Dictionary = { [key: string]: string | Dictionary };
const root = resolve(import.meta.dirname, '../../../..');
export const flattenCatalog = (dictionary: Dictionary, prefix = ''): [string, string][] => Object.entries(dictionary).flatMap(([key, value]) => typeof value === 'string' ? [[prefix + key, value]] : flattenCatalog(value, `${prefix}${key}.`));
const ordered = (pairs: [string, string][]) => pairs.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
const raw = new Map<string, Dictionary>();

function nested(pairs: [string, string][]): Dictionary {
	const result: Dictionary = {};
	for (const [path, value] of pairs) {
		const parts = path.split('.');
		let target = result;
		for (const part of parts.slice(0, -1)) {
			target[part] ??= {};
			if (typeof target[part] === 'string') throw new Error(`Invalid historical branch: ${path}`);
			target = target[part];
		}
		target[parts.at(-1)!] = value;
	}
	return result;
}

export function verifyCatalogHistory(language: string, pairs: [string, string][], effective = false): void {
	const expected = Reflect.get(effective ? history.effectiveHashes : history.rawHashes, language) as { count: number; sha256: string } | undefined;
	if (!expected || pairs.length !== expected.count || createHash('sha256').update(JSON.stringify(ordered([...pairs]))).digest('hex') !== expected.sha256) throw new Error(`Historical catalog differs: ${language}`);
}

/** Recreate the pre-pruning raw catalog, including missing/empty/inactive translations. */
export function historicalRawLocale(language: string): Dictionary {
	if (!raw.has(language)) {
		const production = (load(readFileSync(resolve(root, 'locales', `${language}.yml`), 'utf8').replaceAll('\b', '')) ?? {}) as Dictionary;
		const pairs = new Map(flattenCatalog(production));
		for (const key of history.promoted) pairs.delete(key);
		const deleted = Reflect.get(history.deletedRaw, language) as Record<string, string> | undefined;
		if (!deleted) throw new Error(`Unknown historical catalog: ${language}`);
		for (const [key, value] of Object.entries(deleted)) pairs.set(key, value);
		verifyCatalogHistory(language, [...pairs]);
		raw.set(language, nested([...pairs]));
	}
	return structuredClone(raw.get(language)!);
}

function merge(...dictionaries: Dictionary[]): Dictionary {
	const result: Dictionary = {};
	for (const dictionary of dictionaries) for (const [key, value] of Object.entries(dictionary)) {
		result[key] = typeof value === 'string' ? value : merge(typeof result[key] === 'object' ? result[key] : {}, value);
	}
	return result;
}

const effectiveRaw = Object.fromEntries(languages.map(language => {
	const dictionary = historicalRawLocale(language);
	const clean = (value: Dictionary): void => {
		for (const [key, item] of Object.entries(value)) if (item === '') delete value[key]; else if (typeof item === 'object') clean(item);
	};
	clean(dictionary);
	return [language, dictionary];
}));

/** Test-only old fallback behavior; no historical fixture enters a production bundle. */
export const locales = Object.fromEntries(languages.map(language => {
	const primary = ({ en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' } as Record<string, string>)[language.split('-')[0]];
	const dictionary = language === 'ja-JP' ? effectiveRaw[language] : language === 'en-US' || language === 'ja-KS'
		? merge(effectiveRaw['ja-JP'], effectiveRaw[language])
		: merge(effectiveRaw['ja-JP'], effectiveRaw['en-US'], effectiveRaw[primary] ?? {}, effectiveRaw[language]);
	verifyCatalogHistory(language, flattenCatalog(dictionary), true);
	return [language, dictionary];
})) as unknown as Record<string, Locale>;
