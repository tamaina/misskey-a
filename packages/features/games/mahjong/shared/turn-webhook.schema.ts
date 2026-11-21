/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const gameTurnEvent = 'game.turn' as const;

const gameTurnReference = v.strictObject({
	roomId: v.pipe(v.string(), v.uuid()),
	phaseId: v.pipe(v.string(), v.uuid()),
	revision: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
});
export type GameTurnReference = v.InferOutput<typeof gameTurnReference>;

export function parseGameTurnReference(input: unknown): GameTurnReference | null {
	const result = v.safeParse(gameTurnReference, input);
	return result.success ? result.output : null;
}
