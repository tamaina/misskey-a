/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { coreTileToDisplay, displayTileToCore } from '../../shared/tiles.js';

const tiles = [...['m', 'p', 's'].flatMap(suit => Array.from({ length: 10 }, (_, i) => `${suit}${i}`)), ...Array.from({ length: 7 }, (_, i) => `z${i + 1}`)];
test.each(tiles)('round-trips core tile %s through the upstream face/red shape', tile => {
	expect(displayTileToCore(coreTileToDisplay(tile)!)).toBe(tile);
});
test('converts red fives, honors and hidden tiles explicitly', () => {
	expect(coreTileToDisplay('m0')).toEqual({ t: 'm5', red: true });
	expect(coreTileToDisplay('z5')).toEqual({ t: 'haku', red: false });
	expect(coreTileToDisplay('_')).toBeNull();
	expect(coreTileToDisplay('')).toBeNull();
});
test.each(['z0', 'z8', 'm10', 'm5_', 'p5*', 'x1', '../secret'])('rejects non-tile input %s', tile => {
	expect(() => coreTileToDisplay(tile)).toThrow();
});
test('rejects impossible red tiles', () => {
	expect(() => displayTileToCore({ t: 'haku', red: true })).toThrow();
	expect(() => displayTileToCore({ t: 'p1', red: true })).toThrow();
});
