/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { apiErrorData, commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { driveCreateWireInput, driveCreateOutput } from './create.schema.js';

const requestName = 'drive/files/create';
const base = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['drive'], description: 'Upload a new drive file. Requires write:drive permission.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({
		...commonErrors,
		FILE_REQUIRED: { status: 400, data: apiErrorData },
		INVALID_FILE_NAME: { status: 400, data: apiErrorData },
		INAPPROPRIATE: { status: 400, data: apiErrorData },
		NO_FREE_SPACE: { status: 400, data: apiErrorData },
		MAX_FILE_SIZE_EXCEEDED: { status: 413, data: apiErrorData },
		UNALLOWED_FILE_TYPE: { status: 400, data: apiErrorData },
	});

/** Portable SDK/OpenAPI contract. No server path or resource enters this graph. */
export const driveCreateContract = base.input(driveCreateWireInput).output(driveCreateOutput);

export const drivePilotContract = { files: { create: driveCreateContract } };
