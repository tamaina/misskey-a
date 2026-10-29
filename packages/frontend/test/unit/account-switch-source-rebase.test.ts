/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import rebases from './account-switch-source-rebase.json';
import { restoreAccountSwitchBaseline } from './account-switch-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

test.each(rebases)('$file restores only the reviewed account switch delta and rejects body/locale tampering', proof => {
	const source = readFileSync(resolve(root, proof.file), 'utf8');
	const restored = restoreAccountSwitchBaseline(proof.file, source);
	const localeStart = restored.search(/<locale\s/);
	expect(sha256(localeStart < 0 ? restored : restored.slice(0, localeStart))).toBe(proof.baselineBodySha256);
	expect(sha256(localeStart < 0 ? '' : restored.slice(localeStart))).toBe(proof.localeBlocksSha256);
	expect(() => restoreAccountSwitchBaseline(proof.file, '// unreviewed\n' + source)).toThrow('Source differs');
	expect(() => restoreAccountSwitchBaseline(proof.file, source + '<locale lang="json" locale="ja-JP">{}</locale>')).toThrow('Source differs');
	expect(() => restoreAccountSwitchBaseline(proof.file, restored)).toThrow('Source differs');
});
