/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../users.input.schema.js';

export const adminAccountsDeleteErrors = {} as const;
export const adminAccountsDeleteContract = oc.$meta({
	requestName: 'admin/accounts/delete',
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/accounts/delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
	'userId': misskeyId,
})).output(v.void());
