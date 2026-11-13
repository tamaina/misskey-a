/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { genPilotOpenapiSpec } from '../../../api/backend/transport/openapi/pilot-spec.js';
import { operationHash, restoreAnnouncementOperationBaseline } from './operation-rebase.js';
import rebases from './operation-rebase.json';

test('actual admin deadline operations restore frozen hashes without mutation and reject boundary or unrelated drift', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	for (const rebase of rebases) {
		const current = spec.paths?.[rebase.path];
		expect(operationHash(current)).toBe(rebase.currentSha256);
		expect(operationHash(restoreAnnouncementOperationBaseline(rebase.path, current))).toBe(rebase.baselineSha256);
		expect(operationHash(current)).toBe(rebase.currentSha256);
		for (const removal of rebase.removals) {
			const tampered: unknown = structuredClone(current);
			let parent: unknown = tampered;
			for (const part of removal.parent) {
				if (parent === null || typeof parent !== 'object') throw new Error('Missing test boundary');
				parent = Reflect.get(parent, part);
			}
			if (parent === null || typeof parent !== 'object') throw new Error('Missing test parent');
			Reflect.set(parent, removal.key, { type: 'string' });
			expect(() => restoreAnnouncementOperationBaseline(rebase.path, tampered)).toThrow('operation differs');
		}
		const unrelated = structuredClone(current);
		if (!unrelated?.post) throw new Error('Missing test operation');
		unrelated.post.security = [];
		expect(() => restoreAnnouncementOperationBaseline(rebase.path, unrelated)).toThrow('operation differs');
	}
});
