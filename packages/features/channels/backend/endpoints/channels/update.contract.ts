/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput, misskeyId, jsonString } from '../../request.schema.js';

export const channelsUpdateInput = objectInput({
	"channelId": misskeyId,
	"name": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 128 })),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
	"bannerId": v.exactOptional(v.nullable(misskeyId)),
	"isArchived": v.exactOptional(v.nullable(v.boolean())),
	"pinnedNoteIds": v.exactOptional(v.array(misskeyId)),
	"color": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 16 })),
	"isSensitive": v.exactOptional(v.nullable(v.boolean())),
	"allowRenoteToExternal": v.exactOptional(v.nullable(v.boolean())),
});
export const channelsUpdateOutput = packedChannelSchema;
export const channelsUpdateErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'f9c5467f-d492-4c3c-9a8d-a70dacc86512',
		},

		accessDenied: {
			message: 'You do not have edit privilege of the channel.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fdf-b8df-057788cce513',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e86c14a4-0da2-4032-8df3-e737a04c7f3b',
		},
	} as const;
export const channelsUpdatePolicy = { name: 'channels/update', requireCredential: true, kind: 'write:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsUpdateContract = oc.$meta<{ requestName: 'channels/update' }>({ requestName: 'channels/update' })
	.route({ method: 'POST', path: '/channels/update', operationId: 'post___channels___update', tags: ['channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData } })
	.input(channelsUpdateInput).output(channelsUpdateOutput);
