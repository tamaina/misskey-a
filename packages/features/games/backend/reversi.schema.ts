/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
