/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportFavoritesErrors = {} as const;
export const iExportFavoritesContract = oc.$meta({
	requestName: 'i/export-favorites',
	requireCredential: true,
	secure: true,
	limit: {
		'duration': 86400000,
		'max': 1,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/export-favorites', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportFavoritesInput = v.InferOutput<NonNullable<typeof iExportFavoritesContract['~orpc']['inputSchema']>>;
