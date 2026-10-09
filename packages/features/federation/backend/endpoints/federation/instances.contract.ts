/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { federationInstanceSchema } from '../../federation.schema.js';

export const federationInstancesErrors = {} as const;

const requestName = 'federation/instances';
export const federationInstancesContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Omit or use `null` to not filter by host." }))),
		"blocked": v.exactOptional(v.nullable(v.boolean())),
		"notResponding": v.exactOptional(v.nullable(v.boolean())),
		"suspended": v.exactOptional(v.nullable(v.boolean())),
		"silenced": v.exactOptional(v.nullable(v.boolean())),
		"federating": v.exactOptional(v.nullable(v.boolean())),
		"subscribing": v.exactOptional(v.nullable(v.boolean())),
		"publishing": v.exactOptional(v.nullable(v.boolean())),
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
		"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
		"sort": v.exactOptional(v.pipe(v.nullable(v.picklist(["+pubSub", "-pubSub", "+notes", "-notes", "+users", "-users", "+following", "-following", "+followers", "-followers", "+firstRetrievedAt", "-firstRetrievedAt", "+latestRequestReceivedAt", "-latestRequestReceivedAt"])), v.metadata({ "enum": ["+pubSub", "-pubSub", "+notes", "-notes", "+users", "-users", "+following", "-following", "+followers", "-followers", "+firstRetrievedAt", "-firstRetrievedAt", "+latestRequestReceivedAt", "-latestRequestReceivedAt", null] }))),
	})).output(v.array(federationInstanceSchema));

export type FederationInstancesInput = v.InferOutput<NonNullable<typeof federationInstancesContract['~orpc']['inputSchema']>>;
export type FederationInstancesOutput = v.InferOutput<NonNullable<typeof federationInstancesContract['~orpc']['outputSchema']>>;
