/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const selectorPagesShowInput = v.union([
	jsonObject({
		pageId: misskeyId,
	}),
	jsonObject({
		name: v.string(),
		username: v.string(),
	}),
]);
export const selectorPagesShowOutput = packedReference('Page');
export const selectorPagesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: '/pages/show', tags: ["pages"] },
	selectorPagesShowInput,
	selectorPagesShowOutput,
);

export const selectorEndpointDefinitions = {
	'pages/show': selectorPagesShowDefinition,
} as const;

export const selectorEndpointContracts = {
	'pages/show': selectorPagesShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorEndpointContracts>;
export type SelectorEndpoints = {
	[K in keyof typeof selectorEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
