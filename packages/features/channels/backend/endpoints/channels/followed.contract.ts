/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsFollowedInput = objectInput({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const channelsFollowedOutput = v.array(packedChannelSchema);
export const channelsFollowedErrors = {} as const;
export const channelsFollowedPolicy = { name: 'channels/followed', requireCredential: true, kind: 'read:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsFollowedContract = oc.$meta<{ requestName: 'channels/followed' }>({ requestName: 'channels/followed' })
	.route({ method: 'POST', path: '/channels/followed', operationId: 'post___channels___followed', tags: ['channels', 'account'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(channelsFollowedInput).output(channelsFollowedOutput);
