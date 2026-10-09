/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../note.schema.js';
import { objectInput, misskeyId } from '../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesInput = objectInput({
	'local': v.optional(v.boolean(), false),
	'reply': v.exactOptional(v.boolean()),
	'renote': v.exactOptional(v.boolean()),
	'withFiles': v.exactOptional(v.boolean()),
	'poll': v.exactOptional(v.boolean()),
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
});
export const notesOutput = v.array(packedNoteSchema);
export const notesErrors = {} as const;
export const notesPolicy = { name: 'notes' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesContract = oc.$meta<{ requestName: 'notes' }>({ requestName: 'notes' })
	.route({ method: 'POST', path: '/notes', operationId: 'post___notes', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(notesInput).output(notesOutput);
