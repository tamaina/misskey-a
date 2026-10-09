/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const notesTimelineInput = objectInput({
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
});
export const notesTimelineOutput = v.array(packedNoteSchema);

const requestName = 'notes/timeline';
export const notesTimelineContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notes'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(notesTimelineInput)
	.output(notesTimelineOutput);
