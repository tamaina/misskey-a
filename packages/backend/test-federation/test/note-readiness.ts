/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { strictEqual } from 'node:assert';
import { vi } from 'vitest';

/** Note creation returns before reply-count post-processing completes. */
export async function waitForReplyCount<T extends { repliesCount: number }>(
	readNote: () => Promise<T>,
	expected: number,
	options: Parameters<typeof vi.waitFor>[1],
): Promise<T> {
	return await vi.waitFor(async () => {
		const note = await readNote();
		strictEqual(note.repliesCount, expected);
		return note;
	}, options);
}
