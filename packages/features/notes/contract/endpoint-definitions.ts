/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineNotesDraftsCountInput = v.looseObject({});
export const inlineNotesDraftsCountOutput = v.pipe(v.number(), v.metadata({ "description": "The number of drafts" }));
export const inlineNotesDraftsCountDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/drafts/count', tags: ["notes", "drafts"] },
	inlineNotesDraftsCountInput,
	inlineNotesDraftsCountOutput,
);

export const inlineNotesShowPartialBulkInput = v.looseObject({
	"noteIds": v.pipe(v.array(misskeyId), v.minLength(1), v.maxLength(100)),
});
export const inlineNotesShowPartialBulkOutput = v.array(resultObject({
		"id": v.string(),
		"reactions": v.record(v.string(), v.number()),
		"reactionEmojis": v.record(v.string(), v.string()),
	}));
export const inlineNotesShowPartialBulkDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/show-partial-bulk', tags: ["notes"] },
	inlineNotesShowPartialBulkInput,
	inlineNotesShowPartialBulkOutput,
);

export const inlineNotesStateInput = v.looseObject({
	"noteId": misskeyId,
});
export const inlineNotesStateOutput = resultObject({
	"isFavorited": v.boolean(),
	"isMutedThread": v.boolean(),
});
export const inlineNotesStateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/state', tags: ["notes"] },
	inlineNotesStateInput,
	inlineNotesStateOutput,
);

export const inlineNotesTranslateInput = v.looseObject({
	"noteId": misskeyId,
	"targetLang": v.string(),
});
export const inlineNotesTranslateOutput = v.optional(resultObject({
	"sourceLang": v.string(),
	"text": v.string(),
}));
export const inlineNotesTranslateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/translate', tags: ["notes"] },
	inlineNotesTranslateInput,
	inlineNotesTranslateOutput,
);

export const inlineEndpointDefinitions = {
	"notes/drafts/count": inlineNotesDraftsCountDefinition,
	"notes/show-partial-bulk": inlineNotesShowPartialBulkDefinition,
	"notes/state": inlineNotesStateDefinition,
	"notes/translate": inlineNotesTranslateDefinition,
} as const;

export const inlineEndpointContracts = {
	"notes/drafts/count": inlineNotesDraftsCountDefinition.contract,
	"notes/show-partial-bulk": inlineNotesShowPartialBulkDefinition.contract,
	"notes/state": inlineNotesStateDefinition.contract,
	"notes/translate": inlineNotesTranslateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
