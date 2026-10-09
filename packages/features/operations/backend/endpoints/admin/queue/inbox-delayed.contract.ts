/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { finiteNumber } from '../../../queue.schema.js';

export const adminQueueInboxDelayedErrors = {} as const;

const requestName = 'admin/queue/inbox-delayed';
export const adminQueueInboxDelayedContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.tuple([v.string(), finiteNumber])));

export type AdminQueueInboxDelayedInput = v.InferOutput<NonNullable<typeof adminQueueInboxDelayedContract['~orpc']['inputSchema']>>;
export type AdminQueueInboxDelayedOutput = v.InferOutput<NonNullable<typeof adminQueueInboxDelayedContract['~orpc']['outputSchema']>>;
