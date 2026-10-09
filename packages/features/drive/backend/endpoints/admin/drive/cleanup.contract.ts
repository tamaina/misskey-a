/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

export const adminDriveCleanupErrors = {} as const;
export const adminDriveCleanupContract = oc.$meta({ requestName: 'admin/drive/cleanup' } as const)
	.route({ method: 'POST', path: '/admin/drive/cleanup', operationId: 'post___admin___drive___cleanup', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({})).output(v.void());
