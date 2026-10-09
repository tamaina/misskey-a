/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesThreadMutingCreateErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '5ff67ada-ed3b-2e71-8e87-a1a421e177d2',
	},
	alreadyMuting: {
		message: 'You are already muting that thread.',
		code: 'ALREADY_MUTING',
		id: 'c146e22d-1141-4b31-b28d-176371014d18',
	},
} as const;
export const notesThreadMutingCreatePolicy = { name: 'notes/thread-muting/create', requireCredential: true, kind: 'write:account', limit: { duration: 3600000, max: 10 } } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesThreadMutingCreateContract = oc.$meta({ requestName: 'notes/thread-muting/create' } as const)
	.route({ method: 'POST', path: '/notes/thread-muting/create', operationId: 'post___notes___thread-muting___create', tags: ['notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_MUTING: { status: 400, data: apiErrorData } })
	.input(objectInput({ noteId: misskeyId })).output(v.void());
