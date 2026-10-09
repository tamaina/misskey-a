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

export const adminFederationUpdateInstanceErrors = {} as const;

const requestName = 'admin/federation/update-instance';
export const adminFederationUpdateInstanceContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:federation',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"host": v.string(),
		"isSuspended": v.exactOptional(v.boolean()),
		"moderationNote": v.exactOptional(v.string()),
	})).output(v.void());

export type AdminFederationUpdateInstanceInput = v.InferOutput<NonNullable<typeof adminFederationUpdateInstanceContract['~orpc']['inputSchema']>>;
export type AdminFederationUpdateInstanceOutput = v.InferOutput<NonNullable<typeof adminFederationUpdateInstanceContract['~orpc']['outputSchema']>>;
