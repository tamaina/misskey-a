/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES, queueCounterSchema, finiteNumber, queueMetricsSchema } from '../../../queue.schema.js';

export const adminQueueQueueStatsErrors = {} as const;

const requestName = 'admin/queue/queue-stats';
export const adminQueueQueueStatsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"queue": v.picklist(QUEUE_TYPES),
	})).output(v.strictObject({
		"name": v.picklist(QUEUE_TYPES),
		"qualifiedName": v.string(),
		"counts": queueCounterSchema,
		"isPaused": v.boolean(),
		"metrics": v.strictObject({
			"completed": queueMetricsSchema,
			"failed": queueMetricsSchema,
		}),
		"db": v.strictObject({
			"version": v.string(),
			"mode": v.picklist(["cluster", "standalone", "sentinel"]),
			"runId": v.string(),
			"processId": v.string(),
			"port": finiteNumber,
			"os": v.string(),
			"uptime": finiteNumber,
			"memory": v.strictObject({
				"total": finiteNumber,
				"used": finiteNumber,
				"fragmentationRatio": finiteNumber,
				"peak": finiteNumber,
			}),
			"clients": v.strictObject({
				"blocked": finiteNumber,
				"connected": finiteNumber,
			}),
		}),
	}));

export type AdminQueueQueueStatsInput = v.InferOutput<NonNullable<typeof adminQueueQueueStatsContract['~orpc']['inputSchema']>>;
export type AdminQueueQueueStatsOutput = v.InferOutput<NonNullable<typeof adminQueueQueueStatsContract['~orpc']['outputSchema']>>;
