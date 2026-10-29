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

export const channelsMuteDeleteErrors = {
		noSuchChannel: {
			message: 'No such Channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'e7998769-6e94-d9c2-6b8f-94a527314aba',
		},
		notMuting: {
			message: 'You are not muting that channel.',
			code: 'NOT_MUTING_CHANNEL',
			id: '14d55962-6ea8-d990-1333-d6bef78dc2ab',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsMuteDeleteContract = oc.$meta({
	requestName: 'channels/mute/delete',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:channels',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/channels/mute/delete', tags: ['channels', 'mute'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData }, NOT_MUTING_CHANNEL: { status: 400, data: apiErrorData } })
	.input(objectInput({ channelId: misskeyId })).output(v.void());
