/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';

export const adDeleteContract = oc.$meta({
	requestName: 'admin/ad/delete',
	allowGet: false,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/ad/delete', tags: ['admin'], successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_AD: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'id': v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)),
}))
	.output(v.void());
