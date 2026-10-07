/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { QUEUE_TYPES } from '../../runtime/shared/queue-types.js';

export const referenceAdminQueueShowJobInput = jsonObject({
	"queue": v.picklist(QUEUE_TYPES),
	"jobId": v.string(),
});
export const referenceAdminQueueShowJobOutput = packedReference("QueueJob", { legacyOutputType: 'omit' });
export const referenceAdminQueueShowJobDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/queue/show-job", tags: ["admin"] },
	referenceAdminQueueShowJobInput,
	referenceAdminQueueShowJobOutput,
);

export const referenceAdminQueueJobsInput = jsonObject({
	"queue": v.picklist(QUEUE_TYPES),
	"state": v.array(v.picklist(["active", "wait", "delayed", "completed", "failed"])),
	"search": v.exactOptional(v.string()),
});
export const referenceAdminQueueJobsOutput = v.array(packedReference("QueueJob", { legacyOutputType: 'omit' }));
export const referenceAdminQueueJobsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/queue/jobs", tags: ["admin"] },
	referenceAdminQueueJobsInput,
	referenceAdminQueueJobsOutput,
);

export const referenceAdminQueueQueuesInput = jsonObject({});
export const referenceAdminQueueQueuesOutput = v.array(v.strictObject({
		"name": v.picklist(QUEUE_TYPES),
		"counts": v.record(v.string(), v.number()),
		"isPaused": v.boolean(),
		"metrics": v.strictObject({
			"completed": packedReference("QueueMetrics", { legacyOutputType: 'omit' }),
			"failed": packedReference("QueueMetrics", { legacyOutputType: 'omit' }),
		}),
	}));
export const referenceAdminQueueQueuesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/queue/queues", tags: ["admin"] },
	referenceAdminQueueQueuesInput,
	referenceAdminQueueQueuesOutput,
);

export const referenceAdminQueueQueueStatsInput = jsonObject({
	"queue": v.picklist(QUEUE_TYPES),
});
export const referenceAdminQueueQueueStatsOutput = v.strictObject({
	"name": v.picklist(QUEUE_TYPES),
	"qualifiedName": v.string(),
	"counts": v.record(v.string(), v.number()),
	"isPaused": v.boolean(),
	"metrics": v.strictObject({
		"completed": packedReference("QueueMetrics", { legacyOutputType: 'omit' }),
		"failed": packedReference("QueueMetrics", { legacyOutputType: 'omit' }),
	}),
	"db": v.strictObject({
		"version": v.string(),
		"mode": v.picklist(["cluster", "standalone", "sentinel"]),
		"runId": v.string(),
		"processId": v.string(),
		"port": v.number(),
		"os": v.string(),
		"uptime": v.number(),
		"memory": v.strictObject({
			"total": v.number(),
			"used": v.number(),
			"fragmentationRatio": v.number(),
			"peak": v.number(),
		}),
		"clients": v.strictObject({
			"blocked": v.number(),
			"connected": v.number(),
		}),
	}),
});
export const referenceAdminQueueQueueStatsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/queue/queue-stats", tags: ["admin"] },
	referenceAdminQueueQueueStatsInput,
	referenceAdminQueueQueueStatsOutput,
);

export const referenceEndpointDefinitions = {
	"admin/queue/show-job": referenceAdminQueueShowJobDefinition,
	"admin/queue/jobs": referenceAdminQueueJobsDefinition,
	"admin/queue/queues": referenceAdminQueueQueuesDefinition,
	"admin/queue/queue-stats": referenceAdminQueueQueueStatsDefinition,
} as const;

export const referenceEndpointContracts = {
	"admin/queue/show-job": referenceAdminQueueShowJobDefinition.contract,
	"admin/queue/jobs": referenceAdminQueueJobsDefinition.contract,
	"admin/queue/queues": referenceAdminQueueQueuesDefinition.contract,
	"admin/queue/queue-stats": referenceAdminQueueQueueStatsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof referenceEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof referenceEndpointContracts>;
export type ReferenceEndpoints = {
	[K in keyof typeof referenceEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
