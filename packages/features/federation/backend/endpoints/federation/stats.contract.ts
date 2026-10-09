/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { finiteNumber, federationInstanceSchema } from '../../federation.schema.js';

export const federationStatsErrors = {} as const;

const requestName = 'federation/stats';
export const federationStatsContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(objectInput({
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	})).output(v.strictObject({
		"topSubInstances": v.array(federationInstanceSchema),
		"otherFollowersCount": finiteNumber,
		"topPubInstances": v.array(federationInstanceSchema),
		"otherFollowingCount": finiteNumber,
	}));

export type FederationStatsInput = v.InferOutput<NonNullable<typeof federationStatsContract['~orpc']['inputSchema']>>;
export type FederationStatsOutput = v.InferOutput<NonNullable<typeof federationStatsContract['~orpc']['outputSchema']>>;
