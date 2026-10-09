/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId, uniqueStrings } from '../../../../../users/backend/users.input.schema.js';

export const driveFilesMoveBulkInput = objectInput({
	"fileIds": v.pipe(uniqueStrings(misskeyId), v.minLength(1), v.maxLength(100)),
	"folderId": v.exactOptional(v.nullable(misskeyId)),
});
export const driveFilesMoveBulkErrors = {
	} as const;
export const driveFilesMoveBulkContract = oc.$meta<{ requestName: 'drive/files/move-bulk' }>({ requestName: 'drive/files/move-bulk' })
	.route({ method: 'POST', path: '/drive/files/move-bulk', operationId: 'post___drive___files___move-bulk', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(driveFilesMoveBulkInput).output(v.void());
