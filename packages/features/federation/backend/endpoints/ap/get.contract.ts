/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedJsonObjectSchema } from '../../../../users/backend/json-value.schema.js';

export const apGetErrors = {
	} as const;

const requestName = 'ap/get';
export const apGetContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:federation',
	limit: {
		duration: 3600000,
		max: 30,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['federation'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"uri": v.string(),
	})).output(packedJsonObjectSchema);

export type ApGetInput = v.InferOutput<NonNullable<typeof apGetContract['~orpc']['inputSchema']>>;
export type ApGetOutput = v.InferOutput<NonNullable<typeof apGetContract['~orpc']['outputSchema']>>;
