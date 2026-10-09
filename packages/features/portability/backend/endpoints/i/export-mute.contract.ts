/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportMuteErrors = {} as const;
export const iExportMuteContract = oc.$meta({ requestName: 'i/export-mute' } as const)
	.route({ method: 'POST', path: '/i/export-mute', operationId: 'post___i___export-mute', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportMuteInput = v.InferOutput<NonNullable<typeof iExportMuteContract['~orpc']['inputSchema']>>;
