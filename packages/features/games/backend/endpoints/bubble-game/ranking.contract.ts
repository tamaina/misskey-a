/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedUserLiteSchema } from '../../../../users/backend/user.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

const requestName = 'bubble-game/ranking';
export const bubbleGameRankingContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 60 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], })
	.errors(commonErrors)
	.input(objectInput({
		"gameMode": v.string(),
	}))
	.output(v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"score": v.pipe(v.number(), v.integer()),
		"user": v.optional(packedUserLiteSchema),
	})));

export const bubbleGameRankingGetContract = oc.$meta({ allowGet: true, cacheSec: 60 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: [] })
	.errors(commonErrors).input(objectInput({
		"gameMode": v.string(),
	})).output(v.array(v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"score": v.pipe(v.number(), v.integer()),
	"user": v.optional(packedUserLiteSchema),
})));
