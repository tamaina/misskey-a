/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsDeleteInput = objectInput({ draftId: misskeyId });
export const notesDraftsDeleteOutput = v.void();
export const notesDraftsDeleteErrors = {
	noSuchNoteDraft: {
		message: 'No such note draft.',
		code: 'NO_SUCH_NOTE_DRAFT',
		id: '49cd6b9d-848e-41ee-b0b9-adaca711a6b1',
	},
	accessDenied: {
		message: 'Access denied.',
		code: 'ACCESS_DENIED',
		id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
	},
} as const;
export const notesDraftsDeletePolicy = { name: 'notes/drafts/delete', requireCredential: true, prohibitMoved: true, kind: 'write:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsDeleteContract = oc.$meta<{ requestName: 'notes/drafts/delete' }>({ requestName: 'notes/drafts/delete' })
	.route({ method: 'POST', path: '/notes/drafts/delete', operationId: 'post___notes___drafts___delete', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE_DRAFT: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(notesDraftsDeleteInput).output(notesDraftsDeleteOutput);
