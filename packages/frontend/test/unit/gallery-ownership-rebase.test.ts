/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import proofs from './gallery-ownership-rebase.json';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
const rewrite = (source: string) => source.replaceAll('features/gallery/', 'features/collections/');

describe('gallery ownership preserves frozen source identities', () => {
	test.each(proofs)('$file changes only verified module paths', proof => {
		expect(sha256(proof.originalSource)).toBe(proof.originalSha256);
		expect(readFileSync(resolve(root, proof.file), 'utf8')).toBe(rewrite(proof.migratedSource));
		expect(readFileSync(resolve(root, proof.fixture), 'utf8')).toContain(sha256(rewrite(proof.originalSource)));
		const localeStart = proof.migratedSource.indexOf('<locale ');
		expect(rewrite(proof.migratedSource).slice(rewrite(proof.migratedSource).indexOf('<locale '))).toBe(proof.migratedSource.slice(localeStart));
	});

});
