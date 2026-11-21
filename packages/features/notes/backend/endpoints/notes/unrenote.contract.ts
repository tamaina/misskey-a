/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesUnrenoteErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'efd4a259-2442-496b-8dd7-b255aa1a160f',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesUnrenoteContract = oc.$meta({
	requestName: 'notes/unrenote',
	requireCredential: true,
	kind: 'write:notes',
	limit: { duration: 3600000, max: 300, minInterval: 1000 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/unrenote', tags: ['notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(objectInput({ noteId: misskeyId })).output(v.void());
