/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { restoreFormulaBaseline } from './formula-source-rebase.js';
import rebases from './formula-source-rebase.json';
for (const entry of rebases) {
	test(`restore only reviewed formula changes: ${entry.file}`, () => {
		const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
		const restored = restoreFormulaBaseline(entry.file, source);
		expect(createHash('sha256').update(restored).digest('hex')).toBe(entry.baselineSha256);
		expect(restoreFormulaBaseline(entry.file, restored)).toBe(restored);
		expect(() => restoreFormulaBaseline(entry.file, source + '\n')).toThrow('Unreviewed');
	});
}
