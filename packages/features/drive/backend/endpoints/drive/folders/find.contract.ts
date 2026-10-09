/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFolderSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFoldersFindErrors = {} as const;
export const driveFoldersFindContract = oc.$meta({ requestName: 'drive/folders/find' } as const)
	.route({ method: 'POST', path: '/drive/folders/find', operationId: 'post___drive___folders___find', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"name": v.string(),
		"parentId": v.optional(v.nullable(misskeyId), null),
	})).output(v.array(packedDriveFolderSchema));
