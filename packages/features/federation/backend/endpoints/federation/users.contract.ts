/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { misskeyId } from '../../input.schema.js';
import { packedUserDetailedNotMeSchema } from '../../../../users/backend/user.schema.js';

export const federationUsersErrors = {} as const;

const requestName = 'federation/users';
export const federationUsersContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['federation'] })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.string(),
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	})).output(v.array(packedUserDetailedNotMeSchema));

export type FederationUsersInput = v.InferOutput<NonNullable<typeof federationUsersContract['~orpc']['inputSchema']>>;
export type FederationUsersOutput = v.InferOutput<NonNullable<typeof federationUsersContract['~orpc']['outputSchema']>>;
