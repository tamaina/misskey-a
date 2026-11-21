/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedAdSchema } from '../../meta.schema.js';

export const adCreateContract = oc.$meta({
	requestName: 'admin/ad/create',
	allowGet: false,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/ad/create', tags: ['admin'] })
	.errors({ ...commonErrors })
	.input(objectInput({
	'url': v.pipe(v.string(), v.minLength(1)),
	'memo': v.string(),
	'place': v.string(),
	'priority': v.string(),
	'ratio': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'expiresAt': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'startsAt': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'imageUrl': v.pipe(v.string(), v.minLength(1)),
	'dayOfWeek': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'isSensitive': v.exactOptional(v.boolean()),
}))
	.output(packedAdSchema);
