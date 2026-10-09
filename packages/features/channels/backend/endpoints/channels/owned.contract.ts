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

export const channelsOwnedInput = objectInput({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const channelsOwnedOutput = v.array(packedChannelSchema);
export const channelsOwnedErrors = {} as const;
export const channelsOwnedPolicy = { name: 'channels/owned', requireCredential: true, kind: 'read:channels' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsOwnedContract = oc.$meta<{ requestName: 'channels/owned' }>({ requestName: 'channels/owned' })
	.route({ method: 'POST', path: '/channels/owned', operationId: 'post___channels___owned', tags: ['channels', 'account'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(channelsOwnedInput).output(channelsOwnedOutput);
