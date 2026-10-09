/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';
import { queueCounterSchema, finiteNumber, queueMetricsSchema } from '../../../queue.schema.js';

export const adminQueueQueueStatsInput = objectInput({
	"queue": v.picklist(QUEUE_TYPES),
});
export const adminQueueQueueStatsOutput = v.strictObject({
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
});
export const adminQueueQueueStatsErrors = {} as const;

const requestName = 'admin/queue/queue-stats';
export const adminQueueQueueStatsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueQueueStatsInput).output(adminQueueQueueStatsOutput);
