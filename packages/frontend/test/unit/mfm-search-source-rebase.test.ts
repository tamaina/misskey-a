/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { restoreMfmSearchBaseline } from './mfm-search-source-rebase.js';
import rebases from './mfm-search-source-rebase.json';
for (const entry of rebases) {
	test(`restore only reviewed search changes: ${entry.file}`, () => {
		const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
		const restored = restoreMfmSearchBaseline(entry.file, source);
		expect(createHash('sha256').update(restored).digest('hex')).toBe(entry.baselineSha256);
		expect(restoreMfmSearchBaseline(entry.file, restored)).toBe(restored);
		expect(() => restoreMfmSearchBaseline(entry.file, source + '\n')).toThrow('Unreviewed');
	});
}
