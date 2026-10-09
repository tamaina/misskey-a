/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId, uniqueStrings } from '../../users.input.schema.js';
import { packedUserDetailedSchema } from '../../user.schema.js';
// Every branch retains all competing selectors; the operation preserves baseline lookup priority.
const userSelectors = {
	userId: v.exactOptional(misskeyId),
	userIds: v.exactOptional(uniqueStrings(misskeyId)),
	username: v.exactOptional(v.string()),
	host: v.optional(v.nullable(v.string())),
};
export const usersShowErrors = {
	failedToResolveRemoteUser: {
		message: 'Failed to resolve remote user.',
		code: 'FAILED_TO_RESOLVE_REMOTE_USER',
		id: 'ef7b9be4-9cba-4e6f-ab41-90ed171c7d3c',
		kind: 'server',
	},

	noSuchUser: {
		message: 'No such user.',
		code: 'NO_SUCH_USER',
		id: '4362f8dc-731f-4ad8-a694-be5a88922a24',
		status: 404,
	},
} as const;
export const usersShowContract = oc.$meta({
	requestName: 'users/show',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/users/show', tags: ['users'], description: 'Show the properties of a user.' })
	.errors({ ...commonErrors, FAILED_TO_RESOLVE_REMOTE_USER: { status: 500, data: apiErrorData }, NO_SUCH_USER: { status: 404, data: apiErrorData } }).input(v.union([
	objectInput({ ...userSelectors, userIds: uniqueStrings(misskeyId) }),
	objectInput({ ...userSelectors, userId: misskeyId }),
	objectInput({ ...userSelectors, username: v.string() }),
])).output(v.union([packedUserDetailedSchema, v.array(packedUserDetailedSchema)]));
