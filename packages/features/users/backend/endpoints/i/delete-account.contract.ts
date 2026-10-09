/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../users.input.schema.js';

export const iDeleteAccountErrors = {} as const;
export const iDeleteAccountContract = oc.$meta({
	requestName: 'i/delete-account',
	requireCredential: true,
	secure: true,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/delete-account', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
	'password': v.string(),
	'token': v.exactOptional(v.nullable(v.string())),
})).output(v.void());
