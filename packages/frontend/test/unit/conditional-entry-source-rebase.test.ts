/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import entries from './conditional-entry-source-rebase.json';
import { restoreConditionalEntryBaseline } from './conditional-entry-source-rebase.js';
test.each(entries)('$file preserves every historical language and rejects any unreviewed byte', entry => {
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8'); const baseline = restoreConditionalEntryBaseline(entry.file, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(entry.baselineSha256);
	const blocks = (text: string) => parse(text).descriptor.customBlocks.filter(block => block.type === 'locale');
	const oldBlocks = blocks(baseline); const current = blocks(source); expect(current.map(block => block.attrs.locale)).toEqual(oldBlocks.map(block => block.attrs.locale));
	for (let i = 0; i < current.length; i++) if (current[i].attrs.locale !== 'ja-JP') expect(current[i].content).toBe(oldBlocks[i].content);
	expect(() => restoreConditionalEntryBaseline(entry.file, source + '\n')).toThrow('Source differs');
	expect(() => restoreConditionalEntryBaseline(entry.file, source.replace('locale="ja-JP"', 'locale="unknown"'))).toThrow('Source differs');
	expect(() => restoreConditionalEntryBaseline(entry.file, source.replace('<template>', '<template>\n<!-- tamper -->'))).toThrow('Source differs');
});
