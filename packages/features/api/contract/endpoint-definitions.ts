/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineTestInput = v.looseObject({
	"required": v.boolean(),
	"string": v.exactOptional(v.string()),
	"default": v.optional(v.string(), "hello"),
	"nullableDefault": v.optional(v.nullable(v.string()), "hello"),
	"id": v.exactOptional(misskeyId),
});
export const inlineTestOutput = resultObject({
	"id": v.exactOptional(v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))),
	"required": v.boolean(),
	"string": v.exactOptional(v.string()),
	"default": v.exactOptional(v.string()),
	"nullableDefault": v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ "default": "hello" }))),
});
export const inlineTestDefinition = defineEndpointContract(
	{ method: 'POST', path: '/test', tags: ["non-productive"] },
	inlineTestInput,
	inlineTestOutput,
);

export const inlineEndpointDefinitions = {
	"test": inlineTestDefinition,
} as const;

export const inlineEndpointContracts = {
	"test": inlineTestDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
