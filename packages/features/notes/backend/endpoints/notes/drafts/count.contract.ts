/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsCountErrors = {
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsCountContract = oc.$meta({
	requestName: 'notes/drafts/count',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/drafts/count', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ 'description': 'The number of drafts' })));
