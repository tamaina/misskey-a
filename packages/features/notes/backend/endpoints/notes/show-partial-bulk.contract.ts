/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesShowPartialBulkInput = objectInput({
	'noteIds': v.pipe(v.array(misskeyId), v.minLength(1), v.maxLength(100)),
});
export const notesShowPartialBulkOutput = v.array(v.strictObject({
	'id': v.string(),
	'reactions': v.record(v.string(), v.pipe(v.number(), v.finite())),
	'reactionEmojis': v.record(v.string(), v.string()),
}));
export const notesShowPartialBulkErrors = {
} as const;
export const notesShowPartialBulkPolicy = { name: 'notes/show-partial-bulk', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesShowPartialBulkContract = oc.$meta<{ requestName: 'notes/show-partial-bulk' }>({ requestName: 'notes/show-partial-bulk' })
	.route({ method: 'POST', path: '/notes/show-partial-bulk', operationId: 'post___notes___show-partial-bulk', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(notesShowPartialBulkInput).output(notesShowPartialBulkOutput);
