/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedNoteDraftSchema } from '../../../note-aux.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsListErrors = {
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsListContract = oc.$meta({
	requestName: 'notes/drafts/list',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/drafts/list', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'scheduled': v.exactOptional(v.nullable(v.boolean())),
})).output(v.array(packedNoteDraftSchema));
