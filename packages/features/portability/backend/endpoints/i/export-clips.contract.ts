/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportClipsErrors = {} as const;
export const iExportClipsContract = oc.$meta({ requestName: 'i/export-clips' } as const)
	.route({ method: 'POST', path: '/i/export-clips', operationId: 'post___i___export-clips', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportClipsInput = v.InferOutput<NonNullable<typeof iExportClipsContract['~orpc']['inputSchema']>>;
