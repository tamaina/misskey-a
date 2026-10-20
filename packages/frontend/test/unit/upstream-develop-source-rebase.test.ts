/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import postingRebases from './posting-role-source-rebase.json';
import { restorePostingRoleBaseline } from './posting-role-source-rebase.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { sourceRebases, restoreUpstreamDevelopBaseline } from './upstream-develop-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');
const hash = (source: string): string => createHash('sha256').update(source).digest('hex');

test('purpose-specific source witnesses are present and unambiguous', () => {
	expect(sourceRebases.length).toBeGreaterThan(0);
	expect(new Set(sourceRebases.map(entry => entry.file)).size).toBe(sourceRebases.length);
});
for (const entry of sourceRebases) {
	test(`upstream adaptation restores the exact frozen source: ${entry.file}`, () => {
		const current = restorePostingRoleBaseline(entry.file, readFileSync(resolve(root, entry.file), 'utf8'));
		const baseline = restoreUpstreamDevelopBaseline(entry.file, current);
		expect(hash(current)).toBe(entry.currentSha256);
		expect(hash(baseline)).toBe(entry.baselineSha256);
		expect(restoreUpstreamDevelopBaseline(entry.file, baseline)).toBe(baseline);
		expect(() => restoreUpstreamDevelopBaseline(entry.file, current + '\n')).toThrow('Source differs');
	});
}

// Both strict witnesses must accept the composed source and reject unrelated changes.
test.each(postingRebases.filter(posting => sourceRebases.some(upstream => upstream.file === posting.file)))('posting and upstream proofs compose exactly: $file', posting => {
	const upstream = sourceRebases.find(entry => entry.file === posting.file)!;
	const current = readFileSync(resolve(root, posting.file), 'utf8');
	expect(posting.baselineSha256).toBe(upstream.currentSha256);
	expect(hash(restoreUpstreamDevelopBaseline(posting.file, current))).toBe(upstream.baselineSha256);
	expect(() => restoreUpstreamDevelopBaseline(posting.file, current + '\n')).toThrow('Source differs');
});
