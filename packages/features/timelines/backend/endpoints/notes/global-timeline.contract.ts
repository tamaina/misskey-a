/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const notesGlobalTimelineErrors = {
	gtlDisabled: { message: 'Global timeline has been disabled.', code: 'GTL_DISABLED', id: '0332fc13-6ab2-4427-ae80-a9fadffd1a6b' },
} as const;

const requestName = 'notes/global-timeline';
export const notesGlobalTimelineContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notes'] })
	.errors({ ...commonErrors, GTL_DISABLED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		'withFiles': v.optional(v.boolean(), false),
		'withRenotes': v.optional(v.boolean(), true),
		'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		'sinceId': v.exactOptional(misskeyId),
		'untilId': v.exactOptional(misskeyId),
		'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	}))
	.output(v.array(packedNoteSchema));
