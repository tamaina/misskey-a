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

const requestName = 'charts/active-users';
export const chartActiveUsersContract = oc.$meta({
	requestName: requestName,
	allowGet: true,
	cacheSec: 3600,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		readWrite: v.array(v.pipe(v.number(), v.finite())),
		read: v.array(v.pipe(v.number(), v.finite())),
		write: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinWeek: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinMonth: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinYear: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideWeek: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideMonth: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideYear: v.array(v.pipe(v.number(), v.finite())),
	}));

export const chartActiveUsersGetContract = oc.$meta({
	allowGet: true,
	cacheSec: 3600,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'GET', path: `/${requestName}`, tags: ['charts', 'users'] })
	.errors(commonErrors)
	.input(chartInput)
	.output(v.strictObject({
		readWrite: v.array(v.pipe(v.number(), v.finite())),
		read: v.array(v.pipe(v.number(), v.finite())),
		write: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinWeek: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinMonth: v.array(v.pipe(v.number(), v.finite())),
		registeredWithinYear: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideWeek: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideMonth: v.array(v.pipe(v.number(), v.finite())),
		registeredOutsideYear: v.array(v.pipe(v.number(), v.finite())),
	}));
