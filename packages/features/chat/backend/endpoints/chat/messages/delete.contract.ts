/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatMessagesDeleteErrors = {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '36b67f0e-66a6-414b-83df-992a55294f17',
		},
	} as const;
export const chatMessagesDeletePolicy = { name: 'chat/messages/delete', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesDeleteContract = oc.$meta({ requestName: 'chat/messages/delete' } as const)
	.route({ method: 'POST', path: '/chat/messages/delete', operationId: 'post___chat___messages___delete', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_MESSAGE: { status: 400, data: apiErrorData } })
	.input(objectInput({ messageId: misskeyId })).output(v.void());
