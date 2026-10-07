/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { legacyOutputOneOf } from '../../api/contract/legacy-output-one-of.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const unionMetaInput = jsonObject({ detail: v.optional(v.boolean(), true) });
export const unionMetaOutput = legacyOutputOneOf([
	packedReference('MetaLite'),
	packedReference('MetaDetailed'),
], { legacyRootType: 'object' });
export const unionMetaDefinition = defineEndpointContract(
	{ method: 'POST', path: '/meta', tags: ['meta'] },
	unionMetaInput,
	unionMetaOutput,
);

export const unionEndpointDefinitions = { meta: unionMetaDefinition } as const;
export const unionEndpointContracts = { meta: unionMetaDefinition.contract } as const;

type Inputs = InferContractRouterInputs<typeof unionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof unionEndpointContracts>;
export type UnionEndpoints = {
	[K in keyof typeof unionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
