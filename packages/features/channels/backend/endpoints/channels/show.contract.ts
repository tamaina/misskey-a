/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsShowErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '6f6c314b-7486-4897-8966-c04a66a02923',
		},
	} as const;
export const channelsShowPolicy = { name: 'channels/show', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const channelsShowContract = oc.$meta({ requestName: 'channels/show' } as const)
	.route({ method: 'POST', path: '/channels/show', operationId: 'post___channels___show', tags: ['channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"channelId": misskeyId,
	})).output(packedChannelSchema);
