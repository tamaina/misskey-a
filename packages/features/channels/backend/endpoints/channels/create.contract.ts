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

export const channelsCreateInput = objectInput({
	"name": jsonString({ "minLength": 1, "maxLength": 128 }),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
	"bannerId": v.exactOptional(v.nullable(misskeyId)),
	"color": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 16 })),
	"isSensitive": v.exactOptional(v.nullable(v.boolean())),
	"allowRenoteToExternal": v.exactOptional(v.nullable(v.boolean())),
});
export const channelsCreateOutput = packedChannelSchema;
export const channelsCreateErrors = {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050',
		},
	} as const;
export const channelsCreatePolicy = { name: 'channels/create', requireCredential: true, prohibitMoved: true, requiredRolePolicy: 'canCreateChannel', kind: 'write:channels', limit: {
		duration: 3600000,
		max: 10,
	} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsCreateContract = oc.$meta<{ requestName: 'channels/create' }>({ requestName: 'channels/create' })
	.route({ method: 'POST', path: '/channels/create', operationId: 'post___channels___create', tags: ['channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData } })
	.input(channelsCreateInput).output(channelsCreateOutput);
