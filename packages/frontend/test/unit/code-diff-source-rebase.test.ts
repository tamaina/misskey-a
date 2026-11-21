/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { parse } from 'vue/compiler-sfc';
import { restoreBillingCatalogBaseline } from './billing-catalog-source-rebase.js';
import { restoreCodeDiffBaseline } from './code-diff-source-rebase.js';
import rebases from './code-diff-source-rebase.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
for (const entry of rebases) {
	test(`restores exact boundaries and preserves dictionaries: ${entry.file}`, () => {
		const source = restoreBillingCatalogBaseline(entry.file, readFileSync(resolve(root, entry.file), 'utf8'));
		const restored = restoreCodeDiffBaseline(entry.file, source);
		expect(createHash('sha256').update(restored).digest('hex')).toBe(entry.baselineSha256);
		const locales = (text: string) => parse(text).descriptor.customBlocks.filter(block => block.type === 'locale').map(block => block.content);
		expect(locales(source)).toEqual(locales(restored));
		expect(restoreCodeDiffBaseline(entry.file, restored)).toBe(restored);
		expect(() => restoreCodeDiffBaseline(entry.file, source + '\n')).toThrow('Source differs');
		expect(() => restoreCodeDiffBaseline(entry.file, source.replace(entry.edits[0].current, 'tampered'))).toThrow('Source differs');
	});
}

test('preserves all three legacy CSS owner identities', async () => {
	const { generateCssModuleName } = await import('../../lib/css-module-names.js');
	const paths = (await import('../../lib/feature-css-source-paths.json')).default as Record<string, string>;
	const frontend = resolve(root, 'packages/frontend');
	for (const entry of rebases) {
		const relative = entry.file.replace('packages/', '../');
		const legacy = paths[relative];
		expect(legacy).toBeTypeOf('string');
		for (const production of [false, true]) {
			const name = entry.file.includes('modlog') ? 'diff' : 'codeBlockRoot';
			expect(generateCssModuleName(name, resolve(root, entry.file), frontend, production)).toBe(generateCssModuleName(name, resolve(frontend, legacy), frontend, production));
		}
	}
});
