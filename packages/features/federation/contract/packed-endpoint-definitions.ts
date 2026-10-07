/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedFederationFollowersInput = v.looseObject({
	"host": v.string(),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFederationFollowersOutput = v.array(packedReference("Following"));
export const packedFederationFollowersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/followers", tags: ["federation"] },
	packedFederationFollowersInput,
	packedFederationFollowersOutput,
);

export const packedFederationFollowingInput = v.looseObject({
	"host": v.string(),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFederationFollowingOutput = v.array(packedReference("Following"));
export const packedFederationFollowingDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/following", tags: ["federation"] },
	packedFederationFollowingInput,
	packedFederationFollowingOutput,
);

export const packedFederationInstancesInput = v.looseObject({
	"host": v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Omit or use `null` to not filter by host." }))),
	"blocked": v.exactOptional(v.nullable(v.boolean())),
	"notResponding": v.exactOptional(v.nullable(v.boolean())),
	"suspended": v.exactOptional(v.nullable(v.boolean())),
	"silenced": v.exactOptional(v.nullable(v.boolean())),
	"federating": v.exactOptional(v.nullable(v.boolean())),
	"subscribing": v.exactOptional(v.nullable(v.boolean())),
	"publishing": v.exactOptional(v.nullable(v.boolean())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.exactOptional(v.pipe(v.nullable(v.picklist(["+pubSub", "-pubSub", "+notes", "-notes", "+users", "-users", "+following", "-following", "+followers", "-followers", "+firstRetrievedAt", "-firstRetrievedAt", "+latestRequestReceivedAt", "-latestRequestReceivedAt"])), v.metadata({ "enum": ["+pubSub", "-pubSub", "+notes", "-notes", "+users", "-users", "+following", "-following", "+followers", "-followers", "+firstRetrievedAt", "-firstRetrievedAt", "+latestRequestReceivedAt", "-latestRequestReceivedAt", null] }))),
});
export const packedFederationInstancesOutput = v.array(packedReference("FederationInstance"));
export const packedFederationInstancesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/instances", tags: ["federation"] },
	packedFederationInstancesInput,
	packedFederationInstancesOutput,
);

export const packedFederationShowInstanceInput = v.looseObject({
	"host": v.string(),
});
export const packedFederationShowInstanceOutput = v.nullable(packedReference("FederationInstance"));
export const packedFederationShowInstanceDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/show-instance", tags: ["federation"] },
	packedFederationShowInstanceInput,
	packedFederationShowInstanceOutput,
);

export const packedFederationStatsInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFederationStatsOutput = resultObject({
	"topSubInstances": v.array(packedReference("FederationInstance")),
	"otherFollowersCount": v.number(),
	"topPubInstances": v.array(packedReference("FederationInstance")),
	"otherFollowingCount": v.number(),
});
export const packedFederationStatsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/stats", tags: ["federation"] },
	packedFederationStatsInput,
	packedFederationStatsOutput,
);

export const packedFederationUsersInput = v.looseObject({
	"host": v.string(),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFederationUsersOutput = v.array(packedReference("UserDetailedNotMe"));
export const packedFederationUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/users", tags: ["federation"] },
	packedFederationUsersInput,
	packedFederationUsersOutput,
);

export const packedEndpointDefinitions = {
	"federation/followers": packedFederationFollowersDefinition,
	"federation/following": packedFederationFollowingDefinition,
	"federation/instances": packedFederationInstancesDefinition,
	"federation/show-instance": packedFederationShowInstanceDefinition,
	"federation/stats": packedFederationStatsDefinition,
	"federation/users": packedFederationUsersDefinition,
} as const;

export const packedEndpointContracts = {
	"federation/followers": packedFederationFollowersDefinition.contract,
	"federation/following": packedFederationFollowingDefinition.contract,
	"federation/instances": packedFederationInstancesDefinition.contract,
	"federation/show-instance": packedFederationShowInstanceDefinition.contract,
	"federation/stats": packedFederationStatsDefinition.contract,
	"federation/users": packedFederationUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
