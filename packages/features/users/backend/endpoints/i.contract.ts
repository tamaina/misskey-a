/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../users.input.schema.js';
import { packedMeDetailedSchema } from '../user.schema.js';
export const iErrors = {
	userIsDeleted: {
		message: 'User is deleted.',
		code: 'USER_IS_DELETED',
		id: 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a',
		kind: 'permission',
	},
} as const;
export const iContract = oc.$meta({ requestName: 'i' } as const)
	.route({ method: 'POST', path: '/i', operationId: 'post___i', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, USER_IS_DELETED: { status: 403, data: apiErrorData } }).input(objectInput({})).output(packedMeDetailedSchema);
