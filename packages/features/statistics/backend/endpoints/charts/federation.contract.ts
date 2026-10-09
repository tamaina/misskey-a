/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { chartInput } from './chart-input.schema.js';

export const chartFederationOutput = v.strictObject({
	deliveredInstances: v.array(v.pipe(v.number(), v.finite())),
	inboxInstances: v.array(v.pipe(v.number(), v.finite())),
	stalled: v.array(v.pipe(v.number(), v.finite())),
	sub: v.array(v.pipe(v.number(), v.finite())),
	pub: v.array(v.pipe(v.number(), v.finite())),
	pubsub: v.array(v.pipe(v.number(), v.finite())),
	subActive: v.array(v.pipe(v.number(), v.finite())),
	pubActive: v.array(v.pipe(v.number(), v.finite())),
});

const requestName = 'charts/federation';
export const chartFederationContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 3600 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(chartFederationOutput);

export const chartFederationGetContract = oc.$meta<{ allowGet: true; cacheSec: number }>({ allowGet: true, cacheSec: 3600 })
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(chartFederationOutput);
