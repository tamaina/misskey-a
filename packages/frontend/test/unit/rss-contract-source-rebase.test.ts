/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import rebases from './rss-contract-source-rebase.json';
import { restoreRssContractBaseline } from './rss-contract-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');

test.each(rebases)('$file rejects unreviewed source or locale changes before restoring migration proofs', rebase => {
	const source = readFileSync(resolve(root, rebase.file), 'utf8');
	const localeStart = source.indexOf('<locale locale=');
	expect(() => restoreRssContractBaseline(rebase.file, source.replace('shallowRef', 'ref'))).toThrow('differs from the reviewed contract change');
	expect(() => restoreRssContractBaseline(rebase.file, source.slice(0, localeStart) + source.slice(localeStart).replace('"url"', '"unexpectedUrl"'))).toThrow('differs from the reviewed contract change');
});
