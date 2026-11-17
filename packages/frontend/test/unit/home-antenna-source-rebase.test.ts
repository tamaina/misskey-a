/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { antennaEditorFile, antennaEditorBaselineSha256, restoreHomeAntennaBaseline } from './home-antenna-source-rebase.js';
const source = readFileSync(resolve(import.meta.dirname, '../../../..', antennaEditorFile), 'utf8');

test('restores the pinned editor and rejects unrelated source/locale edits', () => {
	const baseline = restoreHomeAntennaBaseline(antennaEditorFile, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(antennaEditorBaselineSha256);
	expect(restoreHomeAntennaBaseline(antennaEditorFile, baseline)).toBe(baseline);
	expect(() => restoreHomeAntennaBaseline(antennaEditorFile, `${source}\n`)).toThrow('Unreviewed');
	expect(() => restoreHomeAntennaBaseline(antennaEditorFile, source.replace('Notes from followed users', 'Changed'))).toThrow('Unreviewed');
});
