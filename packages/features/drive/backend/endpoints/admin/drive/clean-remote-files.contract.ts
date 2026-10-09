/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

export const adminDriveCleanRemoteFilesInput = objectInput({});
export const adminDriveCleanRemoteFilesErrors = {} as const;
export const adminDriveCleanRemoteFilesContract = oc.$meta<{ requestName: 'admin/drive/clean-remote-files' }>({ requestName: 'admin/drive/clean-remote-files' })
	.route({ method: 'POST', path: '/admin/drive/clean-remote-files', operationId: 'post___admin___drive___clean-remote-files', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(adminDriveCleanRemoteFilesInput).output(v.void());
