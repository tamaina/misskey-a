/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

const requestName = 'charts/user/pv';
export const chartPerUserPvContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		upv: v.strictObject({
			user: v.array(v.pipe(v.number(), v.finite())),
			visitor: v.array(v.pipe(v.number(), v.finite())),
		}),
		pv: v.strictObject({
			user: v.array(v.pipe(v.number(), v.finite())),
			visitor: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));

export const chartPerUserPvGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		upv: v.strictObject({
			user: v.array(v.pipe(v.number(), v.finite())),
			visitor: v.array(v.pipe(v.number(), v.finite())),
		}),
		pv: v.strictObject({
			user: v.array(v.pipe(v.number(), v.finite())),
			visitor: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));
