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

export const chatRoomsLeaveErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'cb7f3179-50e8-4389-8c30-dbe2650a67c9',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsLeaveContract = oc.$meta({
	requestName: 'chat/rooms/leave',
	requireCredential: true,
	kind: 'write:chat',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/rooms/leave', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(objectInput({ roomId: misskeyId })).output(v.void());
