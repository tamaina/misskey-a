/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { chartInput } from './chart-input.schema.js';

export const chartActiveUsersOutput = v.strictObject({
	readWrite: v.array(v.pipe(v.number(), v.finite())),
	read: v.array(v.pipe(v.number(), v.finite())),
	write: v.array(v.pipe(v.number(), v.finite())),
	registeredWithinWeek: v.array(v.pipe(v.number(), v.finite())),
	registeredWithinMonth: v.array(v.pipe(v.number(), v.finite())),
	registeredWithinYear: v.array(v.pipe(v.number(), v.finite())),
	registeredOutsideWeek: v.array(v.pipe(v.number(), v.finite())),
	registeredOutsideMonth: v.array(v.pipe(v.number(), v.finite())),
	registeredOutsideYear: v.array(v.pipe(v.number(), v.finite())),
});

const requestName = 'charts/active-users';
export const chartActiveUsersContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 3600 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(chartActiveUsersOutput);

export const chartActiveUsersGetContract = oc.$meta<{ allowGet: true; cacheSec: number }>({ allowGet: true, cacheSec: 3600 })
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(chartActiveUsersOutput);
