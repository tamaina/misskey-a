/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsFavoriteInput = objectInput({ channelId: misskeyId });
export const channelsFavoriteOutput = v.void();
export const channelsFavoriteErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '4938f5f3-6167-4c04-9149-6607b7542861',
		},
	} as const;
export const channelsFavoritePolicy = { name: 'channels/favorite', requireCredential: true, prohibitMoved: true, kind: 'write:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsFavoriteContract = oc.$meta<{ requestName: 'channels/favorite' }>({ requestName: 'channels/favorite' })
	.route({ method: 'POST', path: '/channels/favorite', operationId: 'post___channels___favorite', tags: ['channels'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData } })
	.input(channelsFavoriteInput).output(channelsFavoriteOutput);
