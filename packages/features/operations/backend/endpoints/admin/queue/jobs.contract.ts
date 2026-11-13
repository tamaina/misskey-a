/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES, queueJobSchema } from '../../../queue.schema.js';

export const adminQueueJobsErrors = {} as const;

const requestName = 'admin/queue/jobs';
export const adminQueueJobsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"queue": v.picklist(QUEUE_TYPES),
		"state": v.array(v.picklist(["active", "wait", "delayed", "completed", "failed"])),
		"search": v.exactOptional(v.string()),
	})).output(v.array(queueJobSchema));

export type AdminQueueJobsInput = v.InferOutput<NonNullable<typeof adminQueueJobsContract['~orpc']['inputSchema']>>;
export type AdminQueueJobsOutput = v.InferOutput<NonNullable<typeof adminQueueJobsContract['~orpc']['outputSchema']>>;
