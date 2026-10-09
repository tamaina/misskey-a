/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';

export const adminQueueRetryJobErrors = {} as const;

const requestName = 'admin/queue/retry-job';
export const adminQueueRetryJobContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({ queue: v.picklist(QUEUE_TYPES), jobId: v.string() })).output(v.void());

export type AdminQueueRetryJobInput = v.InferOutput<NonNullable<typeof adminQueueRetryJobContract['~orpc']['inputSchema']>>;
export type AdminQueueRetryJobOutput = v.InferOutput<NonNullable<typeof adminQueueRetryJobContract['~orpc']['outputSchema']>>;
