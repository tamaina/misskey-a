/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'notes/delete';
export const notesDeleteContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:notes',
	limit: {
				key: 'notes/delete', duration: 3600000, max: 300, minInterval: 1000,
			},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['notes'], description: 'Delete a note. Requires write:notes permission.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({
		...commonErrors,
		NO_SUCH_NOTE: { status: 400, data: apiErrorData },
		ACCESS_DENIED: { status: 400, data: apiErrorData },
	})
	.input(v.object({ noteId: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)) }))
	.output(v.void());

export const notesPilotContract = { delete: notesDeleteContract };
