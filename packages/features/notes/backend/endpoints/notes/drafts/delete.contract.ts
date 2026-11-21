/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

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

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsDeleteContract = oc.$meta({
	requestName: 'notes/drafts/delete',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/drafts/delete', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE_DRAFT: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(objectInput({ draftId: misskeyId })).output(v.void());
