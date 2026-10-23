/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import rebases from './upstream-common-utilities-source-rebase.json';
import { restoreCommonUtilitiesBaseline } from './upstream-common-utilities-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

test.each(rebases)('$file restores the frozen body and rejects any unreviewed body or locale edit', proof => {
	const source = readFileSync(resolve(root, proof.currentFile), 'utf8');
	const restored = restoreCommonUtilitiesBaseline(proof.file, source);
	const localeStart = restored.search(/<locale\s/);
	const body = localeStart < 0 ? restored : restored.slice(0, localeStart);
	const locales = localeStart < 0 ? '' : restored.slice(localeStart);
	expect(sha256(body)).toBe(proof.baselineBodySha256);
	expect(sha256(locales)).toBe(proof.localeBlocksSha256);
	expect(() => restoreCommonUtilitiesBaseline(proof.file, '// unreviewed\n' + source)).toThrow('Source differs');
	if (localeStart >= 0) expect(() => restoreCommonUtilitiesBaseline(proof.file, source + '\n')).toThrow('Source differs');
});
