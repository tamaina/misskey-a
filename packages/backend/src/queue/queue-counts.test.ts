/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { QueueGetters } from 'bullmq';

const require = createRequire(import.meta.url);

test('the supported BullMQ no-argument count implementation returns all default counters', async () => {
	// The backend declaration correction depends on this installed implementation.
	// Deliberately fail on upgrades until the default/count backend sources are reviewed.
	expect(require('bullmq/package.json').version).toBe('6.3.2');
	const defaults = ['active', 'completed', 'delayed', 'failed', 'prioritized', 'waiting', 'waiting-children'];
	const calls: string[][] = [];
	const queue = Object.create(QueueGetters.prototype);
	queue.backend = {
		getCounts: async (types: string[]) => {
			calls.push(types);
			return types.map((_, index) => index);
		},
	};
	expect(await queue.getJobCounts()).toEqual(Object.fromEntries(defaults.map((key, index) => [key, index])));
	expect(calls).toEqual([defaults]);
	expect(await queue.getJobCounts('failed', 'active', 'failed')).toEqual({ failed: 0, active: 1 });
	expect(calls[1]).toEqual(['failed', 'active']);
});
