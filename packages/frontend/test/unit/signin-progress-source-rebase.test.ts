/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import entries from './signin-progress-source-rebase.json';
import { restoreConditionalEntryBaseline } from './conditional-entry-source-rebase.js';
import { restoreOidcSourceBaseline } from './oidc-source-rebase.js';
import { restoreSigninProgressBaseline } from './signin-progress-source-rebase.js';
const root = resolve(import.meta.dirname, '../../../..');
const restore = (file: string, source: string) => restoreSigninProgressBaseline(file, restoreOidcSourceBaseline(file, restoreConditionalEntryBaseline(file, source)));
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
test.each(entries)('$file restores the exact pre-state component and preserves every locale byte', entry => {
	const current = readFileSync(resolve(root, entry.file), 'utf8'); const restored = restore(entry.file, current);
	expect(sha256(restored)).toBe(entry.baselineSha256);
	expect(sha256(restored.slice(restored.indexOf('<locale ')))).toBe(entry.localeBlocksSha256);
	expect(restoreSigninProgressBaseline(entry.file, restored)).toBe(restored);
	expect(() => restore(entry.file, current + '\n')).toThrow('Source differs');
	expect(() => restore(entry.file, current.replace('authenticationProgress', 'unreviewedChange'))).toThrow('Source differs');
	expect(() => restore(entry.file, current.replace(/(<locale[^>]*>\s*\{\s*)"[^"]+"\s*:/, '$1"unexpected":'))).toThrow('Source differs');
});
