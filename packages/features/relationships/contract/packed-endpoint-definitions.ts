/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedBlockingCreateInput = v.looseObject({
	"userId": misskeyId,
});
export const packedBlockingCreateOutput = packedReference("UserDetailedNotMe");
export const packedBlockingCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/blocking/create", tags: ["account"] },
	packedBlockingCreateInput,
	packedBlockingCreateOutput,
);

export const packedBlockingDeleteInput = v.looseObject({
	"userId": misskeyId,
});
export const packedBlockingDeleteOutput = packedReference("UserDetailedNotMe");
export const packedBlockingDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/blocking/delete", tags: ["account"] },
	packedBlockingDeleteInput,
	packedBlockingDeleteOutput,
);

export const packedBlockingListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedBlockingListOutput = v.array(packedReference("Blocking"));
export const packedBlockingListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/blocking/list", tags: ["account"] },
	packedBlockingListInput,
	packedBlockingListOutput,
);

export const packedFollowingCreateInput = v.looseObject({
	"userId": misskeyId,
	"withReplies": v.exactOptional(v.boolean()),
});
export const packedFollowingCreateOutput = packedReference("UserLite");
export const packedFollowingCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/create", tags: ["following", "users"] },
	packedFollowingCreateInput,
	packedFollowingCreateOutput,
);

export const packedFollowingDeleteInput = v.looseObject({
	"userId": misskeyId,
});
export const packedFollowingDeleteOutput = packedReference("UserLite");
export const packedFollowingDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/delete", tags: ["following", "users"] },
	packedFollowingDeleteInput,
	packedFollowingDeleteOutput,
);

export const packedFollowingInvalidateInput = v.looseObject({
	"userId": misskeyId,
});
export const packedFollowingInvalidateOutput = packedReference("UserLite");
export const packedFollowingInvalidateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/invalidate", tags: ["following", "users"] },
	packedFollowingInvalidateInput,
	packedFollowingInvalidateOutput,
);

export const packedFollowingListInput = v.looseObject({
	"notification": v.optional(v.boolean(), false),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFollowingListOutput = v.array(packedReference("Following"));
export const packedFollowingListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/list", tags: ["users"] },
	packedFollowingListInput,
	packedFollowingListOutput,
);

export const packedFollowingRequestsCancelInput = v.looseObject({
	"userId": misskeyId,
});
export const packedFollowingRequestsCancelOutput = packedReference("UserLite");
export const packedFollowingRequestsCancelDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/requests/cancel", tags: ["following", "account"] },
	packedFollowingRequestsCancelInput,
	packedFollowingRequestsCancelOutput,
);

export const packedFollowingRequestsListInput = v.looseObject({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFollowingRequestsListOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"follower": packedReference("UserLite"),
		"followee": packedReference("UserLite"),
	}));
export const packedFollowingRequestsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/requests/list", tags: ["following", "account"] },
	packedFollowingRequestsListInput,
	packedFollowingRequestsListOutput,
);

export const packedFollowingRequestsSentInput = v.looseObject({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFollowingRequestsSentOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"follower": packedReference("UserLite"),
		"followee": packedReference("UserLite"),
	}));
export const packedFollowingRequestsSentDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/requests/sent", tags: ["following", "account"] },
	packedFollowingRequestsSentInput,
	packedFollowingRequestsSentOutput,
);

export const packedFollowingUpdateInput = v.looseObject({
	"userId": misskeyId,
	"notify": v.exactOptional(v.picklist(["normal", "none"])),
	"withReplies": v.exactOptional(v.boolean()),
});
export const packedFollowingUpdateOutput = packedReference("UserLite");
export const packedFollowingUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/update", tags: ["following", "users"] },
	packedFollowingUpdateInput,
	packedFollowingUpdateOutput,
);

export const packedMuteListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedMuteListOutput = v.array(packedReference("Muting"));
export const packedMuteListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/mute/list", tags: ["account"] },
	packedMuteListInput,
	packedMuteListOutput,
);

export const packedRenoteMuteListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedRenoteMuteListOutput = v.array(packedReference("RenoteMuting"));
export const packedRenoteMuteListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/renote-mute/list", tags: ["account"] },
	packedRenoteMuteListInput,
	packedRenoteMuteListOutput,
);

export const packedUsersListsCreateInput = v.looseObject({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
});
export const packedUsersListsCreateOutput = packedReference("UserList");
export const packedUsersListsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/lists/create", tags: ["lists"] },
	packedUsersListsCreateInput,
	packedUsersListsCreateOutput,
);

export const packedUsersListsCreateFromPublicInput = v.looseObject({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"listId": misskeyId,
});
export const packedUsersListsCreateFromPublicOutput = packedReference("UserList");
export const packedUsersListsCreateFromPublicDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/lists/create-from-public" },
	packedUsersListsCreateFromPublicInput,
	packedUsersListsCreateFromPublicOutput,
);

export const packedUsersListsGetMembershipsInput = v.looseObject({
	"listId": misskeyId,
	"forPublic": v.optional(v.boolean(), false),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersListsGetMembershipsOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"userId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"user": packedReference("UserLite"),
		"withReplies": v.boolean(),
	}));
export const packedUsersListsGetMembershipsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/lists/get-memberships", tags: ["lists", "account"] },
	packedUsersListsGetMembershipsInput,
	packedUsersListsGetMembershipsOutput,
);

export const packedUsersListsListInput = v.looseObject({
	"userId": v.exactOptional(misskeyId),
});
export const packedUsersListsListOutput = v.array(packedReference("UserList"));
export const packedUsersListsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/lists/list", tags: ["lists", "account"] },
	packedUsersListsListInput,
	packedUsersListsListOutput,
);

export const packedUsersListsUpdateInput = v.looseObject({
	"listId": misskeyId,
	"name": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 100 })),
	"isPublic": v.exactOptional(v.boolean()),
});
export const packedUsersListsUpdateOutput = packedReference("UserList");
export const packedUsersListsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/lists/update", tags: ["lists"] },
	packedUsersListsUpdateInput,
	packedUsersListsUpdateOutput,
);

export const packedEndpointDefinitions = {
	"blocking/create": packedBlockingCreateDefinition,
	"blocking/delete": packedBlockingDeleteDefinition,
	"blocking/list": packedBlockingListDefinition,
	"following/create": packedFollowingCreateDefinition,
	"following/delete": packedFollowingDeleteDefinition,
	"following/invalidate": packedFollowingInvalidateDefinition,
	"following/list": packedFollowingListDefinition,
	"following/requests/cancel": packedFollowingRequestsCancelDefinition,
	"following/requests/list": packedFollowingRequestsListDefinition,
	"following/requests/sent": packedFollowingRequestsSentDefinition,
	"following/update": packedFollowingUpdateDefinition,
	"mute/list": packedMuteListDefinition,
	"renote-mute/list": packedRenoteMuteListDefinition,
	"users/lists/create": packedUsersListsCreateDefinition,
	"users/lists/create-from-public": packedUsersListsCreateFromPublicDefinition,
	"users/lists/get-memberships": packedUsersListsGetMembershipsDefinition,
	"users/lists/list": packedUsersListsListDefinition,
	"users/lists/update": packedUsersListsUpdateDefinition,
} as const;

export const packedEndpointContracts = {
	"blocking/create": packedBlockingCreateDefinition.contract,
	"blocking/delete": packedBlockingDeleteDefinition.contract,
	"blocking/list": packedBlockingListDefinition.contract,
	"following/create": packedFollowingCreateDefinition.contract,
	"following/delete": packedFollowingDeleteDefinition.contract,
	"following/invalidate": packedFollowingInvalidateDefinition.contract,
	"following/list": packedFollowingListDefinition.contract,
	"following/requests/cancel": packedFollowingRequestsCancelDefinition.contract,
	"following/requests/list": packedFollowingRequestsListDefinition.contract,
	"following/requests/sent": packedFollowingRequestsSentDefinition.contract,
	"following/update": packedFollowingUpdateDefinition.contract,
	"mute/list": packedMuteListDefinition.contract,
	"renote-mute/list": packedRenoteMuteListDefinition.contract,
	"users/lists/create": packedUsersListsCreateDefinition.contract,
	"users/lists/create-from-public": packedUsersListsCreateFromPublicDefinition.contract,
	"users/lists/get-memberships": packedUsersListsGetMembershipsDefinition.contract,
	"users/lists/list": packedUsersListsListDefinition.contract,
	"users/lists/update": packedUsersListsUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
