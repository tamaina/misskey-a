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

export const federationFollowersInput = objectInput({
	"host": v.string(),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const federationFollowersOutput = v.array(packedFollowingSchema);
export const federationFollowersErrors = {} as const;

const requestName = 'federation/followers';
export const federationFollowersContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(federationFollowersInput).output(federationFollowersOutput);
