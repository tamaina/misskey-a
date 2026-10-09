/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';

export const adminQueuePromoteJobsErrors = {} as const;

const requestName = 'admin/queue/promote-jobs';
export const adminQueuePromoteJobsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({ queue: v.picklist(QUEUE_TYPES) })).output(v.void());

export type AdminQueuePromoteJobsInput = v.InferOutput<NonNullable<typeof adminQueuePromoteJobsContract['~orpc']['inputSchema']>>;
export type AdminQueuePromoteJobsOutput = v.InferOutput<NonNullable<typeof adminQueuePromoteJobsContract['~orpc']['outputSchema']>>;
