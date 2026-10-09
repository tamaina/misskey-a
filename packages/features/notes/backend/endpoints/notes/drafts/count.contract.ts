/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsCountInput = objectInput({});
export const notesDraftsCountOutput = v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ 'description': 'The number of drafts' }));
export const notesDraftsCountErrors = {
} as const;
export const notesDraftsCountPolicy = { name: 'notes/drafts/count', requireCredential: true, prohibitMoved: true, kind: 'read:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsCountContract = oc.$meta<{ requestName: 'notes/drafts/count' }>({ requestName: 'notes/drafts/count' })
	.route({ method: 'POST', path: '/notes/drafts/count', operationId: 'post___notes___drafts___count', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(notesDraftsCountInput).output(notesDraftsCountOutput);
