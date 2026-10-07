/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonExclusiveObject } from '../../api/contract/json-exclusive-object.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

const date = jsonObject({
	month: v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(12)),
	day: v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(31)),
});
export const birthdayUsersInput = jsonObject({
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
	offset: v.optional(v.pipe(jsonNumber, v.integer()), 0),
	birthday: jsonExclusiveObject([date, jsonObject({ begin: date, end: date })]),
});
export const birthdayUsersOutput = v.array(resultObject({
	id: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })),
	birthday: v.string(),
	user: packedReference('UserLite'),
}));
export const birthdayUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/get-following-users-by-birthday', tags: ['users'] },
	birthdayUsersInput, birthdayUsersOutput,
);
export const birthdayEndpointDefinitions = { 'users/get-following-users-by-birthday': birthdayUsersDefinition } as const;
export const birthdayEndpointContracts = { 'users/get-following-users-by-birthday': birthdayUsersDefinition.contract } as const;
type Inputs = InferContractRouterInputs<typeof birthdayEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof birthdayEndpointContracts>;
export type BirthdayEndpoints = { [K in keyof typeof birthdayEndpointContracts]: { req: Inputs[K]; res: Outputs[K] } };
