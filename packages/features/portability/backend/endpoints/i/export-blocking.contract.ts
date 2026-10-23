/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportBlockingErrors = {} as const;
export const iExportBlockingContract = oc.$meta({
	requestName: 'i/export-blocking',
	requireCredential: true,
	secure: true,
	limit: {
		'duration': 3600000,
		'max': 1,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/export-blocking', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportBlockingInput = v.InferOutput<NonNullable<typeof iExportBlockingContract['~orpc']['inputSchema']>>;
