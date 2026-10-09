/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';

export const adUpdateContract = oc.$meta({
	requestName: 'admin/ad/update',
	allowGet: false,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/ad/update', tags: ['admin'], successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_AD: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'id': v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)),
	'memo': v.exactOptional(v.string()),
	'url': v.exactOptional(v.pipe(v.string(), v.minLength(1))),
	'imageUrl': v.exactOptional(v.pipe(v.string(), v.minLength(1))),
	'place': v.exactOptional(v.string()),
	'priority': v.exactOptional(v.string()),
	'ratio': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'expiresAt': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'startsAt': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'dayOfWeek': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'isSensitive': v.exactOptional(v.boolean()),
}))
	.output(v.void());
