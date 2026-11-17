/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { restoreMfmIntegrationBaseline } from './mfm-integration-source-rebase.js';
import { restoreNyaizePreferencesBaseline, restoreNyaizeMfmBaseline } from './nyaize-preferences-source-rebase.js';
import { restoreMfmSearchBaseline } from './mfm-search-source-rebase.js';
import { restoreFormulaBaseline } from './formula-source-rebase.js';
import rebases from './mfm-integration-source-rebase.json';
for (const entry of rebases) {
	test(`combined source restores unchanged historical input: ${entry.file}`, () => {
		const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
		const baseline = restoreMfmIntegrationBaseline(entry.file, source);
		expect(createHash('sha256').update(baseline).digest('hex')).toBe(entry.baselineSha256);
		const helpers = [restoreNyaizePreferencesBaseline, restoreNyaizeMfmBaseline, restoreMfmSearchBaseline, restoreFormulaBaseline];
		for (const order of [helpers, [...helpers].reverse()]) {
			expect(order.reduce((text, restore) => restore(entry.file, text), source)).toBe(baseline);
		}
		expect(restoreMfmIntegrationBaseline(entry.file, baseline)).toBe(baseline);
		expect(() => restoreMfmIntegrationBaseline(entry.file, source + '\n')).toThrow('Unreviewed');
		expect(() => restoreMfmIntegrationBaseline(entry.file, source.replace('import ', 'import  '))).toThrow('Unreviewed');
	});
}
