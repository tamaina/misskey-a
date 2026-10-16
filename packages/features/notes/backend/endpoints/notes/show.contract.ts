/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../note.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesShowErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '24fcbfc6-2e37-42b6-8388-c29b3861a08d',
	},

	contentRestrictedByUser: {
		message: 'Content restricted by user. Please sign in to view.',
		code: 'CONTENT_RESTRICTED_BY_USER',
		id: 'fbcc002d-37d9-4944-a6b0-d9e29f2d33ab',
	},

	contentRestrictedByServer: {
		message: 'Content restricted by server settings. Please sign in to view.',
		code: 'CONTENT_RESTRICTED_BY_SERVER',
		id: '145f88d2-b03d-4087-8143-a78928883c4b',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesShowContract = oc.$meta({
	requestName: 'notes/show',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/show', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, CONTENT_RESTRICTED_BY_USER: { status: 400, data: apiErrorData }, CONTENT_RESTRICTED_BY_SERVER: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
})).output(packedNoteSchema);
