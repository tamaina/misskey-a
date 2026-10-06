/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';

// Match the existing JSON-object input semantics, including rejection of arrays.
export const pingParams = v.custom<Record<string, unknown>>(
	value => value !== null && typeof value === 'object' && !Array.isArray(value),
	'Expected a JSON object',
);
export const pingResult = v.object({ pong: v.number() });

export const instanceContract = {
	ping: oc.route({ method: 'POST', path: '/ping', tags: ['meta'] })
		.input(v.optional(pingParams, {}))
		.output(pingResult),
};

type Inputs = InferContractRouterInputs<typeof instanceContract>;
type Outputs = InferContractRouterOutputs<typeof instanceContract>;
export type InstanceEndpoints = {
	[K in keyof typeof instanceContract]: { req: Inputs[K]; res: Outputs[K] };
};
