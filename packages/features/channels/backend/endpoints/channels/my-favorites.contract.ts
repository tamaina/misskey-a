/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput } from '../../request.schema.js';

export const channelsMyFavoritesInput = objectInput({});
export const channelsMyFavoritesOutput = v.array(packedChannelSchema);
export const channelsMyFavoritesErrors = {} as const;
export const channelsMyFavoritesPolicy = { name: 'channels/my-favorites', requireCredential: true, kind: 'read:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsMyFavoritesContract = oc.$meta<{ requestName: 'channels/my-favorites' }>({ requestName: 'channels/my-favorites' })
	.route({ method: 'POST', path: '/channels/my-favorites', operationId: 'post___channels___my-favorites', tags: ['channels', 'account'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(channelsMyFavoritesInput).output(channelsMyFavoritesOutput);
