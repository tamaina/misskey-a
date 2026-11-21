/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const gameTurnEvent = 'game.turn' as const;

const uuidPattern = '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$';
const mahjongGame = 'mahjong' as const;
const reversiGame = 'reversi' as const;
const nativeIdPattern = '^[a-zA-Z0-9]{1,32}$';
const mahjongTurnReference = v.strictObject({
	game: v.literal(mahjongGame),
	roomId: v.pipe(v.string(), v.regex(new RegExp(uuidPattern))),
	phaseId: v.pipe(v.string(), v.regex(new RegExp(uuidPattern))),
	revision: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
});
export type MahjongTurnReference = v.InferOutput<typeof mahjongTurnReference>;

const reversiTurnReference = v.strictObject({
	game: v.literal(reversiGame),
	gameId: v.pipe(v.string(), v.regex(new RegExp(nativeIdPattern))),
	revision: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
});
export type ReversiTurnReference = v.InferOutput<typeof reversiTurnReference>;

// Advertise only kinds that have both a producer and a current-state authorization path.
const gameTurnReference = v.variant('game', [mahjongTurnReference, reversiTurnReference]);
export type GameTurnReference = v.InferOutput<typeof gameTurnReference>;

const revisionSchema = { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER } as const;

export const gameTurnPayloadSchema = {
	type: 'object',
	oneOf: [{
		type: 'object',
		properties: {
			game: { type: 'string', const: mahjongGame },
			roomId: { type: 'string', pattern: uuidPattern },
			phaseId: { type: 'string', pattern: uuidPattern },
			revision: revisionSchema,
		},
		required: ['game', 'roomId', 'phaseId', 'revision'],
		additionalProperties: false,
	}, {
		type: 'object',
		properties: {
			game: { type: 'string', const: reversiGame },
			gameId: { type: 'string', pattern: nativeIdPattern },
			revision: revisionSchema,
		},
		required: ['game', 'gameId', 'revision'],
		additionalProperties: false,
	}],
} as const;

export function parseGameTurnReference(input: unknown): GameTurnReference | null {
	const result = v.safeParse(gameTurnReference, input);
	return result.success ? result.output : null;
}

export function gameTurnIdentity(turn: GameTurnReference, stateKey?: unknown): readonly (string | number)[] | null {
	switch (turn.game) {
		case mahjongGame: return stateKey === undefined ? [turn.game, turn.roomId, turn.phaseId] : null;
		case reversiGame: return typeof stateKey === 'string' && /^[a-f0-9]{64}$/.test(stateKey)
			? [turn.game, turn.gameId, turn.revision, stateKey] : null;
	}
}
