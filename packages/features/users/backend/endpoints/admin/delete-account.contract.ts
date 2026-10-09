/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../users.input.schema.js';

export const adminDeleteAccountErrors = {} as const;
export const adminDeleteAccountContract = oc.$meta({
	requestName: 'admin/delete-account',
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:delete-account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/delete-account', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
	'userId': misskeyId,
})).output(v.void());
