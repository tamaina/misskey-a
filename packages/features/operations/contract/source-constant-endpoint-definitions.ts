/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonObject } from '../../api/contract/json-object.js';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { QUEUE_TYPES } from '../../runtime/shared/queue-types.js';

export const constantAdminQueueShowJobLogsInput = jsonObject({
	"queue": v.picklist(QUEUE_TYPES),
	"jobId": v.string(),
});
export const constantAdminQueueShowJobLogsOutput = v.array(v.string());
export const constantAdminQueueShowJobLogsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/queue/show-job-logs", tags: ["admin"] },
	constantAdminQueueShowJobLogsInput,
	constantAdminQueueShowJobLogsOutput,
);

export const sourceConstantEndpointDefinitions = {
	"admin/queue/show-job-logs": constantAdminQueueShowJobLogsDefinition,
} as const;

export const sourceConstantEndpointContracts = {
	"admin/queue/show-job-logs": constantAdminQueueShowJobLogsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof sourceConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof sourceConstantEndpointContracts>;
export type SourceConstantEndpoints = {
	[K in keyof typeof sourceConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
