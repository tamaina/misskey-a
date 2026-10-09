/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedAdSchema } from '../../meta.schema.js';

export const adCreateInput = objectInput({
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
});

export const adCreateContract = oc.$meta<{ requestName: 'admin/ad/create'; allowGet: boolean; cacheSec?: number }>({ requestName: 'admin/ad/create', allowGet: false })
	.route({ method: 'POST', path: '/admin/ad/create', operationId: 'post___admin___ad___create', tags: ['admin'] })
	.errors({ ...commonErrors })
	.input(adCreateInput)
	.output(packedAdSchema);
