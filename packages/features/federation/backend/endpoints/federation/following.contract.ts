/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../input.schema.js';
import { packedFollowingSchema } from '../../../../relationships/backend/endpoints/relationships.schema.js';

export const federationFollowingInput = objectInput({
	"host": v.string(),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const federationFollowingOutput = v.array(packedFollowingSchema);
export const federationFollowingErrors = {} as const;

const requestName = 'federation/following';
export const federationFollowingContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(federationFollowingInput).output(federationFollowingOutput);
