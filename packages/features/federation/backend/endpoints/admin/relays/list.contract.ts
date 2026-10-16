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

export const adminRelaysListErrors = {} as const;

const requestName = 'admin/relays/list';
export const adminRelaysListContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:relays',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.strictObject({
			"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
			"inbox": v.pipe(v.string(), v.metadata({ "format": "url" })),
			"status": v.pipe(v.picklist(["requesting", "accepted", "rejected"]), v.metadata({ "default": "requesting" })),
		})));

export type AdminRelaysListInput = v.InferOutput<NonNullable<typeof adminRelaysListContract['~orpc']['inputSchema']>>;
export type AdminRelaysListOutput = v.InferOutput<NonNullable<typeof adminRelaysListContract['~orpc']['outputSchema']>>;
