/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsTimelineInput = objectInput({
	"channelId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
});
export const channelsTimelineOutput = v.array(packedNoteSchema);
export const channelsTimelineErrors = {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '4d0eeeba-a02c-4c3c-9966-ef60d38d2e7f',
		},
	} as const;
export const channelsTimelinePolicy = { name: 'channels/timeline', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const channelsTimelineContract = oc.$meta<{ requestName: 'channels/timeline' }>({ requestName: 'channels/timeline' })
	.route({ method: 'POST', path: '/channels/timeline', operationId: 'post___channels___timeline', tags: ['notes', 'channels'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData } })
	.input(channelsTimelineInput).output(channelsTimelineOutput);
