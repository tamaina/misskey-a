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

export const packedHashtagsListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"attachedToUserOnly": v.optional(v.boolean(), false),
	"attachedToLocalUserOnly": v.optional(v.boolean(), false),
	"attachedToRemoteUserOnly": v.optional(v.boolean(), false),
	"sort": v.picklist(["+mentionedUsers", "-mentionedUsers", "+mentionedLocalUsers", "-mentionedLocalUsers", "+mentionedRemoteUsers", "-mentionedRemoteUsers", "+attachedUsers", "-attachedUsers", "+attachedLocalUsers", "-attachedLocalUsers", "+attachedRemoteUsers", "-attachedRemoteUsers"]),
});
export const packedHashtagsListOutput = v.array(packedReference("Hashtag"));
export const packedHashtagsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/hashtags/list", tags: ["hashtags"] },
	packedHashtagsListInput,
	packedHashtagsListOutput,
);

export const packedHashtagsShowInput = v.looseObject({
	"tag": v.string(),
});
export const packedHashtagsShowOutput = packedReference("Hashtag");
export const packedHashtagsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/hashtags/show", tags: ["hashtags"] },
	packedHashtagsShowInput,
	packedHashtagsShowOutput,
);

export const packedHashtagsUsersInput = v.looseObject({
	"tag": v.string(),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.picklist(["+follower", "-follower", "+createdAt", "-createdAt", "+updatedAt", "-updatedAt"]),
	"state": v.optional(v.picklist(["all", "alive"]), "all"),
	"origin": v.optional(v.picklist(["combined", "local", "remote"]), "local"),
});
export const packedHashtagsUsersOutput = v.array(packedReference("UserDetailed"));
export const packedHashtagsUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/hashtags/users", tags: ["hashtags", "users"] },
	packedHashtagsUsersInput,
	packedHashtagsUsersOutput,
);

export const packedNotesFeaturedInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"untilId": v.exactOptional(misskeyId),
	"channelId": v.exactOptional(v.nullable(misskeyId)),
});
export const packedNotesFeaturedOutput = v.array(packedReference("Note"));
export const packedNotesFeaturedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/featured", tags: ["notes"] },
	packedNotesFeaturedInput,
	packedNotesFeaturedOutput,
);

export const packedNotesSearchInput = v.looseObject({
	"query": v.string(),
	"rangeStartAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
	"rangeEndAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"host": v.exactOptional(v.pipe(v.string(), v.metadata({ "description": "The local host is represented with `.`." }))),
	"userId": v.optional(v.nullable(misskeyId), null),
	"channelId": v.optional(v.nullable(misskeyId), null),
});
export const packedNotesSearchOutput = v.array(packedReference("Note"));
export const packedNotesSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/search", tags: ["notes"] },
	packedNotesSearchInput,
	packedNotesSearchOutput,
);

export const packedUsersFeaturedNotesInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"untilId": v.exactOptional(misskeyId),
	"userId": misskeyId,
});
export const packedUsersFeaturedNotesOutput = v.array(packedReference("Note"));
export const packedUsersFeaturedNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/featured-notes", tags: ["notes"] },
	packedUsersFeaturedNotesInput,
	packedUsersFeaturedNotesOutput,
);

export const packedUsersGetFrequentlyRepliedUsersInput = v.looseObject({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedUsersGetFrequentlyRepliedUsersOutput = v.array(resultObject({
		"user": packedReference("UserDetailed"),
		"weight": v.number(),
	}));
export const packedUsersGetFrequentlyRepliedUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/get-frequently-replied-users", tags: ["users"] },
	packedUsersGetFrequentlyRepliedUsersInput,
	packedUsersGetFrequentlyRepliedUsersOutput,
);

export const packedUsersRecommendationInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const packedUsersRecommendationOutput = v.array(packedReference("UserDetailed"));
export const packedUsersRecommendationDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/recommendation", tags: ["users"] },
	packedUsersRecommendationInput,
	packedUsersRecommendationOutput,
);

export const packedUsersSearchInput = v.looseObject({
	"query": v.string(),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"origin": v.optional(v.picklist(["local", "remote", "combined"]), "combined"),
	"detail": v.optional(v.boolean(), true),
});
export const packedUsersSearchOutput = v.array(packedReference("User"));
export const packedUsersSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/search", tags: ["users"] },
	packedUsersSearchInput,
	packedUsersSearchOutput,
);

export const packedEndpointDefinitions = {
	"hashtags/list": packedHashtagsListDefinition,
	"hashtags/show": packedHashtagsShowDefinition,
	"hashtags/users": packedHashtagsUsersDefinition,
	"notes/featured": packedNotesFeaturedDefinition,
	"notes/search": packedNotesSearchDefinition,
	"users/featured-notes": packedUsersFeaturedNotesDefinition,
	"users/get-frequently-replied-users": packedUsersGetFrequentlyRepliedUsersDefinition,
	"users/recommendation": packedUsersRecommendationDefinition,
	"users/search": packedUsersSearchDefinition,
} as const;

export const packedEndpointContracts = {
	"hashtags/list": packedHashtagsListDefinition.contract,
	"hashtags/show": packedHashtagsShowDefinition.contract,
	"hashtags/users": packedHashtagsUsersDefinition.contract,
	"notes/featured": packedNotesFeaturedDefinition.contract,
	"notes/search": packedNotesSearchDefinition.contract,
	"users/featured-notes": packedUsersFeaturedNotesDefinition.contract,
	"users/get-frequently-replied-users": packedUsersGetFrequentlyRepliedUsersDefinition.contract,
	"users/recommendation": packedUsersRecommendationDefinition.contract,
	"users/search": packedUsersSearchDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
