/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../../note.schema.js';
import { objectInput } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesPollsRecommendationErrors = {} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesPollsRecommendationContract = oc.$meta({
	requestName: 'notes/polls/recommendation',
	requireCredential: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/polls/recommendation', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), 0),
	'excludeChannels': v.optional(v.boolean(), false),
})).output(v.array(packedNoteSchema));
