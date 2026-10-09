/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { chartInput } from './chart-input.schema.js';

const requestName = 'charts/ap-request';
export const chartApRequestContract = oc.$meta({ requestName: requestName, allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		deliverFailed: v.array(v.pipe(v.number(), v.finite())),
		deliverSucceeded: v.array(v.pipe(v.number(), v.finite())),
		inboxReceived: v.array(v.pipe(v.number(), v.finite())),
	}));

export const chartApRequestGetContract = oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		deliverFailed: v.array(v.pipe(v.number(), v.finite())),
		deliverSucceeded: v.array(v.pipe(v.number(), v.finite())),
		inboxReceived: v.array(v.pipe(v.number(), v.finite())),
	}));
