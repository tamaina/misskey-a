/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsFollowErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'c0031718-d573-4e85-928e-10039f1fbb68',
		},
		alreadyFollowing: {
			message: 'You are already following that channel.',
			code: 'ALREADY_FOLLOWING',
			id: '7db31665-651e-40c1-8e6e-28e9ad829a2d',
		},
	} as const;
export const channelsFollowPolicy = { name: 'channels/follow', requireCredential: true, prohibitMoved: true, kind: 'write:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsFollowContract = oc.$meta({ requestName: 'channels/follow' } as const)
	.route({ method: 'POST', path: '/channels/follow', operationId: 'post___channels___follow', tags: ['channels'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData }, ALREADY_FOLLOWING: { status: 400, data: apiErrorData } })
	.input(objectInput({ channelId: misskeyId })).output(v.void());
