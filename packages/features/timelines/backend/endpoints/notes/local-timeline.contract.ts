/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const notesLocalTimelineInput = objectInput({
	'withFiles': v.optional(v.boolean(), false),
	'withRenotes': v.optional(v.boolean(), true),
	'withReplies': v.optional(v.boolean(), false),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'allowPartial': v.optional(v.boolean(), false),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const notesLocalTimelineOutput = v.array(packedNoteSchema);
export const notesLocalTimelineErrors = {
	ltlDisabled: { message: 'Local timeline has been disabled.', code: 'LTL_DISABLED', id: '45a6eb02-7695-4393-b023-dd3be9aaaefd' },
	bothWithRepliesAndWithFiles: { message: 'Specifying both withReplies and withFiles is not supported', code: 'BOTH_WITH_REPLIES_AND_WITH_FILES', id: 'dd9c8400-1cb5-4eef-8a31-200c5f933793' },
} as const;

const requestName = 'notes/local-timeline';
export const notesLocalTimelineContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notes'] })
	.errors({ ...commonErrors, LTL_DISABLED: { status: 400, data: apiErrorData }, BOTH_WITH_REPLIES_AND_WITH_FILES: { status: 400, data: apiErrorData } })
	.input(notesLocalTimelineInput)
	.output(notesLocalTimelineOutput);
