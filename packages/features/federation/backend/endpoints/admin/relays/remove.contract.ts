/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminRelaysRemoveErrors = {} as const;

const requestName = 'admin/relays/remove';
export const adminRelaysRemoveContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:relays',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"inbox": v.string(),
	})).output(v.void());

export type AdminRelaysRemoveInput = v.InferOutput<NonNullable<typeof adminRelaysRemoveContract['~orpc']['inputSchema']>>;
export type AdminRelaysRemoveOutput = v.InferOutput<NonNullable<typeof adminRelaysRemoveContract['~orpc']['outputSchema']>>;
