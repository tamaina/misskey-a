/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';

export const packedQueueCountSchema = resultObject({
	"waiting": v.number(),
	"active": v.number(),
	"completed": v.number(),
	"failed": v.number(),
	"delayed": v.number()
});
export const packedQueueJobSchema = resultObject({
	"id": v.string(),
	"name": v.string(),
	"data": resultObject({}),
	"opts": resultObject({}),
	"timestamp": v.number(),
	"processedOn": v.optional(v.number()),
	"processedBy": v.optional(v.string()),
	"finishedOn": v.optional(v.number()),
	"progress": v.union([v.number(), v.string(), v.boolean(), v.array(v.unknown()), resultObject({})]),
	"attempts": v.number(),
	"delay": v.number(),
	"failedReason": v.string(),
	"stacktrace": v.array(v.string()),
	"returnValue": v.unknown(),
	"isFailed": v.boolean()
});
export const packedQueueMetricsSchema = resultObject({
	"meta": resultObject({
	"count": v.number(),
	"prevTS": v.number(),
	"prevCount": v.number()
}),
	"data": v.array(v.number()),
	"count": v.number()
});
