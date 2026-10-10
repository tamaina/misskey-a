/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { languages } from 'i18n';
import { locales as previousLocales } from './retired-drive-locale-baseline.js';
import { restorePilotHistoricalSource } from './instance-pilot-locale-metadata.js';
import metadata from './instance-pilot-locale-baseline.json';
import type { Locale } from './instance-pilot-locale-types.js';

const root = resolve(import.meta.dirname, '../../../..');
for (const owner of metadata.owners) restorePilotHistoricalSource(owner.file, readFileSync(resolve(root, owner.file), 'utf8'));

export function verifyPilotHistoricalCatalog(language: string, pairs: [string, string][]): void {
	if (JSON.stringify(pairs.map(pair => pair[0])) !== JSON.stringify(metadata.mappings.map(mapping => mapping[0]))) throw new Error('Invalid pilot historical key inventory');
	const digest = createHash('sha256').update(JSON.stringify(pairs)).digest('hex');
	if (digest !== Reflect.get(metadata.sha256, language)) throw new Error(`Pilot original catalog hash differs: ${language}`);
}

export const locales = Object.fromEntries(languages.map(language => {
	const pairs = metadata.mappings.map((mapping): [string, string] => {
		const [global, index, local] = mapping as [string, number, string];
		const owner = metadata.owners[index];
		const original = Reflect.get(owner.original, language) as unknown as Record<string, string>;
		return [global, original[local]];
	});
	verifyPilotHistoricalCatalog(language, pairs);
	const dictionary = structuredClone(previousLocales[language]) as unknown as Record<string, unknown>;
	for (const [path, value] of pairs) {
		const parts = path.split('.');
		let target = dictionary;
		for (const part of parts.slice(0, -1)) {
			if (!(part in target)) target[part] = {};
			const next = target[part];
			if (!next || typeof next !== 'object') throw new Error(`Invalid pilot catalog branch: ${path}`);
			target = next as Record<string, unknown>;
		}
		target[parts.at(-1)!] = value;
	}
	return [language, dictionary];
})) as Record<string, Locale>;
