/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { chartInput } from './chart-input.schema.js';

const requestName = 'charts/users';
export const chartUsersContract = oc.$meta({
	requestName: requestName,
	allowGet: true,
	cacheSec: 3600,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['charts', 'users'] })
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

export const chartUsersGetContract = oc.$meta({
	allowGet: true,
	cacheSec: 3600,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'GET', path: `/${requestName}`, tags: ['charts', 'users'] })
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
