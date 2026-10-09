/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedUserLite } from '../../users/backend/user.schema.js';
import { toPackedJsonValue } from '../../users/backend/json-value.schema.js';
import * as v from 'valibot';
import { packedNullableJsonValueSchema } from '../../users/backend/json-value.schema.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/backend/user.schema.js';

export const packedReversiGameDetailedSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"startedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"endedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"isStarted": v.boolean(),
	"isEnded": v.boolean(),
	"form1": packedNullableJsonValueSchema,
	"form2": packedNullableJsonValueSchema,
	"user1Ready": v.boolean(),
	"user2Ready": v.boolean(),
	"user1Id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user2Id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user1": v.lazy(() => __ref_UserLite),
	"user2": v.lazy(() => __ref_UserLite),
	"winnerId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"winner": v.nullable(v.lazy(() => __ref_UserLite)),
	"surrenderedUserId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"timeoutUserId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"black": v.nullable(v.pipe(v.number(), v.finite())),
	"bw": v.picklist(["random", "1", "2"]),
	"noIrregularRules": v.boolean(),
	"isLlotheo": v.boolean(),
	"canPutEverywhere": v.boolean(),
	"loopedBoard": v.boolean(),
	"timeLimitForEachTurn": v.pipe(v.number(), v.finite()),
	"logs": v.array(v.array(v.pipe(v.number(), v.finite()))),
	"map": v.array(v.string())
});
export const packedReversiGameLiteSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"startedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"endedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"isStarted": v.boolean(),
	"isEnded": v.boolean(),
	"user1Id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user2Id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user1": v.lazy(() => __ref_UserLite),
	"user2": v.lazy(() => __ref_UserLite),
	"winnerId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"winner": v.nullable(v.lazy(() => __ref_UserLite)),
	"surrenderedUserId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"timeoutUserId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"black": v.nullable(v.pipe(v.number(), v.finite())),
	"bw": v.picklist(["random", "1", "2"]),
	"noIrregularRules": v.boolean(),
	"isLlotheo": v.boolean(),
	"canPutEverywhere": v.boolean(),
	"loopedBoard": v.boolean(),
	"timeLimitForEachTurn": v.pipe(v.number(), v.finite())
});

export type PackedReversiGameDetailed = v.InferOutput<typeof packedReversiGameDetailedSchema>;
export type PackedReversiGameLite = v.InferOutput<typeof packedReversiGameLiteSchema>;

export function toPackedReversiGameDetailed(game: PackedReversiGameDetailed): PackedReversiGameDetailed {
	return {
		id: game.id,
		createdAt: game.createdAt,
		startedAt: game.startedAt,
		endedAt: game.endedAt,
		isStarted: game.isStarted,
		isEnded: game.isEnded,
		form1: toPackedJsonValue(game.form1),
		form2: toPackedJsonValue(game.form2),
		user1Ready: game.user1Ready,
		user2Ready: game.user2Ready,
		user1Id: game.user1Id,
		user2Id: game.user2Id,
		user1: toPackedUserLite(game.user1),
		user2: toPackedUserLite(game.user2),
		winnerId: game.winnerId,
		winner: game.winner === null ? null : toPackedUserLite(game.winner),
		surrenderedUserId: game.surrenderedUserId,
		timeoutUserId: game.timeoutUserId,
		black: game.black,
		bw: game.bw,
		noIrregularRules: game.noIrregularRules,
		isLlotheo: game.isLlotheo,
		canPutEverywhere: game.canPutEverywhere,
		loopedBoard: game.loopedBoard,
		timeLimitForEachTurn: game.timeLimitForEachTurn,
		logs: game.logs.map(log => [...log]),
		map: [...game.map],
	};
}

export function toPackedReversiGameLite(game: PackedReversiGameLite): PackedReversiGameLite {
	return {
		id: game.id,
		createdAt: game.createdAt,
		startedAt: game.startedAt,
		endedAt: game.endedAt,
		isStarted: game.isStarted,
		isEnded: game.isEnded,
		user1Id: game.user1Id,
		user2Id: game.user2Id,
		user1: toPackedUserLite(game.user1),
		user2: toPackedUserLite(game.user2),
		winnerId: game.winnerId,
		winner: game.winner === null ? null : toPackedUserLite(game.winner),
		surrenderedUserId: game.surrenderedUserId,
		timeoutUserId: game.timeoutUserId,
		black: game.black,
		bw: game.bw,
		noIrregularRules: game.noIrregularRules,
		isLlotheo: game.isLlotheo,
		canPutEverywhere: game.canPutEverywhere,
		loopedBoard: game.loopedBoard,
		timeLimitForEachTurn: game.timeLimitForEachTurn,
	};
}
