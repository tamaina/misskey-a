/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const notesHybridTimelineErrors = {
	stlDisabled: { message: 'Hybrid timeline has been disabled.', code: 'STL_DISABLED', id: '620763f4-f621-4533-ab33-0577a1a3c342' },
	bothWithRepliesAndWithFiles: { message: 'Specifying both withReplies and withFiles is not supported', code: 'BOTH_WITH_REPLIES_AND_WITH_FILES', id: 'dfaa3eb7-8002-4cb7-bcc4-1095df46656f' },
} as const;

const requestName = 'notes/hybrid-timeline';
export const notesHybridTimelineContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['notes'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, STL_DISABLED: { status: 400, data: apiErrorData }, BOTH_WITH_REPLIES_AND_WITH_FILES: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'sinceId': v.exactOptional(misskeyId),
		'untilId': v.exactOptional(misskeyId),
		'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'allowPartial': v.optional(v.boolean(), false),
		'includeMyRenotes': v.optional(v.boolean(), true),
		'includeRenotedMyNotes': v.optional(v.boolean(), true),
		'includeLocalRenotes': v.optional(v.boolean(), true),
		'withFiles': v.optional(v.boolean(), false),
		'withRenotes': v.optional(v.boolean(), true),
		'withReplies': v.optional(v.boolean(), false),
	}))
	.output(v.array(packedNoteSchema));
