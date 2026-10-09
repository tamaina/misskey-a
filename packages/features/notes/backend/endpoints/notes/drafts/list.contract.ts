/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedNoteDraftSchema } from '../../../note-aux.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'scheduled': v.exactOptional(v.nullable(v.boolean())),
});
export const notesDraftsListOutput = v.array(packedNoteDraftSchema);
export const notesDraftsListErrors = {
} as const;
export const notesDraftsListPolicy = { name: 'notes/drafts/list', requireCredential: true, prohibitMoved: true, kind: 'read:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsListContract = oc.$meta<{ requestName: 'notes/drafts/list' }>({ requestName: 'notes/drafts/list' })
	.route({ method: 'POST', path: '/notes/drafts/list', operationId: 'post___notes___drafts___list', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(notesDraftsListInput).output(notesDraftsListOutput);
