/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const gameTurnEvent = 'game.turn' as const;

const uuidPattern = '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$';
const mahjongGame = 'mahjong' as const;
const mahjongTurnReference = v.strictObject({
	game: v.literal(mahjongGame),
	roomId: v.pipe(v.string(), v.regex(new RegExp(uuidPattern))),
	phaseId: v.pipe(v.string(), v.regex(new RegExp(uuidPattern))),
	revision: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
});
export type MahjongTurnReference = v.InferOutput<typeof mahjongTurnReference>;

// Advertise only kinds that have both a producer and a current-state authorization path.
const gameTurnReference = v.variant('game', [mahjongTurnReference]);
export type GameTurnReference = v.InferOutput<typeof gameTurnReference>;

export const gameTurnPayloadSchema = {
	type: 'object',
	properties: {
		game: { type: 'string', const: mahjongGame },
		roomId: { type: 'string', pattern: uuidPattern },
		phaseId: { type: 'string', pattern: uuidPattern },
		revision: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
	},
	required: ['game', 'roomId', 'phaseId', 'revision'],
	additionalProperties: false,
} as const;

export function parseGameTurnReference(input: unknown): GameTurnReference | null {
	const result = v.safeParse(gameTurnReference, input);
	return result.success ? result.output : null;
}

export function gameTurnIdentity(turn: GameTurnReference): readonly string[] {
	switch (turn.game) {
		case mahjongGame: return [turn.game, turn.roomId, turn.phaseId];
	}
}
