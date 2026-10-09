/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { chartInput } from './chart-input.schema.js';

const requestName = 'charts/users';
export const chartUsersContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		local: v.strictObject({
			total: v.array(v.pipe(v.number(), v.finite())),
			inc: v.array(v.pipe(v.number(), v.finite())),
			dec: v.array(v.pipe(v.number(), v.finite())),
		}),
		remote: v.strictObject({
			total: v.array(v.pipe(v.number(), v.finite())),
			inc: v.array(v.pipe(v.number(), v.finite())),
			dec: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));

export const chartUsersGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		local: v.strictObject({
			total: v.array(v.pipe(v.number(), v.finite())),
			inc: v.array(v.pipe(v.number(), v.finite())),
			dec: v.array(v.pipe(v.number(), v.finite())),
		}),
		remote: v.strictObject({
			total: v.array(v.pipe(v.number(), v.finite())),
			inc: v.array(v.pipe(v.number(), v.finite())),
			dec: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));
