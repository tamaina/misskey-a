/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const adminGetIndexStatsErrors = {} as const;

const requestName = 'admin/get-index-stats';
export const adminGetIndexStatsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:index-stats',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.strictObject({
			"schemaname": v.nullable(v.string()),
			"tablename": v.string(),
			"indexname": v.string(),
			"tablespace": v.nullable(v.string()),
			"indexdef": v.nullable(v.string()),
		})));

export type AdminGetIndexStatsInput = v.InferOutput<NonNullable<typeof adminGetIndexStatsContract['~orpc']['inputSchema']>>;
export type AdminGetIndexStatsOutput = v.InferOutput<NonNullable<typeof adminGetIndexStatsContract['~orpc']['outputSchema']>>;
