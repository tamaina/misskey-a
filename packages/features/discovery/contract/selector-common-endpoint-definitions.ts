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

export const allOfNotesSearchByTagSelector = jsonSelectorUnion([
	jsonObject({
		tag: jsonString({ "minLength": 1 }),
	}),
	jsonObject({
		query: v.pipe(v.pipe(v.array(v.pipe(v.array(jsonString({ "minLength": 1 })), v.minLength(1))), v.minLength(1)), v.metadata({ "description": "The outer arrays are chained with OR, the inner arrays are chained with AND." })),
	}),
]);
export const allOfNotesSearchByTagCommon = jsonObject({
	reply: v.optional(v.nullable(v.boolean()), null),
	renote: v.optional(v.nullable(v.boolean()), null),
	withFiles: v.optional(v.pipe(v.boolean(), v.metadata({ "description": "Only show notes that have attached files." })), false),
	poll: v.optional(v.nullable(v.boolean()), null),
	sinceId: v.optional(misskeyId),
	untilId: v.optional(misskeyId),
	sinceDate: v.optional(v.pipe(jsonNumber, v.integer())),
	untilDate: v.optional(v.pipe(jsonNumber, v.integer())),
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
});
export const allOfNotesSearchByTagInput = jsonSelectorAndCommon(allOfNotesSearchByTagSelector, allOfNotesSearchByTagCommon);
export const allOfNotesSearchByTagOutput = v.array(packedReference('Note'));
export const allOfNotesSearchByTagDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/search-by-tag', tags: ["notes", "hashtags"] },
	allOfNotesSearchByTagInput,
	allOfNotesSearchByTagOutput,
);

export const allOfUsersSearchByUsernameAndHostSelector = jsonSelectorUnion([
	jsonObject({
		username: v.nullable(v.string()),
	}),
	jsonObject({
		host: v.nullable(v.string()),
	}),
]);
export const allOfUsersSearchByUsernameAndHostCommon = jsonObject({
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
	detail: v.optional(v.boolean(), true),
});
export const allOfUsersSearchByUsernameAndHostInput = jsonSelectorAndCommon(allOfUsersSearchByUsernameAndHostSelector, allOfUsersSearchByUsernameAndHostCommon);
export const allOfUsersSearchByUsernameAndHostOutput = v.array(packedReference('User'));
export const allOfUsersSearchByUsernameAndHostDefinition = defineEndpointContract(
	{ method: 'POST', path: '/users/search-by-username-and-host', tags: ["users"] },
	allOfUsersSearchByUsernameAndHostInput,
	allOfUsersSearchByUsernameAndHostOutput,
);

export const selectorCommonEndpointDefinitions = {
	'notes/search-by-tag': allOfNotesSearchByTagDefinition,
	'users/search-by-username-and-host': allOfUsersSearchByUsernameAndHostDefinition,
} as const;

export const selectorCommonEndpointContracts = {
	'notes/search-by-tag': allOfNotesSearchByTagDefinition.contract,
	'users/search-by-username-and-host': allOfUsersSearchByUsernameAndHostDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorCommonEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorCommonEndpointContracts>;
export type SelectorCommonEndpoints = {
	[K in keyof typeof selectorCommonEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
