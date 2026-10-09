/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportBlockingInput = v.optional(objectInput({}), {});
export const iExportBlockingErrors = {} as const;
export const iExportBlockingContract = oc.$meta<{ requestName: 'i/export-blocking' }>({ requestName: 'i/export-blocking' })
	.route({ method: 'POST', path: '/i/export-blocking', operationId: 'post___i___export-blocking', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(iExportBlockingInput).output(v.void());
