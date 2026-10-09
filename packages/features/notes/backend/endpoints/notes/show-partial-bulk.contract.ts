/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesShowPartialBulkErrors = {
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesShowPartialBulkContract = oc.$meta({
	requestName: 'notes/show-partial-bulk',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/show-partial-bulk', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	'noteIds': v.pipe(v.array(misskeyId), v.minLength(1), v.maxLength(100)),
})).output(v.array(v.strictObject({
	'id': v.string(),
	'reactions': v.record(v.string(), v.pipe(v.number(), v.finite())),
	'reactionEmojis': v.record(v.string(), v.string()),
})));
