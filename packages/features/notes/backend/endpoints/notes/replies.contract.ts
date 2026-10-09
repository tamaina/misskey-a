/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../note.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesRepliesErrors = {} as const;
export const notesRepliesPolicy = { name: 'notes/replies', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesRepliesContract = oc.$meta({ requestName: 'notes/replies' } as const)
	.route({ method: 'POST', path: '/notes/replies', operationId: 'post___notes___replies', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	'noteId': misskeyId,
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(packedNoteSchema));
