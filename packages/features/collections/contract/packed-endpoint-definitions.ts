/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedClipsCreateInput = v.looseObject({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"isPublic": v.optional(v.boolean(), false),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
});
export const packedClipsCreateOutput = packedReference("Clip");
export const packedClipsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/create", tags: ["clips"] },
	packedClipsCreateInput,
	packedClipsCreateOutput,
);

export const packedClipsListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedClipsListOutput = v.array(packedReference("Clip"));
export const packedClipsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/list", tags: ["clips", "account"] },
	packedClipsListInput,
	packedClipsListOutput,
);

export const packedClipsMyFavoritesInput = v.looseObject({});
export const packedClipsMyFavoritesOutput = v.array(packedReference("Clip"));
export const packedClipsMyFavoritesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/my-favorites", tags: ["account", "clip"] },
	packedClipsMyFavoritesInput,
	packedClipsMyFavoritesOutput,
);

export const packedClipsNotesInput = v.looseObject({
	"clipId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"search": v.exactOptional(v.nullable(jsonString({ "minLength": 1, "maxLength": 100 }))),
});
export const packedClipsNotesOutput = v.array(packedReference("Note"));
export const packedClipsNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/notes", tags: ["account", "notes", "clips"] },
	packedClipsNotesInput,
	packedClipsNotesOutput,
);

export const packedClipsShowInput = v.looseObject({
	"clipId": misskeyId,
});
export const packedClipsShowOutput = packedReference("Clip");
export const packedClipsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/show", tags: ["clips", "account"] },
	packedClipsShowInput,
	packedClipsShowOutput,
);

export const packedClipsUpdateInput = v.looseObject({
	"clipId": misskeyId,
	"name": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 100 })),
	"isPublic": v.exactOptional(v.boolean()),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
});
export const packedClipsUpdateOutput = packedReference("Clip");
export const packedClipsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/update", tags: ["clips"] },
	packedClipsUpdateInput,
	packedClipsUpdateOutput,
);

export const packedIFavoritesInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIFavoritesOutput = v.array(packedReference("NoteFavorite"));
export const packedIFavoritesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/favorites", tags: ["account", "notes", "favorites"] },
	packedIFavoritesInput,
	packedIFavoritesOutput,
);

export const packedNotesClipsInput = v.looseObject({
	"noteId": misskeyId,
});
export const packedNotesClipsOutput = v.array(packedReference("Clip"));
export const packedNotesClipsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/clips", tags: ["clips", "notes"] },
	packedNotesClipsInput,
	packedNotesClipsOutput,
);

export const packedUsersClipsInput = v.looseObject({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersClipsOutput = v.array(packedReference("Clip"));
export const packedUsersClipsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/clips", tags: ["users", "clips"] },
	packedUsersClipsInput,
	packedUsersClipsOutput,
);

export const packedEndpointDefinitions = {
	"clips/create": packedClipsCreateDefinition,
	"clips/list": packedClipsListDefinition,
	"clips/my-favorites": packedClipsMyFavoritesDefinition,
	"clips/notes": packedClipsNotesDefinition,
	"clips/show": packedClipsShowDefinition,
	"clips/update": packedClipsUpdateDefinition,
	"i/favorites": packedIFavoritesDefinition,
	"notes/clips": packedNotesClipsDefinition,
	"users/clips": packedUsersClipsDefinition,
} as const;

export const packedEndpointContracts = {
	"clips/create": packedClipsCreateDefinition.contract,
	"clips/list": packedClipsListDefinition.contract,
	"clips/my-favorites": packedClipsMyFavoritesDefinition.contract,
	"clips/notes": packedClipsNotesDefinition.contract,
	"clips/show": packedClipsShowDefinition.contract,
	"clips/update": packedClipsUpdateDefinition.contract,
	"i/favorites": packedIFavoritesDefinition.contract,
	"notes/clips": packedNotesClipsDefinition.contract,
	"users/clips": packedUsersClipsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
