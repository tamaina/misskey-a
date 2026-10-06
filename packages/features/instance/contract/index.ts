/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';

import { objectParams } from '../../api/contract/index.js';
export { objectParams };

export const pingResult = v.object({ pong: v.number() });
export const onlineUsersCountResult = v.object({ count: v.number() });
export const serverInfoResult = v.object({
	machine: v.string(),
	cpu: v.object({ model: v.string(), cores: v.number() }),
	mem: v.object({ total: v.number() }),
	fs: v.object({ total: v.number(), used: v.number() }),
});
export const endpointsResult = v.array(v.string());
export const endpointInput = v.object({ endpoint: v.string() });
export const endpointResult = v.nullable(v.object({
	params: v.array(v.object({
		name: v.string(),
		type: v.string(),
	})),
}));

export const instanceContract = {
	ping: oc.route({ method: 'POST', path: '/ping', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(pingResult),
	'get-online-users-count': oc.route({ method: 'POST', path: '/get-online-users-count', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(onlineUsersCountResult),
	'server-info': oc.route({ method: 'POST', path: '/server-info', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(serverInfoResult),
	endpoints: oc.route({ method: 'POST', path: '/endpoints', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(endpointsResult),
	endpoint: oc.route({ method: 'POST', path: '/endpoint', tags: ['meta'] })
		.input(endpointInput)
		.output(endpointResult),
};

type Inputs = InferContractRouterInputs<typeof instanceContract>;
type Outputs = InferContractRouterOutputs<typeof instanceContract>;
export type InstanceEndpoints = {
	[K in keyof typeof instanceContract]: { req: Inputs[K]; res: Outputs[K] };
};
