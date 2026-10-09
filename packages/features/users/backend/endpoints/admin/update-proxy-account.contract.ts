/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, description } from '../../users.input.schema.js';
import { packedMeDetailedSchema } from '../../user.schema.js';
export const adminUpdateProxyAccountErrors = {} as const;
export const adminUpdateProxyAccountContract = oc.$meta({
	requestName: 'admin/update-proxy-account',
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/update-proxy-account', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.pipe(objectInput({
	'description': v.exactOptional(v.nullable(description)),
}), v.metadata({ 'required': undefined }))).output(packedMeDetailedSchema);
