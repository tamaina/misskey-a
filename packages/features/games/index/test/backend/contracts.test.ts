/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { gamesContract } from '../../backend/endpoints/games.contract.js';

test('game composition preserves every public method, path and request name', () => {
	expect(Object.values(gamesContract).map(contract => {
		const { route, meta } = contract['~orpc'];
		return [route.method, route.path, 'requestName' in meta ? meta.requestName : undefined];
	})).toEqual([
		['POST', '/bubble-game/ranking', 'bubble-game/ranking'],
		['GET', '/bubble-game/ranking', undefined],
		['POST', '/bubble-game/register', 'bubble-game/register'],
		['POST', '/reversi/cancel-match', 'reversi/cancel-match'],
		['POST', '/reversi/games', 'reversi/games'],
		['POST', '/reversi/invitations', 'reversi/invitations'],
		['POST', '/reversi/match', 'reversi/match'],
		['POST', '/reversi/show-game', 'reversi/show-game'],
		['POST', '/reversi/surrender', 'reversi/surrender'],
		['POST', '/reversi/verify', 'reversi/verify'],
	]);
});
