/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../users.input.schema.js';
import { packedUserDetailedNotMeSchema } from '../../../user.schema.js';
export const adminAccountsFindByEmailErrors = {
	userNotFound: {
		message: 'No such user who has the email address.',
		code: 'USER_NOT_FOUND',
		id: 'cb865949-8af5-4062-a88c-ef55e8786d1d',
	},
} as const;
export const adminAccountsFindByEmailContract = oc.$meta({
	requestName: 'admin/accounts/find-by-email',
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/accounts/find-by-email', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, USER_NOT_FOUND: { status: 400, data: apiErrorData } }).input(objectInput({
	'email': v.string(),
})).output(packedUserDetailedNotMeSchema);
