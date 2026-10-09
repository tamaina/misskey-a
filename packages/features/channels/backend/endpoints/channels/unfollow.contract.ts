/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsUnfollowErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '19959ee9-0153-4c51-bbd9-a98c49dc59d6',
		},
	} as const;
export const channelsUnfollowPolicy = { name: 'channels/unfollow', requireCredential: true, prohibitMoved: true, kind: 'write:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsUnfollowContract = oc.$meta({ requestName: 'channels/unfollow' } as const)
	.route({ method: 'POST', path: '/channels/unfollow', operationId: 'post___channels___unfollow', tags: ['channels'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData } })
	.input(objectInput({ channelId: misskeyId })).output(v.void());
