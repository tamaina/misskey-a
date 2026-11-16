/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type NumberFace = `${'m' | 'p' | 's'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
const honors = ['e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'] as const;
export type TileFace = NumberFace | typeof honors[number];

/** Matches the face/red representation used by upstream PR #13112's tile component. */
export interface DisplayTile {
	t: TileFace;
	red: boolean;
}

export function coreTileToDisplay(tile: string): DisplayTile | null {
	if (tile === '' || tile === '_') return null;
	if (/^z[1-7]$/.test(tile)) return { t: honors[Number(tile[1]) - 1], red: false };
	if (!/^[mps][0-9]$/.test(tile)) throw new Error('Invalid core tile');
	return { t: `${tile[0]}${tile[1] === '0' ? '5' : tile[1]}` as NumberFace, red: tile[1] === '0' };
}

export function displayTileToCore(tile: DisplayTile): string {
	const honor = honors.indexOf(tile.t as typeof honors[number]);
	if (honor >= 0 && !tile.red) return `z${honor + 1}`;
	if (!/^[mps][1-9]$/.test(tile.t) || (tile.red && tile.t[1] !== '5')) throw new Error('Invalid display tile');
	return tile.red ? `${tile.t[0]}0` : tile.t;
}
