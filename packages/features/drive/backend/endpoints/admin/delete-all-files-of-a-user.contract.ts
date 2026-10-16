/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../users/backend/users.input.schema.js';

export const adminDeleteAllFilesOfAUserErrors = {} as const;
export const adminDeleteAllFilesOfAUserContract = oc.$meta({
	requestName: 'admin/delete-all-files-of-a-user',
	'requireCredential': true,
	'requireAdmin': true,
	'kind': 'write:admin:delete-all-files-of-a-user',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/delete-all-files-of-a-user', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
		"userId": misskeyId,
	})).output(v.void());
