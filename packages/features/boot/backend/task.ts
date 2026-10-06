/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRuntime } from './runtime.js';
import type { BootStep } from './runtime.js';

/** Run a one-shot role without hiding its failure behind a cleanup failure. */
export async function runTask<T>(steps: readonly BootStep[], task: () => Promise<T>): Promise<T> {
	const runtime = createRuntime(steps);
	let outcome: { value: T } | { error: unknown };
	try {
		await runtime.start();
		outcome = { value: await task() };
	} catch (error) {
		outcome = { error };
	}
	try {
		await runtime.stop();
	} catch (error) {
		if ('error' in outcome) throw new AggregateError([outcome.error, error], 'Task and cleanup failed');
		throw error;
	}
	if ('error' in outcome) throw outcome.error;
	return outcome.value;
}
