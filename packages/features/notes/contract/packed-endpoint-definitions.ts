/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedIPinInput = v.object({
	"noteId": misskeyId,
});
export const packedIPinOutput = packedReference("MeDetailed");
export const packedIPinDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/pin", tags: ["account", "notes"] },
	packedIPinInput,
	packedIPinOutput,
);

export const packedIUnpinInput = v.object({
	"noteId": misskeyId,
});
export const packedIUnpinOutput = packedReference("MeDetailed");
export const packedIUnpinDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/unpin", tags: ["account", "notes"] },
	packedIUnpinInput,
	packedIUnpinOutput,
);

export const packedNotesInput = v.object({
	"local": v.optional(v.boolean(), false),
	"reply": v.exactOptional(v.boolean()),
	"renote": v.exactOptional(v.boolean()),
	"withFiles": v.exactOptional(v.boolean()),
	"poll": v.exactOptional(v.boolean()),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesOutput = v.array(packedReference("Note"));
export const packedNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes", tags: ["notes"] },
	packedNotesInput,
	packedNotesOutput,
);

export const packedNotesChildrenInput = v.object({
	"noteId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesChildrenOutput = v.array(packedReference("Note"));
export const packedNotesChildrenDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/children", tags: ["notes"] },
	packedNotesChildrenInput,
	packedNotesChildrenOutput,
);

export const packedNotesConversationInput = v.object({
	"noteId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const packedNotesConversationOutput = v.array(packedReference("Note"));
export const packedNotesConversationDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/conversation", tags: ["notes"] },
	packedNotesConversationInput,
	packedNotesConversationOutput,
);

export const packedNotesDraftsListInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"scheduled": v.exactOptional(v.nullable(v.boolean())),
});
export const packedNotesDraftsListOutput = v.array(packedReference("NoteDraft"));
export const packedNotesDraftsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/drafts/list", tags: ["notes", "drafts"] },
	packedNotesDraftsListInput,
	packedNotesDraftsListOutput,
);

export const packedNotesPollsRecommendationInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"excludeChannels": v.optional(v.boolean(), false),
});
export const packedNotesPollsRecommendationOutput = v.array(packedReference("Note"));
export const packedNotesPollsRecommendationDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/polls/recommendation", tags: ["notes"] },
	packedNotesPollsRecommendationInput,
	packedNotesPollsRecommendationOutput,
);

export const packedNotesReactionsInput = v.object({
	"noteId": misskeyId,
	"type": v.exactOptional(v.nullable(v.string())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesReactionsOutput = v.array(packedReference("NoteReaction"));
export const packedNotesReactionsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/reactions", tags: ["notes", "reactions"] },
	packedNotesReactionsInput,
	packedNotesReactionsOutput,
);

export const packedNotesRenotesInput = v.object({
	"noteId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesRenotesOutput = v.array(packedReference("Note"));
export const packedNotesRenotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/renotes", tags: ["notes"] },
	packedNotesRenotesInput,
	packedNotesRenotesOutput,
);

export const packedNotesRepliesInput = v.object({
	"noteId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedNotesRepliesOutput = v.array(packedReference("Note"));
export const packedNotesRepliesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/replies", tags: ["notes"] },
	packedNotesRepliesInput,
	packedNotesRepliesOutput,
);

export const packedNotesShowInput = v.object({
	"noteId": misskeyId,
});
export const packedNotesShowOutput = packedReference("Note");
export const packedNotesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/show", tags: ["notes"] },
	packedNotesShowInput,
	packedNotesShowOutput,
);

export const packedUsersReactionsInput = v.object({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersReactionsOutput = v.array(packedReference("NoteReactionWithNote"));
export const packedUsersReactionsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/reactions", tags: ["users", "reactions"] },
	packedUsersReactionsInput,
	packedUsersReactionsOutput,
);

export const packedEndpointDefinitions = {
	"i/pin": packedIPinDefinition,
	"i/unpin": packedIUnpinDefinition,
	"notes": packedNotesDefinition,
	"notes/children": packedNotesChildrenDefinition,
	"notes/conversation": packedNotesConversationDefinition,
	"notes/drafts/list": packedNotesDraftsListDefinition,
	"notes/polls/recommendation": packedNotesPollsRecommendationDefinition,
	"notes/reactions": packedNotesReactionsDefinition,
	"notes/renotes": packedNotesRenotesDefinition,
	"notes/replies": packedNotesRepliesDefinition,
	"notes/show": packedNotesShowDefinition,
	"users/reactions": packedUsersReactionsDefinition,
} as const;

export const packedEndpointContracts = {
	"i/pin": packedIPinDefinition.contract,
	"i/unpin": packedIUnpinDefinition.contract,
	"notes": packedNotesDefinition.contract,
	"notes/children": packedNotesChildrenDefinition.contract,
	"notes/conversation": packedNotesConversationDefinition.contract,
	"notes/drafts/list": packedNotesDraftsListDefinition.contract,
	"notes/polls/recommendation": packedNotesPollsRecommendationDefinition.contract,
	"notes/reactions": packedNotesReactionsDefinition.contract,
	"notes/renotes": packedNotesRenotesDefinition.contract,
	"notes/replies": packedNotesRepliesDefinition.contract,
	"notes/show": packedNotesShowDefinition.contract,
	"users/reactions": packedUsersReactionsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
