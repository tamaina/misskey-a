/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { resultObject } from '../../api/contract/result-object.js';
import { misskeyId } from '../../api/contract/index.js';

export const compositionUsersListsShowInput = jsonObject({
	listId: misskeyId,
	forPublic: v.optional(v.boolean(), false),
});
export const compositionUsersListsShowOutput = v.pipe(v.intersect([
	packedReference('UserList'),
	resultObject({
		likedCount: v.exactOptional(v.number()),
		isLiked: v.exactOptional(v.boolean()),
	}),
]), v.metadata({ type: 'object' }));
export const compositionUsersListsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/lists/show', tags: ["lists", "account"] },
	compositionUsersListsShowInput,
	compositionUsersListsShowOutput,
);

export const outputCompositionEndpointDefinitions = {
	'users/lists/show': compositionUsersListsShowDefinition,
} as const;

export const outputCompositionEndpointContracts = {
	'users/lists/show': compositionUsersListsShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof outputCompositionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof outputCompositionEndpointContracts>;
export type OutputCompositionEndpoints = {
	[K in keyof typeof outputCompositionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
