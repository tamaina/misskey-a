/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { languages } from 'i18n';
import { locales as productionLocales } from './catalog-history.js';
import { restoreGlobalCatalogPilotSource } from './global-catalog-pilot-baseline.js';
import metadata from './pruned-global-locale-baseline.json';
import type { Locale } from './pruned-global-locale-types.js';

const root = resolve(import.meta.dirname, '../../../..');
const owners = metadata.owners.map(file => new Map(parse(restoreGlobalCatalogPilotSource(file, readFileSync(resolve(root, file), 'utf8'))).descriptor.customBlocks
	.filter(block => block.type === 'locale')
	.map(block => [String(block.attrs.locale), JSON.parse(block.content) as unknown])));

export function valueAt(dictionary: unknown, path: string): unknown {
	for (const key of path.split('.')) {
		if (!dictionary || typeof dictionary !== 'object') return undefined;
		dictionary = Reflect.get(dictionary, key);
	}
	return dictionary;
}

/** The independently frozen pre-deletion digest must agree before replaying old proofs. */
export function verifyPrunedGlobalLocale(language: string, pairs: [string, string][]): void {
	if (JSON.stringify(pairs.map(pair => pair[0])) !== JSON.stringify(metadata.mappings.map(mapping => mapping[0]))) throw new Error('Pruned global key inventory differs');
	if (createHash('sha256').update(JSON.stringify(pairs)).digest('hex') !== Reflect.get(metadata.sha256, language)) throw new Error(`Pruned global historical text differs: ${language}`);
}

export const locales = Object.fromEntries(languages.map(language => {
	const pairs = metadata.mappings.map(([global, index, local]): [string, string] => {
		const value = valueAt(owners[Number(index)].get(language), String(local));
		if (typeof value !== 'string') throw new Error(`Missing pruned global owner text: ${language}:${global}`);
		return [String(global), value];
	});
	verifyPrunedGlobalLocale(language, pairs);
	const result = structuredClone(productionLocales[language]) as unknown as Record<string, unknown>;
	for (const [path, value] of pairs) {
		const parts = path.split('.');
		let target = result;
		for (const part of parts.slice(0, -1)) {
			target[part] ??= {};
			if (!target[part] || typeof target[part] !== 'object') throw new Error(`Invalid pruned global branch: ${path}`);
			target = target[part] as Record<string, unknown>;
		}
		target[parts.at(-1)!] = value;
	}
	return [language, result];
})) as Record<string, Locale>;
