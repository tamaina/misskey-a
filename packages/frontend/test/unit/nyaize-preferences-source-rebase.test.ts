/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { nyaizePreferencesFile, nyaizePreferencesBaseline, restoreNyaizePreferencesBaseline, nyaizeMfmFile, restoreNyaizeMfmBaseline } from './nyaize-preferences-source-rebase.js';
test('only the reviewed preference component insertion is reversed for historical locale proofs', () => {
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', nyaizePreferencesFile), 'utf8');
	const baseline = restoreNyaizePreferencesBaseline(nyaizePreferencesFile, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(nyaizePreferencesBaseline);
	expect(restoreNyaizePreferencesBaseline(nyaizePreferencesFile, baseline)).toBe(baseline);
	expect(() => restoreNyaizePreferencesBaseline(nyaizePreferencesFile, source + '\n')).toThrow('Unreviewed');
});

test('only the reviewed MFM preference option is reversed for historical locale proofs', () => {
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', nyaizeMfmFile), 'utf8');
	const baseline = restoreNyaizeMfmBaseline(nyaizeMfmFile, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe('be76c96b093e9410c1fb21ae07c339a22e1c169e48eb86ee8cfe1491c9c92a98');
	expect(restoreNyaizeMfmBaseline(nyaizeMfmFile, baseline)).toBe(baseline);
	expect(() => restoreNyaizeMfmBaseline(nyaizeMfmFile, source + '\n')).toThrow('Unreviewed');
});
