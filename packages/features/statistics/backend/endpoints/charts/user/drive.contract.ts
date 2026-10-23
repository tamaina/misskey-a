/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { userChartInput } from '../chart-input.schema.js';

const requestName = 'charts/user/drive';
export const chartPerUserDriveContract = oc.$meta({
	requestName: requestName,
	allowGet: true,
	cacheSec: 3600,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['charts', 'drive', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		totalCount: v.array(v.pipe(v.number(), v.finite())),
		totalSize: v.array(v.pipe(v.number(), v.finite())),
		incCount: v.array(v.pipe(v.number(), v.finite())),
		incSize: v.array(v.pipe(v.number(), v.finite())),
		decCount: v.array(v.pipe(v.number(), v.finite())),
		decSize: v.array(v.pipe(v.number(), v.finite())),
	}));

export const chartPerUserDriveGetContract = oc.$meta({
	allowGet: true,
	cacheSec: 3600,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'GET', path: `/${requestName}`, tags: ['charts', 'drive', 'users'] })
	.errors(commonErrors)
	.input(userChartInput)
	.output(v.strictObject({
		totalCount: v.array(v.pipe(v.number(), v.finite())),
		totalSize: v.array(v.pipe(v.number(), v.finite())),
		incCount: v.array(v.pipe(v.number(), v.finite())),
		incSize: v.array(v.pipe(v.number(), v.finite())),
		decCount: v.array(v.pipe(v.number(), v.finite())),
		decSize: v.array(v.pipe(v.number(), v.finite())),
	}));
