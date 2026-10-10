/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { restoreRssContractBaseline } from './rss-contract-source-rebase.js';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import proofs from './shared-ownership-rebase.json';
import { restorePilotHistoricalSource } from './instance-pilot-locale-metadata.js';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('shared ownership import-only fixture rebases', () => {
	test.each(proofs)('$file keeps the verified old source, identical import rewrite and every locale byte', proof => {
		const rewrite = (source: string) => proof.rewrites.reduce((current, edit) => current.split(edit.source).join(edit.replacement), source);
		expect(sha256(proof.originalSource)).toBe(proof.oldOriginalSha256);
		const source = restoreRssContractBaseline(proof.file, restorePilotHistoricalSource(proof.file, readFileSync(resolve(root, proof.file), 'utf8')));
		const body = rewrite(proof.migratedBody);
		expect(source.slice(0, body.length)).toBe(body);
		const localeBlocks = source.slice(body.length);
		expect(sha256(localeBlocks)).toBe(proof.localeBlocksSha256);
		expect(sha256(proof.migratedBody + localeBlocks)).toBe(proof.oldMigratedSha256);
		// The ordinary cohort tests still reverse localization and check the new
		// baseline. Here we prove the new baseline derives from the frozen one.
		const fixture = readFileSync(resolve(root, proof.fixture), 'utf8');
		expect(fixture).toContain(sha256(rewrite(proof.originalSource)));
	});
});
