/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonSelectorUnion, jsonSelectorAndCommon } from '../../api/contract/json-selector-and-common.js';
import { uniqueStringArray } from '../../api/contract/unique-string-array.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { legacyOutputOneOf } from '../../api/contract/legacy-output-one-of.js';

export const usersShowSelector = jsonSelectorUnion([
	jsonObject({ userId: misskeyId }),
	jsonObject({ userIds: uniqueStringArray(misskeyId) }),
	jsonObject({ username: v.string() }),
]);
export const usersShowCommon = jsonObject({
	host: v.optional(v.pipe(v.nullable(v.string()), v.description("The local host is represented with `null`."))),
});
export const usersShowInput = jsonSelectorAndCommon(usersShowSelector, usersShowCommon);
export const usersShowOutput = legacyOutputOneOf([
	packedReference('UserDetailed'),
	v.array(packedReference('UserDetailed')),
]);
export const usersShowDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/show', tags: ['users'] },
	usersShowInput,
	usersShowOutput,
);

export const usersShowContracts = { 'users/show': usersShowDefinition.contract } as const;
type Inputs = InferContractRouterInputs<typeof usersShowContracts>;
type Outputs = InferContractRouterOutputs<typeof usersShowContracts>;
export type UsersShowEndpoints = {
	[K in keyof typeof usersShowContracts]: { req: Inputs[K]; res: Outputs[K] };
};
