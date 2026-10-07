/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonSelectorUnion, jsonSelectorAndCommon } from '../../api/contract/json-selector-and-common.js';
import { misskeyId, jsonString } from '../../api/contract/index.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { birthdaySchema } from '../../users/contract/user-birthday.js';

export const allOfUsersFollowersSelector = jsonSelectorUnion([
	jsonObject({
		userId: misskeyId,
	}),
	jsonObject({
		username: v.string(),
		host: v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })),
	}),
]);
export const allOfUsersFollowersCommon = jsonObject({
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(jsonNumber, v.integer())),
	untilDate: v.optional(v.pipe(jsonNumber, v.integer())),
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
});
export const allOfUsersFollowersInput = jsonSelectorAndCommon(allOfUsersFollowersSelector, allOfUsersFollowersCommon);
export const allOfUsersFollowersOutput = v.array(packedReference('Following'));
export const allOfUsersFollowersDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/followers', tags: ["users"] },
	allOfUsersFollowersInput,
	allOfUsersFollowersOutput,
);

export const allOfUsersFollowingSelector = jsonSelectorUnion([
	jsonObject({
		userId: misskeyId,
	}),
	jsonObject({
		username: v.string(),
		host: v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })),
	}),
]);
export const allOfUsersFollowingCommon = jsonObject({
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(jsonNumber, v.integer())),
	untilDate: v.optional(v.pipe(jsonNumber, v.integer())),
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
	birthday: v.optional(v.pipe(v.nullable(jsonString(birthdaySchema)), v.metadata({ "description": "@deprecated use get-following-users-by-birthday instead." }))),
});
export const allOfUsersFollowingInput = jsonSelectorAndCommon(allOfUsersFollowingSelector, allOfUsersFollowingCommon);
export const allOfUsersFollowingOutput = v.array(packedReference('Following'));
export const allOfUsersFollowingDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/following', tags: ["users"] },
	allOfUsersFollowingInput,
	allOfUsersFollowingOutput,
);

export const selectorCommonEndpointDefinitions = {
	'users/followers': allOfUsersFollowersDefinition,
	'users/following': allOfUsersFollowingDefinition,
} as const;

export const selectorCommonEndpointContracts = {
	'users/followers': allOfUsersFollowersDefinition.contract,
	'users/following': allOfUsersFollowingDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorCommonEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorCommonEndpointContracts>;
export type SelectorCommonEndpoints = {
	[K in keyof typeof selectorCommonEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
