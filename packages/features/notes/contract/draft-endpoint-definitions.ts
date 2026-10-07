/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId, uniqueStringArray } from '../../api/contract/index.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { resultObject } from '../../api/contract/result-object.js';
import { MAX_NOTE_TEXT_LENGTH } from './note-text-limit.js';

export const notesDraftsCreateInput = jsonObject({
	visibility: v.optional(v.picklist(['public', 'home', 'followers', 'specified']), 'public'),
	visibleUserIds: v.exactOptional(uniqueStringArray(misskeyId)),
	cw: v.exactOptional(v.nullable(jsonString({ minLength: 1, maxLength: 100 }))),
	hashtag: v.exactOptional(v.nullable(jsonString({ maxLength: 200 }))),
	localOnly: v.optional(v.boolean(), false),
	reactionAcceptance: v.optional(v.pipe(v.nullable(v.picklist(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'])), v.metadata({ enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'] })), null),
	replyId: v.exactOptional(v.nullable(misskeyId)),
	renoteId: v.exactOptional(v.nullable(misskeyId)),
	channelId: v.exactOptional(v.nullable(misskeyId)),
	text: v.exactOptional(v.nullable(jsonString({ minLength: 0, maxLength: MAX_NOTE_TEXT_LENGTH }))),
	fileIds: v.exactOptional(v.pipe(uniqueStringArray(misskeyId), v.minLength(0), v.maxLength(16))),
	poll: v.exactOptional(v.nullable(jsonObject({
		choices: v.pipe(uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })), v.minLength(0), v.maxLength(10)),
		multiple: v.exactOptional(v.boolean()),
		expiresAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
		expiredAfter: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer(), v.minValue(1)))),
	}))),
	scheduledAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
	isActuallyScheduled: v.optional(v.boolean(), false),
});
export const notesDraftsCreateOutput = v.pipe(resultObject({
	createdDraft: v.pipe(packedReference('NoteDraft'), v.metadata({ optional: false, nullable: false })),
}), v.metadata({ optional: false, nullable: false }));
export const notesDraftsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/drafts/create', tags: ['notes', 'drafts'] },
	notesDraftsCreateInput,
	notesDraftsCreateOutput,
);

export const notesDraftsUpdateInput = jsonObject({
	draftId: v.pipe(misskeyId, v.metadata({ nullable: false })),
	visibility: v.exactOptional(v.picklist(['public', 'home', 'followers', 'specified'])),
	visibleUserIds: v.exactOptional(uniqueStringArray(misskeyId)),
	cw: v.exactOptional(v.nullable(jsonString({ minLength: 1, maxLength: 100 }))),
	hashtag: v.exactOptional(v.nullable(jsonString({ maxLength: 200 }))),
	localOnly: v.exactOptional(v.boolean()),
	reactionAcceptance: v.exactOptional(v.pipe(v.nullable(v.picklist(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'])), v.metadata({ enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'] }))),
	replyId: v.exactOptional(v.nullable(misskeyId)),
	renoteId: v.exactOptional(v.nullable(misskeyId)),
	channelId: v.exactOptional(v.nullable(misskeyId)),
	text: v.exactOptional(v.nullable(jsonString({ minLength: 0, maxLength: MAX_NOTE_TEXT_LENGTH }))),
	fileIds: v.exactOptional(v.pipe(uniqueStringArray(misskeyId), v.minLength(0), v.maxLength(16))),
	poll: v.exactOptional(v.nullable(jsonObject({
		choices: v.pipe(uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })), v.minLength(0), v.maxLength(10)),
		multiple: v.exactOptional(v.boolean()),
		expiresAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
		expiredAfter: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer(), v.minValue(1)))),
	}))),
	scheduledAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
	isActuallyScheduled: v.exactOptional(v.boolean()),
});
export const notesDraftsUpdateOutput = v.pipe(resultObject({
	updatedDraft: v.pipe(packedReference('NoteDraft'), v.metadata({ optional: false, nullable: false })),
}), v.metadata({ optional: false, nullable: false }));
export const notesDraftsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/drafts/update', tags: ['notes', 'drafts'] },
	notesDraftsUpdateInput,
	notesDraftsUpdateOutput,
);

export const noteDraftEndpointDefinitions = {
	'notes/drafts/create': notesDraftsCreateDefinition,
	'notes/drafts/update': notesDraftsUpdateDefinition,
} as const;

export const noteDraftEndpointContracts = {
	'notes/drafts/create': notesDraftsCreateDefinition.contract,
	'notes/drafts/update': notesDraftsUpdateDefinition.contract,
} as const;

// Infer directly from the authoritative schemas; router inference also traverses
// recursive packed outputs while computing otherwise finite request fields.
export type NativeNoteDraftEndpoints = {
	[K in keyof typeof noteDraftEndpointDefinitions]: {
		req: v.InferInput<(typeof noteDraftEndpointDefinitions)[K]['input']>;
		res: v.InferOutput<(typeof noteDraftEndpointDefinitions)[K]['output']>;
	};
};
