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
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const notesSearchErrors = {
	unavailable: { message: 'Search of notes unavailable.', code: 'UNAVAILABLE', id: '0b44998d-77aa-4427-80d0-d2c9b8523011' },
} as const;

const requestName = 'notes/search';
export const notesSearchContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['notes'] })
	.errors({ ...commonErrors, UNAVAILABLE: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'query': v.string(),
		'rangeStartAt': v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
		'rangeEndAt': v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
		'sinceId': v.exactOptional(misskeyId),
		'untilId': v.exactOptional(misskeyId),
		'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'offset': v.optional(v.pipe(v.number(), v.integer()), 0),
		'host': v.exactOptional(v.pipe(v.string(), v.metadata({ 'description': 'The local host is represented with `.`.' }))),
		'userId': v.optional(v.nullable(misskeyId), null),
		'channelId': v.optional(v.nullable(misskeyId), null),
	}))
	.output(v.array(packedNoteSchema));
