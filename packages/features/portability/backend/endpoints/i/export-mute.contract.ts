/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportMuteErrors = {} as const;
export const iExportMuteContract = oc.$meta({
	requestName: 'i/export-mute',
	requireCredential: true,
	secure: true,
	limit: {
		'duration': 3600000,
		'max': 1,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/export-mute', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportMuteInput = v.InferOutput<NonNullable<typeof iExportMuteContract['~orpc']['inputSchema']>>;
