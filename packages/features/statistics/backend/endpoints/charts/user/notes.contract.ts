/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

const requestName = 'charts/user/notes';
export const chartPerUserNotesContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'notes'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
		diffs: v.strictObject({
			normal: v.array(v.pipe(v.number(), v.finite())),
			reply: v.array(v.pipe(v.number(), v.finite())),
			renote: v.array(v.pipe(v.number(), v.finite())),
			withFile: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));

export const chartPerUserNotesGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'notes'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
		diffs: v.strictObject({
			normal: v.array(v.pipe(v.number(), v.finite())),
			reply: v.array(v.pipe(v.number(), v.finite())),
			renote: v.array(v.pipe(v.number(), v.finite())),
			withFile: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));
