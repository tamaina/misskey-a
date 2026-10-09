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

export const channelsFeaturedInput = objectInput({});
export const channelsFeaturedOutput = v.array(packedChannelSchema);
export const channelsFeaturedErrors = {} as const;
export const channelsFeaturedPolicy = { name: 'channels/featured', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const channelsFeaturedContract = oc.$meta<{ requestName: 'channels/featured' }>({ requestName: 'channels/featured' })
	.route({ method: 'POST', path: '/channels/featured', operationId: 'post___channels___featured', tags: ['channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(channelsFeaturedInput).output(channelsFeaturedOutput);
