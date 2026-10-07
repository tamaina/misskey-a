/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const queueStatsInput = jsonObject({});
export const queueStatsOutput = v.strictObject({
	deliver: packedReference('QueueCount', { legacyOutputType: 'omit' }),
	inbox: packedReference('QueueCount', { legacyOutputType: 'omit' }),
	db: packedReference('QueueCount', { legacyOutputType: 'omit' }),
	objectStorage: packedReference('QueueCount', { legacyOutputType: 'omit' }),
});
export const queueStatsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/queue/stats', tags: ['admin'] },
	queueStatsInput,
	queueStatsOutput,
);
export const queueStatsEndpointContracts = {
	'admin/queue/stats': queueStatsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof queueStatsEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof queueStatsEndpointContracts>;
export type QueueStatsEndpoints = {
	[K in keyof typeof queueStatsEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
