/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as Misskey from 'misskey-js';
import { packedPageBlockSchema } from '@features/pages/contract/page-block.js';

export function isKnownPageBlock(block: unknown): block is Misskey.entities.PageBlock {
	return v.is(packedPageBlockSchema, block);
}

export function getKnownPageBlocks(content: readonly unknown[]): Misskey.entities.PageBlock[] {
	return content.filter(isKnownPageBlock);
}

/**
 * Applies edits to the recognized blocks while leaving opaque page content untouched.
 * Opaque entries keep their positions among the original slots; new blocks are appended.
 */
export function replaceKnownPageBlocks<T>(
	content: readonly T[],
	blocks: readonly Misskey.entities.PageBlock[],
): (T | Misskey.entities.PageBlock)[] {
	const result: (T | Misskey.entities.PageBlock)[] = [];
	let blockIndex = 0;

	for (const originalBlock of content) {
		if (isKnownPageBlock(originalBlock)) {
			if (blockIndex < blocks.length) result.push(blocks[blockIndex++]);
		} else {
			result.push(originalBlock);
		}
	}

	result.push(...blocks.slice(blockIndex));
	return result;
}
