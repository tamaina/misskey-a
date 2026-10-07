/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { legacyOutputOneOf } from '../../api/contract/legacy-output-one-of.js';
import { misskeyIdOrIds } from '../../api/contract/misskey-id-or-ids.js';
import { resultObject } from '../../api/contract/result-object.js';

export const unionUsersRelationInput = jsonObject({ userId: misskeyIdOrIds() });
export const unionUsersRelationModel = resultObject({
	id: v.pipe(v.string(), v.metadata({ format: 'id' })),
	isFollowing: v.boolean(),
	hasPendingFollowRequestFromYou: v.boolean(),
	hasPendingFollowRequestToYou: v.boolean(),
	isFollowed: v.boolean(),
	isBlocking: v.boolean(),
	isBlocked: v.boolean(),
	isMuted: v.boolean(),
	isRenoteMuted: v.boolean(),
});
export const unionUsersRelationOutput = legacyOutputOneOf([
	unionUsersRelationModel,
	v.array(unionUsersRelationModel),
]);
export const unionUsersRelationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/relation', tags: ['users'] },
	unionUsersRelationInput,
	unionUsersRelationOutput,
);

export const unionEndpointDefinitions = { 'users/relation': unionUsersRelationDefinition } as const;
export const unionEndpointContracts = { 'users/relation': unionUsersRelationDefinition.contract } as const;

type Inputs = InferContractRouterInputs<typeof unionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof unionEndpointContracts>;
export type UnionEndpoints = {
	[K in keyof typeof unionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
