/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../../channel.schema.js';
import { objectInput } from '../../../request.schema.js';

export const channelsMuteListErrors = {} as const;
export const channelsMuteListPolicy = { name: 'channels/mute/list', requireCredential: true, prohibitMoved: true, kind: 'read:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsMuteListContract = oc.$meta({ requestName: 'channels/mute/list' } as const)
	.route({ method: 'POST', path: '/channels/mute/list', operationId: 'post___channels___mute___list', tags: ['channels', 'mute'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(packedChannelSchema));
