/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatMessagesUnreactErrors = {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: 'c39ea42f-e3ca-428a-ad57-390e0a711595',
		},
	} as const;
export const chatMessagesUnreactPolicy = { name: 'chat/messages/unreact', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesUnreactContract = oc.$meta({ requestName: 'chat/messages/unreact' } as const)
	.route({ method: 'POST', path: '/chat/messages/unreact', operationId: 'post___chat___messages___unreact', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_MESSAGE: { status: 400, data: apiErrorData } })
	.input(objectInput({ messageId: misskeyId, reaction: v.string() })).output(v.void());
