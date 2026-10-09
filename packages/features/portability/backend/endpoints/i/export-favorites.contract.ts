/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportFavoritesErrors = {} as const;
export const iExportFavoritesContract = oc.$meta({ requestName: 'i/export-favorites' } as const)
	.route({ method: 'POST', path: '/i/export-favorites', operationId: 'post___i___export-favorites', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportFavoritesInput = v.InferOutput<NonNullable<typeof iExportFavoritesContract['~orpc']['inputSchema']>>;
