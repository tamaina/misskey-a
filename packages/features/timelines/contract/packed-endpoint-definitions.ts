/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAntennasCreateInput = v.object({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"src": v.picklist(["home", "all", "users", "list", "users_blacklist"]),
	"userListId": v.exactOptional(v.nullable(misskeyId)),
	"keywords": v.array(v.array(v.string())),
	"excludeKeywords": v.array(v.array(v.string())),
	"users": v.array(v.string()),
	"caseSensitive": v.boolean(),
	"localOnly": v.exactOptional(v.boolean()),
	"excludeBots": v.exactOptional(v.boolean()),
	"withReplies": v.boolean(),
	"withFile": v.boolean(),
	"excludeNotesInSensitiveChannel": v.exactOptional(v.boolean()),
});
export const packedAntennasCreateOutput = packedReference("Antenna");
export const packedAntennasCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/create", tags: ["antennas"] },
	packedAntennasCreateInput,
	packedAntennasCreateOutput,
);

export const packedAntennasListInput = v.object({});
export const packedAntennasListOutput = v.array(packedReference("Antenna"));
export const packedAntennasListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/list", tags: ["antennas", "account"] },
	packedAntennasListInput,
	packedAntennasListOutput,
);

export const packedAntennasNotesInput = v.object({
	"antennaId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedAntennasNotesOutput = v.array(packedReference("Note"));
export const packedAntennasNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/notes", tags: ["antennas", "account", "notes"] },
	packedAntennasNotesInput,
	packedAntennasNotesOutput,
);

export const packedAntennasShowInput = v.object({
	"antennaId": misskeyId,
});
export const packedAntennasShowOutput = packedReference("Antenna");
export const packedAntennasShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/show", tags: ["antennas", "account"] },
	packedAntennasShowInput,
	packedAntennasShowOutput,
);

export const packedAntennasUpdateInput = v.object({
	"antennaId": misskeyId,
	"name": v.exactOptional(jsonString({ "minLength": 1, "maxLength": 100 })),
	"src": v.exactOptional(v.picklist(["home", "all", "users", "list", "users_blacklist"])),
	"userListId": v.exactOptional(v.nullable(misskeyId)),
	"keywords": v.exactOptional(v.array(v.array(v.string()))),
	"excludeKeywords": v.exactOptional(v.array(v.array(v.string()))),
	"users": v.exactOptional(v.array(v.string())),
	"caseSensitive": v.exactOptional(v.boolean()),
	"localOnly": v.exactOptional(v.boolean()),
	"excludeBots": v.exactOptional(v.boolean()),
	"withReplies": v.exactOptional(v.boolean()),
	"withFile": v.exactOptional(v.boolean()),
	"excludeNotesInSensitiveChannel": v.exactOptional(v.boolean()),
});
export const packedAntennasUpdateOutput = packedReference("Antenna");
export const packedAntennasUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/update", tags: ["antennas"] },
	packedAntennasUpdateInput,
	packedAntennasUpdateOutput,
);

export const packedNotesGlobalTimelineInput = v.object({
	"withFiles": v.optional(v.boolean(), false),
	"withRenotes": v.optional(v.boolean(), true),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesGlobalTimelineOutput = v.array(packedReference("Note"));
export const packedNotesGlobalTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/global-timeline", tags: ["notes"] },
	packedNotesGlobalTimelineInput,
	packedNotesGlobalTimelineOutput,
);

export const packedNotesHybridTimelineInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
	"includeMyRenotes": v.optional(v.boolean(), true),
	"includeRenotedMyNotes": v.optional(v.boolean(), true),
	"includeLocalRenotes": v.optional(v.boolean(), true),
	"withFiles": v.optional(v.boolean(), false),
	"withRenotes": v.optional(v.boolean(), true),
	"withReplies": v.optional(v.boolean(), false),
});
export const packedNotesHybridTimelineOutput = v.array(packedReference("Note"));
export const packedNotesHybridTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/hybrid-timeline", tags: ["notes"] },
	packedNotesHybridTimelineInput,
	packedNotesHybridTimelineOutput,
);

export const packedNotesLocalTimelineInput = v.object({
	"withFiles": v.optional(v.boolean(), false),
	"withRenotes": v.optional(v.boolean(), true),
	"withReplies": v.optional(v.boolean(), false),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"allowPartial": v.optional(v.boolean(), false),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesLocalTimelineOutput = v.array(packedReference("Note"));
export const packedNotesLocalTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/local-timeline", tags: ["notes"] },
	packedNotesLocalTimelineInput,
	packedNotesLocalTimelineOutput,
);

export const packedNotesMentionsInput = v.object({
	"following": v.optional(v.boolean(), false),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"visibility": v.exactOptional(v.string()),
});
export const packedNotesMentionsOutput = v.array(packedReference("Note"));
export const packedNotesMentionsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/mentions", tags: ["notes"] },
	packedNotesMentionsInput,
	packedNotesMentionsOutput,
);

export const packedNotesTimelineInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
	"includeMyRenotes": v.optional(v.boolean(), true),
	"includeRenotedMyNotes": v.optional(v.boolean(), true),
	"includeLocalRenotes": v.optional(v.boolean(), true),
	"withFiles": v.optional(v.boolean(), false),
	"withRenotes": v.optional(v.boolean(), true),
});
export const packedNotesTimelineOutput = v.array(packedReference("Note"));
export const packedNotesTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/timeline", tags: ["notes"] },
	packedNotesTimelineInput,
	packedNotesTimelineOutput,
);

export const packedNotesUserListTimelineInput = v.object({
	"listId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
	"includeMyRenotes": v.optional(v.boolean(), true),
	"includeRenotedMyNotes": v.optional(v.boolean(), true),
	"includeLocalRenotes": v.optional(v.boolean(), true),
	"withRenotes": v.optional(v.boolean(), true),
	"withFiles": v.optional(v.pipe(v.boolean(), v.metadata({ "description": "Only show notes that have attached files." })), false),
});
export const packedNotesUserListTimelineOutput = v.array(packedReference("Note"));
export const packedNotesUserListTimelineDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/user-list-timeline", tags: ["notes", "lists"] },
	packedNotesUserListTimelineInput,
	packedNotesUserListTimelineOutput,
);

export const packedUsersNotesInput = v.object({
	"userId": misskeyId,
	"withReplies": v.optional(v.boolean(), false),
	"withRenotes": v.optional(v.boolean(), true),
	"withChannelNotes": v.optional(v.boolean(), false),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"allowPartial": v.optional(v.boolean(), false),
	"withFiles": v.optional(v.boolean(), false),
});
export const packedUsersNotesOutput = v.array(packedReference("Note"));
export const packedUsersNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/notes", tags: ["users", "notes"] },
	packedUsersNotesInput,
	packedUsersNotesOutput,
);

export const packedEndpointDefinitions = {
	"antennas/create": packedAntennasCreateDefinition,
	"antennas/list": packedAntennasListDefinition,
	"antennas/notes": packedAntennasNotesDefinition,
	"antennas/show": packedAntennasShowDefinition,
	"antennas/update": packedAntennasUpdateDefinition,
	"notes/global-timeline": packedNotesGlobalTimelineDefinition,
	"notes/hybrid-timeline": packedNotesHybridTimelineDefinition,
	"notes/local-timeline": packedNotesLocalTimelineDefinition,
	"notes/mentions": packedNotesMentionsDefinition,
	"notes/timeline": packedNotesTimelineDefinition,
	"notes/user-list-timeline": packedNotesUserListTimelineDefinition,
	"users/notes": packedUsersNotesDefinition,
} as const;

export const packedEndpointContracts = {
	"antennas/create": packedAntennasCreateDefinition.contract,
	"antennas/list": packedAntennasListDefinition.contract,
	"antennas/notes": packedAntennasNotesDefinition.contract,
	"antennas/show": packedAntennasShowDefinition.contract,
	"antennas/update": packedAntennasUpdateDefinition.contract,
	"notes/global-timeline": packedNotesGlobalTimelineDefinition.contract,
	"notes/hybrid-timeline": packedNotesHybridTimelineDefinition.contract,
	"notes/local-timeline": packedNotesLocalTimelineDefinition.contract,
	"notes/mentions": packedNotesMentionsDefinition.contract,
	"notes/timeline": packedNotesTimelineDefinition.contract,
	"notes/user-list-timeline": packedNotesUserListTimelineDefinition.contract,
	"users/notes": packedUsersNotesDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
