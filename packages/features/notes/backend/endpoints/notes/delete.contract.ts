/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const notesDeleteInput = v.object({ noteId: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)) });
const requestName = 'notes/delete';
export const notesDeleteContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notes'], description: 'Delete a note. Requires write:notes permission.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({
		...commonErrors,
		NO_SUCH_NOTE: { status: 400, data: apiErrorData },
		ACCESS_DENIED: { status: 400, data: apiErrorData },
	})
	.input(notesDeleteInput)
	.output(v.void());

export const notesPilotContract = { delete: notesDeleteContract };
