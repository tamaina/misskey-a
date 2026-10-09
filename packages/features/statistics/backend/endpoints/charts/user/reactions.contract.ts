/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

const requestName = 'charts/user/reactions';
export const chartPerUserReactionsContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'reactions'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		local: v.strictObject({
			count: v.array(v.pipe(v.number(), v.finite())),
		}),
		remote: v.strictObject({
			count: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));

export const chartPerUserReactionsGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users', 'reactions'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		local: v.strictObject({
			count: v.array(v.pipe(v.number(), v.finite())),
		}),
		remote: v.strictObject({
			count: v.array(v.pipe(v.number(), v.finite())),
		}),
	}));
