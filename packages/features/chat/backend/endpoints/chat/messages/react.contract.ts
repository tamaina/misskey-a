/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatMessagesReactErrors = {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '9b5839b9-0ba0-4351-8c35-37082093d200',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesReactContract = oc.$meta({
	requestName: 'chat/messages/react',
	requireCredential: true,
	kind: 'write:chat',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/messages/react', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_MESSAGE: { status: 400, data: apiErrorData } })
	.input(objectInput({ messageId: misskeyId, reaction: v.string() })).output(v.void());
