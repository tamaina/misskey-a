/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import { objectInput } from './input.schema.js';

export const pinnedUsersContract = oc.$meta({
	requestName: 'pinned-users',
	allowGet: false,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/pinned-users', tags: ['users'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.array(packedUserDetailedSchema));
