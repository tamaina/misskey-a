/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const adminServerInfoContract = oc.$meta({ requestName: 'admin/server-info', allowGet: false } as const)
	.route({ method: 'POST', path: '/admin/server-info', operationId: 'post___admin___server-info', tags: ['admin', 'meta'] })
	.errors({ ...commonErrors })
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({
	'machine': v.string(),
	'os': v.pipe(v.string(), v.metadata({ 'example': 'linux' })),
	'node': v.string(),
	'psql': v.string(),
	'redis': v.optional(v.string()),
	'cpu': v.strictObject({
		'model': v.string(),
		'cores': v.pipe(v.number(), v.finite()),
	}),
	'mem': v.strictObject({
		'total': v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ 'format': 'bytes' })),
	}),
	'fs': v.strictObject({
		'total': v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ 'format': 'bytes' })),
		'used': v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ 'format': 'bytes' })),
	}),
	'net': v.strictObject({
		'interface': v.pipe(v.string(), v.metadata({ 'example': 'eth0' })),
	}),
}));
