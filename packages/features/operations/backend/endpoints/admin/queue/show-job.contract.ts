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

export const adminQueueShowJobErrors = {} as const;

const requestName = 'admin/queue/show-job';
export const adminQueueShowJobContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"queue": v.picklist(QUEUE_TYPES),
		"jobId": v.string(),
	})).output(queueJobSchema);

export type AdminQueueShowJobInput = v.InferOutput<NonNullable<typeof adminQueueShowJobContract['~orpc']['inputSchema']>>;
export type AdminQueueShowJobOutput = v.InferOutput<NonNullable<typeof adminQueueShowJobContract['~orpc']['outputSchema']>>;
