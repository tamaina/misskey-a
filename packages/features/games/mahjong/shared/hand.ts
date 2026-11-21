/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Parse the visible portion of a core compact hand/meld without inventing tile identities. */
export function handTiles(hand: string): string[] {
	const result: string[] = [];
	let suit = '';
	for (const char of hand) {
		if ('mpsz'.includes(char)) suit = char;
		else if (/^[0-9]$/.test(char) && suit) result.push(suit + char);
	}
	return result;
}

type MeldKind = 'chi' | 'pon' | 'openKan' | 'addedKan' | 'closedKan';
const sourceOffsets = { '+': 1, '=': 2, '-': 3 } as const;

/** Decode a core meld's marker relative to the caller, not the current viewer. */
export function describeMeld(compact: string): {
	kind: MeldKind;
	tiles: string[];
	sourceOffset: number | null;
	calledTileIndex: number | null;
} | null {
	const match = /^([mpsz])(\d{1,4})(?:([+=-])(\d{0,2}))?$/.exec(compact);
	if (!match) return null;
	const [, suit, before, direction, after = ''] = match;
	const digits = before + after;
	if (suit === 'z' && /[089]/.test(digits)) return null;
	const sameFace = new Set(digits.replaceAll('0', '5')).size === 1;
	const sourceOffset = direction ? sourceOffsets[direction as keyof typeof sourceOffsets] : null;
	let kind: MeldKind;
	if (digits.length === 4 && sameFace) {
		kind = sourceOffset === null ? 'closedKan' : after.length === 1 ? 'addedKan' : 'openKan';
	} else if (digits.length === 3 && sourceOffset !== null) {
		kind = sameFace ? 'pon' : 'chi';
	} else {
		return null;
	}
	return {
		kind,
		tiles: Array.from(digits, digit => suit + digit),
		sourceOffset,
		calledTileIndex: direction ? before.length - 1 : null,
	};
}
