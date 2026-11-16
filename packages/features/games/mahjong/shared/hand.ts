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
