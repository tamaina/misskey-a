/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportAntennasErrors = {} as const;
export const iExportAntennasContract = oc.$meta({ requestName: 'i/export-antennas' } as const)
	.route({ method: 'POST', path: '/i/export-antennas', operationId: 'post___i___export-antennas', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(v.optional(objectInput({}), {})).output(v.void());

export type IExportAntennasInput = v.InferOutput<NonNullable<typeof iExportAntennasContract['~orpc']['inputSchema']>>;
