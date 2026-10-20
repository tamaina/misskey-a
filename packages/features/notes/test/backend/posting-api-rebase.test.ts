/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';
import { postingApiHash, restorePostingOperationBaseline, restorePostingSchemaBaseline } from './posting-api-rebase.js';
import witnesses from './posting-api-rebase.json';

test('posting API inverse preserves frozen hashes, input objects and rejects all unrelated changes', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	expect(witnesses.operations.map(entry => entry.name)).toEqual(['/admin/show-user', '/notes/create']);
	expect(witnesses.schemas).toHaveLength(42);
	for (const [entries, values, restore] of [
		[witnesses.operations, spec.paths, restorePostingOperationBaseline],
		[witnesses.schemas, spec.components?.schemas, restorePostingSchemaBaseline],
	] as const) {
		for (const entry of entries) {
			const current = values?.[entry.name];
			expect(postingApiHash(restore(entry.name, current))).toBe(entry.baselineSha256);
			expect(postingApiHash(current)).toBe(entry.currentSha256);
			const changed = { ...structuredClone(current), unexpected: true };
			expect(() => restore(entry.name, changed)).toThrow('Posting API current differs');
		}
	}
	const unchanged = { synthetic: 'unchanged' };
	expect(restorePostingOperationBaseline('/synthetic', unchanged)).toBe(unchanged);
	expect(restorePostingSchemaBaseline('Synthetic', unchanged)).toBe(unchanged);
});
