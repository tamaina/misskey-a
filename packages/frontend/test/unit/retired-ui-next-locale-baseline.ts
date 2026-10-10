/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { languages } from 'i18n';
import { locales as currentLocales } from './retired-ui-locale-baseline.js';
import baseline from './retired-ui-next-locale-baseline.json';
import type { Locale } from './retired-ui-next-locale-types.js';

export type { Locale } from './retired-ui-next-locale-types.js';
const root = resolve(import.meta.dirname, '../../../..');
const dictionaries = new Map<number, Map<string, unknown>>();

export function valueAt(dictionary: unknown, path: string): unknown {
	for (const part of path.split('.')) {
		if (!dictionary || typeof dictionary !== 'object') return undefined;
		dictionary = Reflect.get(dictionary, part);
	}
	return dictionary;
}

export function verifyRetiredUiNextLanguages(actual: readonly string[]): void {
	if (JSON.stringify(actual) !== JSON.stringify(Object.keys(baseline.sha256))) throw new Error('Frozen next UI language inventory differs');
}

export function verifyRetiredUiNextBaseline(language: string, pairs: [string, string][]): void {
	if (JSON.stringify(pairs.map(pair => pair[0])) !== JSON.stringify(baseline.mappings.map(mapping => mapping[0]))) throw new Error('Invalid retired next UI key inventory');
	const digest = createHash('sha256').update(JSON.stringify(pairs)).digest('hex');
	if (digest !== Reflect.get(baseline.sha256, language)) throw new Error(`Next UI text differs from frozen catalog: ${language}`);
}

function ownerValue(index: number, language: string, path: string): string {
	let blocks = dictionaries.get(index);
	if (!blocks) {
		const filename = resolve(root, baseline.owners[index]);
		const parsed = parse(readFileSync(filename, 'utf8'), { filename });
		const expectedError = `At least one <template> or <script> is required in a single file component. ${filename}`;
		if (parsed.errors.some(error => (typeof error === 'string' ? error : error.message) !== expectedError)) throw new Error(`Invalid UI locale owner: ${filename}`);
		blocks = new Map();
		for (const block of parsed.descriptor.customBlocks.filter(block => block.type === 'locale')) {
			const language = String(block.attrs.locale);
			if (block.attrs.lang !== 'json' || blocks.has(language)) throw new Error(`Invalid UI locale block: ${filename}:${language}`);
			blocks.set(language, JSON.parse(block.content));
		}
		verifyRetiredUiNextLanguages([...blocks.keys()]);
		dictionaries.set(index, blocks);
	}
	const value = valueAt(blocks.get(language), path);
	if (typeof value !== 'string') throw new Error(`Missing UI owner text: ${index}:${language}:${path}`);
	return value;
}

/** Reconstruct historical formatter inputs only after verifying independent,
 * pre-removal production-catalog hashes. This never restores production keys.
 */
function restore(language: typeof languages[number]): Locale {
	const pairs = baseline.mappings.map((mapping): [string, string] => {
		const [global, index, local] = mapping as [string, number, string];
		const value = ownerValue(index, language, local);
		for (let i = 3; i < mapping.length; i += 2) {
			if (ownerValue(mapping[i] as number, language, mapping[i + 1] as string) !== value) throw new Error(`UI alternative owner differs: ${language}:${global}`);
		}
		return [global, value];
	});
	verifyRetiredUiNextBaseline(language, pairs);
	const restored = structuredClone(currentLocales[language]);
	for (const [path, value] of pairs) {
		const parts = path.split('.');
		let target = restored as unknown as Record<string, unknown>;
		for (const part of parts.slice(0, -1)) {
			if (!(part in target)) target[part] = {};
			const next = target[part];
			if (!next || typeof next !== 'object') throw new Error(`Invalid legacy UI branch: ${path}`);
			target = next as Record<string, unknown>;
		}
		target[parts.at(-1)!] = value;
	}
	return restored as Locale;
}

verifyRetiredUiNextLanguages(languages);
export const locales = Object.fromEntries(languages.map(language => [language, restore(language)])) as Record<string, Locale>;
