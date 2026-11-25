/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { languages, locales as productionLocales } from 'i18n';
import metadata from './pruned-global-locale-baseline.json';
import type { Locale } from './pruned-global-locale-types.js';

const root = resolve(import.meta.dirname, '../../../..');
const owners = metadata.owners.map(file => new Map(parse(readFileSync(resolve(root, file), 'utf8')).descriptor.customBlocks
	.filter(block => block.type === 'locale')
	.map(block => [String(block.attrs.locale), JSON.parse(block.content) as unknown])));

export function valueAt(dictionary: unknown, path: string): unknown {
	for (const key of path.split('.')) {
		if (!dictionary || typeof dictionary !== 'object') return undefined;
		dictionary = Reflect.get(dictionary, key);
	}
	return dictionary;
}

/**
 * Combines the live global `i18n` catalog with current component-owned `<locale>`
 * blocks so runtime tests (embed boot, Storybook, result, browser fixture) can
 * assert against actual translated strings without pinning historical file hashes.
 */
export const locales = Object.fromEntries(languages.map(language => {
	const result = structuredClone(productionLocales[language]) as unknown as Record<string, unknown>;
	for (const [globalPath, index, localPath] of metadata.mappings) {
		const owner = owners[Number(index)];
		const value = valueAt(owner.get(language), String(localPath))
			?? valueAt(productionLocales[language], String(globalPath))
			?? valueAt(owner.get('ja-JP'), String(localPath));
		if (typeof value !== 'string') continue;
		const parts = String(globalPath).split('.');
		let target = result;
		for (const part of parts.slice(0, -1)) {
			target[part] ??= {};
			if (!target[part] || typeof target[part] !== 'object') break;
			target = target[part] as Record<string, unknown>;
		}
		target[parts.at(-1)!] = value;
	}
	return [language, result];
})) as Record<string, Locale>;
