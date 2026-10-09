/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

export const chartPerUserDriveOutput = v.strictObject({
	totalCount: v.array(v.pipe(v.number(), v.finite())),
	totalSize: v.array(v.pipe(v.number(), v.finite())),
	incCount: v.array(v.pipe(v.number(), v.finite())),
	incSize: v.array(v.pipe(v.number(), v.finite())),
	decCount: v.array(v.pipe(v.number(), v.finite())),
	decSize: v.array(v.pipe(v.number(), v.finite())),
});

const requestName = 'charts/user/drive';
export const chartPerUserDriveContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 3600 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['charts', 'drive', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(chartPerUserDriveOutput);

export const chartPerUserDriveGetContract = oc.$meta<{ allowGet: true; cacheSec: number }>({ allowGet: true, cacheSec: 3600 })
	.route({ method: 'GET', path: `/${requestName}`, operationId: 'get___' + requestName.replaceAll('/', '___'), tags: ['charts', 'drive', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(chartPerUserDriveOutput);
