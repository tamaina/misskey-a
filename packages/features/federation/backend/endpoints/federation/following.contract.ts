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

export const federationFollowingErrors = {} as const;

const requestName = 'federation/following';
export const federationFollowingContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.string(),
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	})).output(v.array(packedFollowingSchema));

export type FederationFollowingInput = v.InferOutput<NonNullable<typeof federationFollowingContract['~orpc']['inputSchema']>>;
export type FederationFollowingOutput = v.InferOutput<NonNullable<typeof federationFollowingContract['~orpc']['outputSchema']>>;
