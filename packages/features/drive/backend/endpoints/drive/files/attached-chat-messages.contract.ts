/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedChatMessageSchema } from '../../../../../chat/backend/chat.schema.js';

export const driveFilesAttachedChatMessagesInput = objectInput({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"fileId": misskeyId,
});
export const driveFilesAttachedChatMessagesErrors = {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '485ce26d-f5d2-4313-9783-e689d131eafb',
		},
	} as const;
export const driveFilesAttachedChatMessagesContract = oc.$meta<{ requestName: 'drive/files/attached-chat-messages' }>({ requestName: 'drive/files/attached-chat-messages' })
	.route({ method: 'POST', path: '/drive/files/attached-chat-messages', operationId: 'post___drive___files___attached-chat-messages', tags: ['drive', 'chat'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData } }).input(driveFilesAttachedChatMessagesInput).output(v.array(packedChatMessageSchema));
