/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { restoreCommonUtilitiesBaseline } from './upstream-common-utilities-source-rebase.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getConfig } from '../../vite.config.js';
import cssSourcePaths from '../../lib/feature-css-source-paths.json';
import proofs from './drive-ownership-rebase.json';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
const rewrite = (source: string) => source.replaceAll('features/media/', 'features/drive/');

describe('drive ownership preserves frozen source identities', () => {
	test.each(proofs)('$file changes only verified module paths', proof => {
		expect(sha256(proof.originalSource)).toBe(proof.originalSha256);
		expect(restoreCommonUtilitiesBaseline(proof.file, readFileSync(resolve(root, proof.file), 'utf8'))).toBe(rewrite(proof.migratedSource));
		expect(readFileSync(resolve(root, proof.fixture), 'utf8')).toContain(sha256(rewrite(proof.originalSource)));
		const localeStart = proof.migratedSource.indexOf('<locale ');
		expect(rewrite(proof.migratedSource).slice(localeStart)).toBe(proof.migratedSource.slice(localeStart));
	});

	test('main CSS modules keep the exact pre-move names for every moved component', () => {
		const modules = getConfig().css?.modules;
		if (!modules || typeof modules.generateScopedName !== 'function') throw new Error('Missing CSS module generator');
		for (const [destination, original] of Object.entries(cssSourcePaths)) {
			for (const name of ['root', 'more', 'loading', 'image']) {
				expect(modules.generateScopedName(name, resolve(root, 'packages/frontend', destination), '')).toBe(modules.generateScopedName(name, resolve(root, 'packages/frontend', original), ''));
			}
		}
	});
});
