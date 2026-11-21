/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsUnfavoriteErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '353c68dd-131a-476c-aa99-88a345e83668',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsUnfavoriteContract = oc.$meta({
	requestName: 'channels/unfavorite',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:channels',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/channels/unfavorite', tags: ['channels'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData } })
	.input(objectInput({ channelId: misskeyId })).output(v.void());
