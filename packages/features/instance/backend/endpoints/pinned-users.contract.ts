/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from './input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedUserDetailedSchema } from '../../../users/backend/user.schema.js';

export const pinnedUsersInput = v.optional(objectInput({}), {});
export const pinnedUsersOutput = v.array(packedUserDetailedSchema);
export const pinnedUsersContract = oc.$meta<{ requestName: 'pinned-users'; allowGet: boolean; cacheSec?: number }>({ requestName: 'pinned-users', allowGet: false })
	.route({ method: 'POST', path: '/pinned-users', operationId: 'post___pinned-users', tags: ['users'] })
	.errors({ ...commonErrors })
	.input(pinnedUsersInput)
	.output(pinnedUsersOutput);
