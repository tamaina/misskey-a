/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../users.input.schema.js';
import { packedUserDetailedSchema } from '../user.schema.js';
export const usersErrors = {} as const;
export const usersContract = oc.$meta({ requestName: 'users' } as const)
	.route({ method: 'POST', path: '/users', operationId: 'post___users', tags: ['users'] })
	.errors({ ...commonErrors }).input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
	'sort': v.exactOptional(v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'])),
	'state': v.optional(v.picklist(['all', 'alive']), 'all'),
	'origin': v.optional(v.picklist(['combined', 'local', 'remote']), 'local'),
	'hostname': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.' })), null),
})).output(v.array(packedUserDetailedSchema));
