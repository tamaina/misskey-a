/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const usersNotesErrors = {
	noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b' },
	bothWithRepliesAndWithFiles: { message: 'Specifying both withReplies and withFiles is not supported', code: 'BOTH_WITH_REPLIES_AND_WITH_FILES', id: '91c8cb9f-36ed-46e7-9ca2-7df96ed6e222' },
	signinRequired: { message: 'Signin required.', code: 'SIGNIN_REQUIRED', id: 'd1588a9e-4b4d-4c07-807f-16f1486577a2' },
} as const;

const requestName = 'users/notes';
export const usersNotesContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['users', 'notes'] })
	.errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData }, BOTH_WITH_REPLIES_AND_WITH_FILES: { status: 400, data: apiErrorData }, SIGNIN_REQUIRED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'userId': misskeyId,
		'withReplies': v.optional(v.boolean(), false),
		'withRenotes': v.optional(v.boolean(), true),
		'withChannelNotes': v.optional(v.boolean(), false),
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'sinceId': v.exactOptional(misskeyId),
		'untilId': v.exactOptional(misskeyId),
		'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'allowPartial': v.optional(v.boolean(), false),
		'withFiles': v.optional(v.boolean(), false),
	}))
	.output(v.array(packedNoteSchema));
