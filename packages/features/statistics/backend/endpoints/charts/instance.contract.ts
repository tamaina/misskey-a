/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { instanceChartInput } from './chart-input.schema.js';

export const chartInstanceOutput = v.strictObject({
	requests: v.strictObject({
		failed: v.array(v.pipe(v.number(), v.finite())),
		succeeded: v.array(v.pipe(v.number(), v.finite())),
		received: v.array(v.pipe(v.number(), v.finite())),
	}),
	notes: v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
		diffs: v.strictObject({
			normal: v.array(v.pipe(v.number(), v.finite())),
			reply: v.array(v.pipe(v.number(), v.finite())),
			renote: v.array(v.pipe(v.number(), v.finite())),
			withFile: v.array(v.pipe(v.number(), v.finite())),
		}),
	}),
	users: v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
	}),
	following: v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
	}),
	followers: v.strictObject({
		total: v.array(v.pipe(v.number(), v.finite())),
		inc: v.array(v.pipe(v.number(), v.finite())),
		dec: v.array(v.pipe(v.number(), v.finite())),
	}),
	drive: v.strictObject({
		totalFiles: v.array(v.pipe(v.number(), v.finite())),
		incFiles: v.array(v.pipe(v.number(), v.finite())),
		decFiles: v.array(v.pipe(v.number(), v.finite())),
		incUsage: v.array(v.pipe(v.number(), v.finite())),
		decUsage: v.array(v.pipe(v.number(), v.finite())),
	}),
});

const requestName = 'charts/instance';
export const chartInstanceContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 3600 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(instanceChartInput)
	.output(chartInstanceOutput);

export const chartInstanceGetContract = oc.$meta<{ allowGet: true; cacheSec: number }>({ allowGet: true, cacheSec: 3600 })
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(instanceChartInput)
	.output(chartInstanceOutput);
