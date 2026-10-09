/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedMeDetailedSchema } from '../../../../users/backend/user.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const iUnpinErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '454170ce-9d63-4a43-9da1-ea10afe81e21',
	},
} as const;
export const iUnpinPolicy = { name: 'i/unpin', requireCredential: true, kind: 'write:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const iUnpinContract = oc.$meta({ requestName: 'i/unpin' } as const)
	.route({ method: 'POST', path: '/i/unpin', operationId: 'post___i___unpin', tags: ['account', 'notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
})).output(packedMeDetailedSchema);
