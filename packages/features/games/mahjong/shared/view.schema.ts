/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const uuid = v.pipe(v.string(), v.uuid());
const status = v.picklist(['waiting', 'playing', 'ended', 'cancelled']);
export const mahjongViewSchema = v.object({
	id: uuid, version: v.string(), users: v.array(v.string()), ready: v.array(v.boolean()), status,
	revision: v.number(), serverTime: v.number(),
	outcome: v.nullable(v.object({ kind: v.picklist(['win', 'draw']), winner: v.nullable(v.number()), name: v.string(), points: v.number(), yaku: v.array(v.string()), deltas: v.array(v.number()) })),
	snapshot: v.nullable(v.object({
		roundWind: v.number(), handNumber: v.number(), honba: v.number(), riichiSticks: v.number(), turnSeat: v.number(), remainingTiles: v.number(),
		doraIndicators: v.array(v.string()), seats: v.array(v.object({
			userId: v.string(), score: v.number(), concealedHand: v.nullable(v.string()), concealedCount: v.number(), melds: v.array(v.string()), discards: v.array(v.string()),
		})),
	})),
	phase: v.nullable(v.object({ id: uuid, kind: v.string(), deadline: v.number(), submitted: v.boolean(),
																														actions: v.array(v.object({ id: v.string(), kind: v.picklist(['discard', 'riichi', 'chi', 'pon', 'kan', 'win', 'draw', 'pass', 'continue']), tiles: v.string() })),
	})),
});
export type MahjongView = v.InferOutput<typeof mahjongViewSchema>;
