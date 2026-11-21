/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { restoreMfmIntegrationBaseline, restoreMergedMfmPreferencesDevelopBaseline } from './mfm-integration-source-rebase.js';
import { restoreCrowdin18171Baseline } from './upstream-develop-source-rebase.js';
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

test('retains the real develop translations before composing the strict history proofs', () => {
	const file = 'packages/features/preferences/frontend/pages/settings/preferences.vue';
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', file), 'utf8');
	const develop = restoreMergedMfmPreferencesDevelopBaseline(file, source);
	expect(createHash('sha256').update(develop).digest('hex')).toBe('e2a3288bd0f6107765accbdf5001e3e5c9b32990a989732425bf266f7339e18c');
	expect(develop).toContain('Expandir automàticament les previsualitzacions d\'URL');
	expect(source).toContain('MkMfmSearchPreference');
	expect(() => restoreCrowdin18171Baseline(file, source + '\n')).toThrow('Source differs from reviewed upstream develop');
});
