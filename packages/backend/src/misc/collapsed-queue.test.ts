/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { CollapsedQueue } from '@features/runtime/backend/async/collapsed-queue.js';

afterEach(() => { vi.useRealTimers(); });
test('flush waits for a job whose timer already fired', async () => {
	vi.useFakeTimers(); let finish!: () => void;
	const work = new Promise<void>(resolve => { finish = resolve; });
	const perform = vi.fn(() => work);
	const queue = new CollapsedQueue<string, number>(10, (a, b) => a + b, perform);
	queue.enqueue('instance', 1); await vi.advanceTimersByTimeAsync(10);
	let flushed = false; const flush = queue.performAllNow().then(() => { flushed = true; });
	await Promise.resolve(); expect(flushed).toBe(false); finish(); await flush;
	expect(perform).toHaveBeenCalledExactlyOnceWith('instance', 1);
});
test('concurrent flush calls do not duplicate queued writes', async () => {
	vi.useFakeTimers(); const perform = vi.fn(async () => {});
	const queue = new CollapsedQueue<string, number>(10, (a, b) => a + b, perform);
	queue.enqueue('instance', 2); queue.enqueue('instance', 3);
	await Promise.all([queue.performAllNow(), queue.performAllNow()]);
	await vi.advanceTimersByTimeAsync(20); expect(perform).toHaveBeenCalledExactlyOnceWith('instance', 5);
});
