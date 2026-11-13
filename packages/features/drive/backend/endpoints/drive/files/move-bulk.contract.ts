/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId, uniqueStrings } from '../../../../../users/backend/users.input.schema.js';

export const driveFilesMoveBulkErrors = {
	} as const;
export const driveFilesMoveBulkContract = oc.$meta({
	requestName: 'drive/files/move-bulk',
	'requireCredential': true,
	'kind': 'write:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/files/move-bulk', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
		"fileIds": v.pipe(uniqueStrings(misskeyId), v.minLength(1), v.maxLength(100)),
		"folderId": v.exactOptional(v.nullable(misskeyId)),
	})).output(v.void());
