/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedMeDetailedSchema } from '../../../../users/backend/user.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const iPinErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '56734f8b-3928-431e-bf80-6ff87df40cb3',
	},

	pinLimitExceeded: {
		message: 'You can not pin notes any more.',
		code: 'PIN_LIMIT_EXCEEDED',
		id: '72dab508-c64d-498f-8740-a8eec1ba385a',
	},

	alreadyPinned: {
		message: 'That note has already been pinned.',
		code: 'ALREADY_PINNED',
		id: '8b18c2b7-68fe-4edb-9892-c0cbaeb6c913',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const iPinContract = oc.$meta({
	requestName: 'i/pin',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/pin', tags: ['account', 'notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, PIN_LIMIT_EXCEEDED: { status: 400, data: apiErrorData }, ALREADY_PINNED: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
})).output(packedMeDetailedSchema);
