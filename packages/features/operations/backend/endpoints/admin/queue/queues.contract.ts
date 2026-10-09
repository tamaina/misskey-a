/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES, queueCounterSchema, queueMetricsSchema } from '../../../queue.schema.js';

export const adminQueueQueuesErrors = {} as const;

const requestName = 'admin/queue/queues';
export const adminQueueQueuesContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.strictObject({
			"name": v.picklist(QUEUE_TYPES),
			"counts": queueCounterSchema,
			"isPaused": v.boolean(),
			"metrics": v.strictObject({
				"completed": queueMetricsSchema,
				"failed": queueMetricsSchema,
			}),
		})));

export type AdminQueueQueuesInput = v.InferOutput<NonNullable<typeof adminQueueQueuesContract['~orpc']['inputSchema']>>;
export type AdminQueueQueuesOutput = v.InferOutput<NonNullable<typeof adminQueueQueuesContract['~orpc']['outputSchema']>>;
