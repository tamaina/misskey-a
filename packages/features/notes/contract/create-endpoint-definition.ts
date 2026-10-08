/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId, uniqueStringArray } from '../../api/contract/index.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { requireWhenAllNullish } from '../../api/contract/require-when-all-nullish.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { MAX_NOTE_TEXT_LENGTH } from './note-text-limit.js';

const notesCreateBase = jsonObject({
	visibility: v.optional(v.picklist(['public', 'home', 'followers', 'specified']), 'public'),
	visibleUserIds: v.exactOptional(uniqueStringArray(misskeyId)),
	cw: v.exactOptional(v.nullable(jsonString({ minLength: 1, maxLength: 100 }))),
	localOnly: v.optional(v.boolean(), false),
	reactionAcceptance: v.optional(v.pipe(v.nullable(v.picklist(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'])), v.metadata({ enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'] })), null),
	noExtractMentions: v.optional(v.boolean(), false),
	noExtractHashtags: v.optional(v.boolean(), false),
	noExtractEmojis: v.optional(v.boolean(), false),
	replyId: v.exactOptional(v.nullable(misskeyId)),
	renoteId: v.exactOptional(v.nullable(misskeyId)),
	channelId: v.exactOptional(v.nullable(misskeyId)),
	text: v.exactOptional(v.nullable(jsonString({ minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH }))),
	fileIds: v.exactOptional(v.pipe(uniqueStringArray(misskeyId), v.minLength(1), v.maxLength(16))),
	mediaIds: v.exactOptional(v.pipe(uniqueStringArray(misskeyId), v.minLength(1), v.maxLength(16))),
	poll: v.exactOptional(v.nullable(jsonObject({
		choices: v.pipe(uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })), v.minLength(2), v.maxLength(10)),
		multiple: v.exactOptional(v.boolean()),
		expiresAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
		expiredAfter: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer(), v.minValue(1)))),
	}))),
});
const notesCreateRequiredText = jsonString({ minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH, pattern: '[^\\s]+' });

export const notesCreateInput = v.pipe(notesCreateBase, requireWhenAllNullish(notesCreateBase, {
	dependencies: ['renoteId', 'fileIds', 'mediaIds', 'poll'],
	key: 'text',
	schema: notesCreateRequiredText,
}));
export const notesCreateOutput = v.pipe(v.strictObject({
	createdNote: v.pipe(packedReference('Note'), v.metadata({ optional: false, nullable: false })),
}), v.metadata({ optional: false, nullable: false }));
export const notesCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/notes/create', tags: ['notes'] },
	notesCreateInput,
	notesCreateOutput,
);

export const noteCreateEndpointContracts = { 'notes/create': notesCreateDefinition.contract } as const;
type Inputs = InferContractRouterInputs<typeof noteCreateEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof noteCreateEndpointContracts>;
export type NativeNoteCreateEndpoints = {
	[K in keyof typeof noteCreateEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
