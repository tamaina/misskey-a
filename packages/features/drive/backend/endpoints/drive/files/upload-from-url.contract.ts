/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { misskeyId } from '../../../../../users/backend/users.input.schema.js';

export const driveFilesUploadFromUrlErrors = {} as const;
export const driveFilesUploadFromUrlContract = oc.$meta({ requestName: 'drive/files/upload-from-url' } as const)
	.route({ method: 'POST', path: '/drive/files/upload-from-url', operationId: 'post___drive___files___upload-from-url', tags: ['drive'], description: 'Request the server to download a new drive file from the specified URL.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
		"url": v.string(),
		"folderId": v.optional(v.nullable(misskeyId), null),
		"isSensitive": v.optional(v.boolean(), false),
		"comment": v.optional(v.nullable(jsonString({ "maxLength": 512 })), null),
		"marker": v.optional(v.nullable(v.string()), null),
		"force": v.optional(v.boolean(), false),
	})).output(v.void());
