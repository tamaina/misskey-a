/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { restoreConditionalEntryBaseline } from './conditional-entry-source-rebase.js';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import entries from './oidc-source-rebase.json';
import { restoreOidcSourceBaseline } from './oidc-source-rebase.js';
const restore = (file: string, source: string) => restoreOidcSourceBaseline(file, restoreConditionalEntryBaseline(file, source));
test.each(entries)('$file reverses exact child integration and rejects all extra source/locale edits', entry => {
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
	const restored = restore(entry.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(entry.baselineSha256);
	expect(() => restore(entry.file, `${source}\n`)).toThrow('Source differs');
	expect(() => restore(entry.file, source.replace('<template>', '<template>\n<!-- extra -->'))).toThrow('Source differs');
	expect(() => restore(entry.file, source.replace(/locale="ja-JP"/, 'locale="unexpected"'))).toThrow('Source differs');
});
