/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

export const resetDbErrors = {

	} as const;

const requestName = 'reset-db';
export const resetDbContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['non-productive'] })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.void());

export type ResetDbInput = v.InferOutput<NonNullable<typeof resetDbContract['~orpc']['inputSchema']>>;
export type ResetDbOutput = v.InferOutput<NonNullable<typeof resetDbContract['~orpc']['outputSchema']>>;
