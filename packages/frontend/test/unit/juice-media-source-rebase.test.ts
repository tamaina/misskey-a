/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { mediaSourceFile, mediaDevelopBaselineSha256, restoreJuiceMediaBaseline } from './juice-media-source-rebase.js';

import { restoreGlobalCatalogPilotSource } from './global-catalog-pilot-baseline.js';

const source = readFileSync(resolve(import.meta.dirname, '../../../..', mediaSourceFile), 'utf8');

test('restores the independently pinned source without changing historical hashes', () => {
	const baseline = restoreJuiceMediaBaseline(mediaSourceFile, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(mediaDevelopBaselineSha256);
	expect(restoreJuiceMediaBaseline(mediaSourceFile, baseline)).toBe(baseline);
	const historical = restoreGlobalCatalogPilotSource(mediaSourceFile, source);
	expect(createHash('sha256').update(historical).digest('hex')).toBe('6b146954369cf3a0c5cdeaae585a3726df73907f986df01e548c1e4e18366e5f');
});

test('rejects unreviewed source and locale changes', () => {
	expect(() => restoreJuiceMediaBaseline(mediaSourceFile, `${source}\n`)).toThrow('Source differs');
	expect(() => restoreJuiceMediaBaseline(mediaSourceFile, source.replace('clickToShow', 'changedText'))).toThrow('Source differs');
	expect(restoreJuiceMediaBaseline('unrelated.vue', 'unchanged')).toBe('unchanged');
});
