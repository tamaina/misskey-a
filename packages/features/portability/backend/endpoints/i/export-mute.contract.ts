/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportMuteInput = v.optional(objectInput({}), {});
export const iExportMuteErrors = {} as const;
export const iExportMuteContract = oc.$meta<{ requestName: 'i/export-mute' }>({ requestName: 'i/export-mute' })
	.route({ method: 'POST', path: '/i/export-mute', operationId: 'post___i___export-mute', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(iExportMuteInput).output(v.void());
