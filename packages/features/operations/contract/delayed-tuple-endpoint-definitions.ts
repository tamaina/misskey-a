/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { legacyOutputTuple } from '../../api/contract/legacy-output-tuple.js';

// Map entries always contain both elements. The legacy document deliberately retains no minItems.
const delayedHostCount = legacyOutputTuple([v.string(), jsonNumber]);

export const delayedTupleAdminQueueDeliverDelayedInput = jsonObject({});
export const delayedTupleAdminQueueDeliverDelayedOutput = v.pipe(v.array(delayedHostCount), v.metadata({ example: [['example.com', 12]] }));
export const delayedTupleAdminQueueDeliverDelayedDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/queue/deliver-delayed', tags: ['admin'] },
	delayedTupleAdminQueueDeliverDelayedInput,
	delayedTupleAdminQueueDeliverDelayedOutput,
);

export const delayedTupleAdminQueueInboxDelayedInput = jsonObject({});
export const delayedTupleAdminQueueInboxDelayedOutput = v.pipe(v.array(delayedHostCount), v.metadata({ example: [['example.com', 12]] }));
export const delayedTupleAdminQueueInboxDelayedDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/queue/inbox-delayed', tags: ['admin'] },
	delayedTupleAdminQueueInboxDelayedInput,
	delayedTupleAdminQueueInboxDelayedOutput,
);

export const delayedTupleEndpointDefinitions = {
	'admin/queue/deliver-delayed': delayedTupleAdminQueueDeliverDelayedDefinition,
	'admin/queue/inbox-delayed': delayedTupleAdminQueueInboxDelayedDefinition,
} as const;

export const delayedTupleEndpointContracts = {
	'admin/queue/deliver-delayed': delayedTupleAdminQueueDeliverDelayedDefinition.contract,
	'admin/queue/inbox-delayed': delayedTupleAdminQueueInboxDelayedDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof delayedTupleEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof delayedTupleEndpointContracts>;
export type DelayedTupleEndpoints = {
	[K in keyof typeof delayedTupleEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
