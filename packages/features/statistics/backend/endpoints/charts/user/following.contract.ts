/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

const requestName = 'charts/user/following';
export const chartPerUserFollowingContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'following'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		local: v.strictObject({
			followings: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
			followers: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
		}),
		remote: v.strictObject({
			followings: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
			followers: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
		}),
	}));

export const chartPerUserFollowingGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'following'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		local: v.strictObject({
			followings: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
			followers: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
		}),
		remote: v.strictObject({
			followings: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
			followers: v.strictObject({
				total: v.array(v.pipe(v.number(), v.finite())),
				inc: v.array(v.pipe(v.number(), v.finite())),
				dec: v.array(v.pipe(v.number(), v.finite())),
			}),
		}),
	}));
