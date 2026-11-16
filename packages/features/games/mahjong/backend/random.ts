/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomInt } from 'node:crypto';

type RandomIndex = (exclusiveMax: number) => number;
export interface RedTiles { m: number; p: number; s: number }

function sample(max: number, random: RandomIndex): number {
	const value = random(max);
	if (!Number.isInteger(value) || value < 0 || value >= max) throw new Error('Invalid random index');
	return value;
}

/** Server-private wall. Red counts are explicit rule input, never inherited core defaults. */
export function generateWall(red: RedTiles, random: RandomIndex = randomInt): string[] {
	for (const suit of ['m', 'p', 's'] as const) {
		if (!Number.isInteger(red[suit]) || red[suit] < 0 || red[suit] > 4) throw new Error('Invalid red tile count');
	}
	const tiles: string[] = [];
	for (const suit of ['m', 'p', 's', 'z'] as const) {
		for (let face = 1; face <= (suit === 'z' ? 7 : 9); face++) {
			for (let copy = 0; copy < 4; copy++) {
				tiles.push(`${suit}${suit !== 'z' && face === 5 && copy < red[suit] ? 0 : face}`);
			}
		}
	}
	for (let i = tiles.length - 1; i > 0; i--) {
		const j = sample(i + 1, random);
		[tiles[i], tiles[j]] = [tiles[j], tiles[i]];
	}
	return tiles;
}

/** Pass this value explicitly to Game.kaiju; do not let core call Math.random. */
export function chooseInitialDealer(random: RandomIndex = randomInt): number {
	return sample(4, random);
}
