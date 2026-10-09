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

export const notesChildrenErrors = {} as const;
export const notesChildrenPolicy = { name: 'notes/children', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesChildrenContract = oc.$meta({ requestName: 'notes/children' } as const)
	.route({ method: 'POST', path: '/notes/children', operationId: 'post___notes___children', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	'noteId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
})).output(v.array(packedNoteSchema));
