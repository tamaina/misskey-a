/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

export const driveFilesCheckExistenceInput = objectInput({
	"md5": v.string(),
});
export const driveFilesCheckExistenceErrors = {} as const;
export const driveFilesCheckExistenceContract = oc.$meta<{ requestName: 'drive/files/check-existence' }>({ requestName: 'drive/files/check-existence' })
	.route({ method: 'POST', path: '/drive/files/check-existence', operationId: 'post___drive___files___check-existence', tags: ['drive'], description: 'Check if a given file exists.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(driveFilesCheckExistenceInput).output(v.boolean());
