/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { chooseInitialDealer, generateWall } from '../../backend/random.js';

test('wall has 136 tiles, four of every type and only the requested red counts', () => {
	const random = vi.fn((_max: number) => 0);
	const wall = generateWall({ m: 0, p: 1, s: 4 }, random);
	expect(wall).toHaveLength(136);
	expect(random.mock.calls.map(([bound]) => bound)).toEqual(Array.from({ length: 135 }, (_, i) => 136 - i));
	for (const tile of new Set(wall.map(value => value.replace('0', '5')))) expect(wall.filter(value => value.replace('0', '5') === tile)).toHaveLength(4);
	expect(wall.filter(value => value === 'm0')).toHaveLength(0);
	expect(wall.filter(value => value === 'p0')).toHaveLength(1);
	expect(wall.filter(value => value === 's0')).toHaveLength(4);
});

test.each([0, 1, 2, 3])('dealer selection accepts random player %s with an exclusive bound of four', player => {
	const random = vi.fn(() => player);
	expect(chooseInitialDealer(random)).toBe(player);
	expect(random).toHaveBeenCalledExactlyOnceWith(4);
});

test('defaults use crypto without reading Math.random or mutating it', () => {
	const original = Math.random;
	const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Insecure RNG used'); });
	try {
		expect(generateWall({ m: 1, p: 1, s: 1 })).toHaveLength(136);
		expect(chooseInitialDealer()).toBeGreaterThanOrEqual(0);
		expect(random).not.toHaveBeenCalled();
	} finally {
		random.mockRestore();
	}
	expect(Math.random).toBe(original);
});

test.each([-1, 4, NaN, 0.5])('rejects invalid dealer entropy %s', value => {
	expect(() => chooseInitialDealer(() => value)).toThrow();
});

test.each([-1, 5, NaN, 0.5])('rejects invalid explicit red count %s', value => {
	expect(() => generateWall({ m: value, p: 1, s: 1 })).toThrow();
});
