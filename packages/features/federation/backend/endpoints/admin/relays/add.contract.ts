/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';

export const adminRelaysAddErrors = {
		invalidUrl: {
			message: 'Invalid URL',
			code: 'INVALID_URL',
			id: 'fb8c92d3-d4e5-44e7-b3d4-800d5cef8b2c',
		},
	} as const;

const requestName = 'admin/relays/add';
export const adminRelaysAddContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:relays',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, INVALID_URL: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"inbox": v.string(),
	})).output(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"inbox": v.pipe(v.string(), v.metadata({ "format": "url" })),
		"status": v.pipe(v.picklist(["requesting", "accepted", "rejected"]), v.metadata({ "default": "requesting" })),
	}));

export type AdminRelaysAddInput = v.InferOutput<NonNullable<typeof adminRelaysAddContract['~orpc']['inputSchema']>>;
export type AdminRelaysAddOutput = v.InferOutput<NonNullable<typeof adminRelaysAddContract['~orpc']['outputSchema']>>;
