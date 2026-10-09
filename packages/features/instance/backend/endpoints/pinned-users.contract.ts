/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedUserDetailedSchema } from '../../../users/backend/user.schema.js';
import { objectInput } from './input.schema.js';

export const pinnedUsersContract = oc.$meta({ requestName: 'pinned-users', allowGet: false } as const)
	.route({ method: 'POST', path: '/pinned-users', operationId: 'post___pinned-users', tags: ['users'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.array(packedUserDetailedSchema));
