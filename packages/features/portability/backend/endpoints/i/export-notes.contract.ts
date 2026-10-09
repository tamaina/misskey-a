/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportNotesErrors = {} as const;
export const iExportNotesContract = oc.$meta({ requestName: 'i/export-notes' } as const)
	.route({ method: 'POST', path: '/i/export-notes', operationId: 'post___i___export-notes', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportNotesInput = v.InferOutput<NonNullable<typeof iExportNotesContract['~orpc']['inputSchema']>>;
