/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const notesUserListTimelineErrors = {
	noSuchList: { message: 'No such list.', code: 'NO_SUCH_LIST', id: '8fb1fbd5-e476-4c37-9fb0-43d55b63a2ff' },
} as const;

const requestName = 'notes/user-list-timeline';
export const notesUserListTimelineContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['notes', 'lists'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_LIST: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'listId': misskeyId,
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'sinceId': v.exactOptional(misskeyId),
		'untilId': v.exactOptional(misskeyId),
		'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'allowPartial': v.optional(v.boolean(), false),
		'includeMyRenotes': v.optional(v.boolean(), true),
		'includeRenotedMyNotes': v.optional(v.boolean(), true),
		'includeLocalRenotes': v.optional(v.boolean(), true),
		'withRenotes': v.optional(v.boolean(), true),
		'withFiles': v.optional(v.pipe(v.boolean(), v.metadata({ 'description': 'Only show notes that have attached files.' })), false),
	}))
	.output(v.array(packedNoteSchema));
