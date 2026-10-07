/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedChannelsCreateInput = v.looseObject({
	"name": jsonString({ "minLength": 1, "maxLength": 128 }),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
	"bannerId": v.exactOptional(v.nullable(misskeyId)),
	"color": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 16 })),
	"isSensitive": v.exactOptional(v.nullable(v.boolean())),
	"allowRenoteToExternal": v.exactOptional(v.nullable(v.boolean())),
});
export const packedChannelsCreateOutput = packedReference("Channel");
export const packedChannelsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/create", tags: ["channels"] },
	packedChannelsCreateInput,
	packedChannelsCreateOutput,
);

export const packedChannelsFeaturedInput = v.looseObject({});
export const packedChannelsFeaturedOutput = v.array(packedReference("Channel"));
export const packedChannelsFeaturedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/featured", tags: ["channels"] },
	packedChannelsFeaturedInput,
	packedChannelsFeaturedOutput,
);

export const packedChannelsFollowedInput = v.looseObject({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const packedChannelsFollowedOutput = v.array(packedReference("Channel"));
export const packedChannelsFollowedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/followed", tags: ["channels", "account"] },
	packedChannelsFollowedInput,
	packedChannelsFollowedOutput,
);

export const packedChannelsMuteListInput = v.looseObject({});
export const packedChannelsMuteListOutput = v.array(packedReference("Channel"));
export const packedChannelsMuteListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/mute/list", tags: ["channels", "mute"] },
	packedChannelsMuteListInput,
	packedChannelsMuteListOutput,
);

export const packedChannelsMyFavoritesInput = v.looseObject({});
export const packedChannelsMyFavoritesOutput = v.array(packedReference("Channel"));
export const packedChannelsMyFavoritesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/my-favorites", tags: ["channels", "account"] },
	packedChannelsMyFavoritesInput,
	packedChannelsMyFavoritesOutput,
);

export const packedChannelsOwnedInput = v.looseObject({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const packedChannelsOwnedOutput = v.array(packedReference("Channel"));
export const packedChannelsOwnedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/owned", tags: ["channels", "account"] },
	packedChannelsOwnedInput,
	packedChannelsOwnedOutput,
);

export const packedChannelsSearchInput = v.looseObject({
	"query": v.string(),
	"type": v.optional(v.picklist(["nameAndDescription", "nameOnly"]), "nameAndDescription"),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const packedChannelsSearchOutput = v.array(packedReference("Channel"));
export const packedChannelsSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/search", tags: ["channels"] },
	packedChannelsSearchInput,
	packedChannelsSearchOutput,
);

export const packedChannelsShowInput = v.looseObject({
	"channelId": misskeyId,
});
export const packedChannelsShowOutput = packedReference("Channel");
export const packedChannelsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/show", tags: ["channels"] },
	packedChannelsShowInput,
	packedChannelsShowOutput,
);

export const packedChannelsTimelineInput = v.looseObject({
	"channelId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
});
export const packedChannelsTimelineOutput = v.array(packedReference("Note"));
export const packedChannelsTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/timeline", tags: ["notes", "channels"] },
	packedChannelsTimelineInput,
	packedChannelsTimelineOutput,
);

export const packedChannelsUpdateInput = v.looseObject({
	"channelId": misskeyId,
	"name": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 128 })),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
	"bannerId": v.exactOptional(v.nullable(misskeyId)),
	"isArchived": v.exactOptional(v.nullable(v.boolean())),
	"pinnedNoteIds": v.exactOptional(v.array(misskeyId)),
	"color": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 16 })),
	"isSensitive": v.exactOptional(v.nullable(v.boolean())),
	"allowRenoteToExternal": v.exactOptional(v.nullable(v.boolean())),
});
export const packedChannelsUpdateOutput = packedReference("Channel");
export const packedChannelsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/channels/update", tags: ["channels"] },
	packedChannelsUpdateInput,
	packedChannelsUpdateOutput,
);

export const packedEndpointDefinitions = {
	"channels/create": packedChannelsCreateDefinition,
	"channels/featured": packedChannelsFeaturedDefinition,
	"channels/followed": packedChannelsFollowedDefinition,
	"channels/mute/list": packedChannelsMuteListDefinition,
	"channels/my-favorites": packedChannelsMyFavoritesDefinition,
	"channels/owned": packedChannelsOwnedDefinition,
	"channels/search": packedChannelsSearchDefinition,
	"channels/show": packedChannelsShowDefinition,
	"channels/timeline": packedChannelsTimelineDefinition,
	"channels/update": packedChannelsUpdateDefinition,
} as const;

export const packedEndpointContracts = {
	"channels/create": packedChannelsCreateDefinition.contract,
	"channels/featured": packedChannelsFeaturedDefinition.contract,
	"channels/followed": packedChannelsFollowedDefinition.contract,
	"channels/mute/list": packedChannelsMuteListDefinition.contract,
	"channels/my-favorites": packedChannelsMyFavoritesDefinition.contract,
	"channels/owned": packedChannelsOwnedDefinition.contract,
	"channels/search": packedChannelsSearchDefinition.contract,
	"channels/show": packedChannelsShowDefinition.contract,
	"channels/timeline": packedChannelsTimelineDefinition.contract,
	"channels/update": packedChannelsUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
