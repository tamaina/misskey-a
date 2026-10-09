/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedNoteDraftSchema } from '../../../note-aux.schema.js';
import { objectInput, misskeyId, jsonNumber, jsonString, uniqueStringArray, MAX_NOTE_TEXT_LENGTH } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesDraftsUpdateInput = objectInput({
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
	poll: v.exactOptional(v.nullable(objectInput({
		choices: v.pipe(uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })), v.minLength(0), v.maxLength(10)),
		multiple: v.exactOptional(v.boolean()),
		expiresAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
		expiredAfter: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer(), v.minValue(1)))),
	}))),
	scheduledAt: v.exactOptional(v.nullable(v.pipe(jsonNumber, v.integer()))),
	isActuallyScheduled: v.exactOptional(v.boolean()),
});
export const notesDraftsUpdateOutput = v.strictObject({
	updatedDraft: packedNoteDraftSchema,
});
export const notesDraftsUpdateErrors = {
	noSuchRenoteTarget: {
		message: 'No such renote target.',
		code: 'NO_SUCH_RENOTE_TARGET',
		id: 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4',
	},

	cannotReRenote: {
		message: 'You can not Renote a pure Renote.',
		code: 'CANNOT_RENOTE_TO_A_PURE_RENOTE',
		id: 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a',
	},

	cannotRenoteDueToVisibility: {
		message: 'You can not Renote due to target visibility.',
		code: 'CANNOT_RENOTE_DUE_TO_VISIBILITY',
		id: 'be9529e9-fe72-4de0-ae43-0b363c4938af',
	},

	noSuchReplyTarget: {
		message: 'No such reply target.',
		code: 'NO_SUCH_REPLY_TARGET',
		id: '749ee0f6-d3da-459a-bf02-282e2da4292c',
	},

	cannotReplyToInvisibleNote: {
		message: 'You cannot reply to an invisible Note.',
		code: 'CANNOT_REPLY_TO_AN_INVISIBLE_NOTE',
		id: 'b98980fa-3780-406c-a935-b6d0eeee10d1',
	},

	cannotReplyToPureRenote: {
		message: 'You can not reply to a pure Renote.',
		code: 'CANNOT_REPLY_TO_A_PURE_RENOTE',
		id: '3ac74a84-8fd5-4bb0-870f-01804f82ce15',
	},

	cannotReplyToSpecifiedNoteWithExtendedVisibility: {
		message: 'You cannot reply to a specified visibility note with extended visibility.',
		code: 'CANNOT_REPLY_TO_SPECIFIED_NOTE_WITH_EXTENDED_VISIBILITY',
		id: 'ed940410-535c-4d5e-bfa3-af798671e93c',
	},

	cannotCreateAlreadyExpiredPoll: {
		message: 'Poll is already expired.',
		code: 'CANNOT_CREATE_ALREADY_EXPIRED_POLL',
		id: '04da457d-b083-4055-9082-955525eda5a5',
	},

	noSuchChannel: {
		message: 'No such channel.',
		code: 'NO_SUCH_CHANNEL',
		id: 'b1653923-5453-4edc-b786-7c4f39bb0bbb',
	},

	youHaveBeenBlocked: {
		message: 'You have been blocked by this user.',
		code: 'YOU_HAVE_BEEN_BLOCKED',
		id: 'b390d7e1-8a5e-46ed-b625-06271cafd3d3',
	},

	noSuchFile: {
		message: 'Some files are not found.',
		code: 'NO_SUCH_FILE',
		id: 'b6992544-63e7-67f0-fa7f-32444b1b5306',
	},

	cannotRenoteOutsideOfChannel: {
		message: 'Cannot renote outside of channel.',
		code: 'CANNOT_RENOTE_OUTSIDE_OF_CHANNEL',
		id: '33510210-8452-094c-6227-4a6c05d99f00',
	},

	containsProhibitedWords: {
		message: 'Cannot post because it contains prohibited words.',
		code: 'CONTAINS_PROHIBITED_WORDS',
		id: 'aa6e01d3-a85c-669d-758a-76aab43af334',
	},

	containsTooManyMentions: {
		message: 'Cannot post because it exceeds the allowed number of mentions.',
		code: 'CONTAINS_TOO_MANY_MENTIONS',
		id: '4de0363a-3046-481b-9b0f-feff3e211025',
	},

	noSuchNoteDraft: {
		message: 'No such note draft.',
		code: 'NO_SUCH_NOTE_DRAFT',
		id: '49cd6b9d-848e-41ee-b0b9-adaca711a6b1',
	},

	accessDenied: {
		message: 'Access denied.',
		code: 'ACCESS_DENIED',
		id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
	},

	noSuchRenote: {
		message: 'No such renote.',
		code: 'NO_SUCH_RENOTE',
		id: '64929870-2540-4d11-af41-3b484d78c956',
	},

	cannotRenote: {
		message: 'Cannot renote.',
		code: 'CANNOT_RENOTE',
		id: '76cc5583-5a14-4ad3-8717-0298507e32db',
	},

	cannotRenoteToExternal: {
		message: 'Cannot Renote to External.',
		code: 'CANNOT_RENOTE_TO_EXTERNAL',
		id: 'ed1952ac-2d26-4957-8b30-2deda76bedf7',
	},

	noSuchReply: {
		message: 'No such reply.',
		code: 'NO_SUCH_REPLY',
		id: 'c4721841-22fc-4bb7-ad3d-897ef1d375b5',
	},

	cannotReplyToSpecifiedVisibilityNoteWithExtendedVisibility: {
		message: 'You cannot reply to a specified visibility note with extended visibility.',
		code: 'CANNOT_REPLY_TO_SPECIFIED_VISIBILITY_NOTE_WITH_EXTENDED_VISIBILITY',
		id: '215dbc76-336c-4d2a-9605-95766ba7dab0',
	},

	tooManyScheduledNotes: {
		message: 'You cannot create scheduled notes any more.',
		code: 'TOO_MANY_SCHEDULED_NOTES',
		id: '02f5df79-08ae-4a33-8524-f1503c8f6212',
	},

	scheduledAtRequired: {
		message: 'scheduledAt is required when isActuallyScheduled is true.',
		code: 'SCHEDULED_AT_REQUIRED',
		id: 'fe9737d5-cc41-498c-af9d-149207307530',
	},

	scheduledAtMustBeInFuture: {
		message: 'scheduledAt must be in the future.',
		code: 'SCHEDULED_AT_MUST_BE_IN_FUTURE',
		id: 'ed1a6673-d0d1-4364-aaae-9bf3f139cbc5',
	},
} as const;
export const notesDraftsUpdatePolicy = { name: 'notes/drafts/update', requireCredential: true, prohibitMoved: true, kind: 'write:account', limit: {
	duration: 3600000,
	max: 300,
} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesDraftsUpdateContract = oc.$meta<{ requestName: 'notes/drafts/update' }>({ requestName: 'notes/drafts/update' })
	.route({ method: 'POST', path: '/notes/drafts/update', operationId: 'post___notes___drafts___update', tags: ['notes', 'drafts'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_RENOTE_TARGET: { status: 400, data: apiErrorData }, CANNOT_RENOTE_TO_A_PURE_RENOTE: { status: 400, data: apiErrorData }, CANNOT_RENOTE_DUE_TO_VISIBILITY: { status: 400, data: apiErrorData }, NO_SUCH_REPLY_TARGET: { status: 400, data: apiErrorData }, CANNOT_REPLY_TO_AN_INVISIBLE_NOTE: { status: 400, data: apiErrorData }, CANNOT_REPLY_TO_A_PURE_RENOTE: { status: 400, data: apiErrorData }, CANNOT_REPLY_TO_SPECIFIED_NOTE_WITH_EXTENDED_VISIBILITY: { status: 400, data: apiErrorData }, CANNOT_CREATE_ALREADY_EXPIRED_POLL: { status: 400, data: apiErrorData }, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, CANNOT_RENOTE_OUTSIDE_OF_CHANNEL: { status: 400, data: apiErrorData }, CONTAINS_PROHIBITED_WORDS: { status: 400, data: apiErrorData }, CONTAINS_TOO_MANY_MENTIONS: { status: 400, data: apiErrorData }, NO_SUCH_NOTE_DRAFT: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData }, NO_SUCH_RENOTE: { status: 400, data: apiErrorData }, CANNOT_RENOTE: { status: 400, data: apiErrorData }, CANNOT_RENOTE_TO_EXTERNAL: { status: 400, data: apiErrorData }, NO_SUCH_REPLY: { status: 400, data: apiErrorData }, CANNOT_REPLY_TO_SPECIFIED_VISIBILITY_NOTE_WITH_EXTENDED_VISIBILITY: { status: 400, data: apiErrorData }, TOO_MANY_SCHEDULED_NOTES: { status: 400, data: apiErrorData }, SCHEDULED_AT_REQUIRED: { status: 400, data: apiErrorData }, SCHEDULED_AT_MUST_BE_IN_FUTURE: { status: 400, data: apiErrorData } })
	.input(notesDraftsUpdateInput).output(notesDraftsUpdateOutput);
