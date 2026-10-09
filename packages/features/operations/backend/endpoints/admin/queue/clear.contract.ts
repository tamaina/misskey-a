/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES, QUEUE_CLEAR_STATES } from '../../../queue.schema.js';

export const adminQueueClearErrors = {} as const;

const requestName = 'admin/queue/clear';
export const adminQueueClearContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({ queue: v.picklist(QUEUE_TYPES), state: v.picklist(QUEUE_CLEAR_STATES) })).output(v.void());

export type AdminQueueClearInput = v.InferOutput<NonNullable<typeof adminQueueClearContract['~orpc']['inputSchema']>>;
export type AdminQueueClearOutput = v.InferOutput<NonNullable<typeof adminQueueClearContract['~orpc']['outputSchema']>>;
