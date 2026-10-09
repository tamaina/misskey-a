/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedFlashSchema } from '../../flash.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../api/backend/transport/string.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashMyLikesInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"search": v.exactOptional(v.nullable(jsonString({ "minLength": 1, "maxLength": 100 }))),
});
export const flashMyLikesOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"flash": packedFlashSchema,
	}));

const requestName = 'flash/my-likes';
export const flashMyLikesContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account', 'flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(flashMyLikesInput)
	.output(flashMyLikesOutput);
