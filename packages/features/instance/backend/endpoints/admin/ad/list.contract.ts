/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedAdSchema } from '../../meta.schema.js';

export const adListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/))),
	'untilId': v.exactOptional(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/))),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'publishing': v.optional(v.nullable(v.boolean()), null),
});

export const adListContract = oc.$meta<{ requestName: 'admin/ad/list'; allowGet: boolean; cacheSec?: number }>({ requestName: 'admin/ad/list', allowGet: false })
	.route({ method: 'POST', path: '/admin/ad/list', operationId: 'post___admin___ad___list', tags: ['admin'] })
	.errors({ ...commonErrors })
	.input(adListInput)
	.output(v.array(packedAdSchema));
