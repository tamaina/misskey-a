/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonNumber } from '../../api/contract/json-number.js';
import { muteWordInputItem } from '../../api/contract/mute-word-input-item.js';
import { uniqueStringArray } from '../../api/contract/unique-string-array.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { nameSchema, followedMessageSchema, locationSchema } from './user-profile-fields.js';
import { descriptionSchema } from './user-description.js';
import { birthdaySchema } from './user-birthday.js';
import { languageKeys } from './languages.js';
import { notificationReceiveRule } from './notification-receive-config.js';

const muteWords = v.array(muteWordInputItem());
const notificationSettings = v.pipe(jsonObject({
	note: v.optional(notificationReceiveRule),
	follow: v.optional(notificationReceiveRule),
	mention: v.optional(notificationReceiveRule),
	reply: v.optional(notificationReceiveRule),
	renote: v.optional(notificationReceiveRule),
	quote: v.optional(notificationReceiveRule),
	reaction: v.optional(notificationReceiveRule),
	pollEnded: v.optional(notificationReceiveRule),
	scheduledNotePosted: v.optional(notificationReceiveRule),
	scheduledNotePostFailed: v.optional(notificationReceiveRule),
	receiveFollowRequest: v.optional(notificationReceiveRule),
	followRequestAccepted: v.optional(notificationReceiveRule),
	roleAssigned: v.optional(notificationReceiveRule),
	chatRoomInvitationReceived: v.optional(notificationReceiveRule),
	achievementEarned: v.optional(notificationReceiveRule),
	app: v.optional(notificationReceiveRule),
	test: v.optional(notificationReceiveRule),
}), v.metadata({ required: undefined }), v.metadata({ nullable: false }));

export const iUpdateInput = v.pipe(jsonObject({
	name: v.optional(v.nullable(jsonString(nameSchema))),
	description: v.optional(v.nullable(jsonString(descriptionSchema))),
	followedMessage: v.optional(v.nullable(jsonString(followedMessageSchema))),
	location: v.optional(v.nullable(jsonString(locationSchema))),
	birthday: v.optional(v.nullable(jsonString(birthdaySchema))),
	lang: v.optional(v.pipe(v.nullable(v.picklist(languageKeys)), v.metadata({ enum: [null, ...languageKeys] }))),
	avatarId: v.optional(v.nullable(misskeyId)),
	avatarDecorations: v.optional(v.pipe(v.array(jsonObject({
		id: misskeyId,
		angle: v.optional(v.nullable(v.pipe(jsonNumber, v.maxValue(0.5), v.minValue(-0.5)))),
		flipH: v.optional(v.nullable(v.boolean())),
		offsetX: v.optional(v.nullable(v.pipe(jsonNumber, v.maxValue(0.25), v.minValue(-0.25)))),
		offsetY: v.optional(v.nullable(v.pipe(jsonNumber, v.maxValue(0.25), v.minValue(-0.25)))),
	})), v.maxLength(16))),
	bannerId: v.optional(v.nullable(misskeyId)),
	fields: v.optional(v.pipe(v.array(jsonObject({ name: v.string(), value: v.string() })), v.minLength(0), v.maxLength(16))),
	isLocked: v.optional(v.boolean()),
	isExplorable: v.optional(v.boolean()),
	hideOnlineStatus: v.optional(v.boolean()),
	publicReactions: v.optional(v.boolean()),
	carefulBot: v.optional(v.boolean()),
	autoAcceptFollowed: v.optional(v.boolean()),
	noCrawle: v.optional(v.boolean()),
	preventAiLearning: v.optional(v.boolean()),
	requireSigninToViewContents: v.optional(v.boolean()),
	makeNotesFollowersOnlyBefore: v.optional(v.nullable(v.pipe(jsonNumber, v.integer()))),
	makeNotesHiddenBefore: v.optional(v.nullable(v.pipe(jsonNumber, v.integer()))),
	isBot: v.optional(v.boolean()),
	isCat: v.optional(v.boolean()),
	injectFeaturedNote: v.optional(v.boolean()),
	receiveAnnouncementEmail: v.optional(v.boolean()),
	alwaysMarkNsfw: v.optional(v.boolean()),
	autoSensitive: v.optional(v.boolean()),
	followingVisibility: v.optional(v.picklist(['public', 'followers', 'private'])),
	followersVisibility: v.optional(v.picklist(['public', 'followers', 'private'])),
	chatScope: v.optional(v.picklist(['everyone', 'followers', 'following', 'mutual', 'none'])),
	pinnedPageId: v.optional(v.nullable(misskeyId)),
	mutedWords: v.optional(muteWords),
	hardMutedWords: v.optional(muteWords),
	mutedInstances: v.optional(v.array(v.string())),
	notificationRecieveConfig: v.optional(notificationSettings),
	emailNotificationTypes: v.optional(v.array(v.string())),
	alsoKnownAs: v.optional(v.pipe(uniqueStringArray(v.string()), v.maxLength(10))),
}), v.metadata({ required: undefined }));
export const iUpdateOutput = v.pipe(packedReference('MeDetailed'), v.metadata({ optional: false, nullable: false }));
export const iUpdateDefinition = defineEndpointContract({ method: 'POST', path: '/i/update' }, iUpdateInput, iUpdateOutput);
export const userUpdateEndpointDefinitions = { 'i/update': iUpdateDefinition } as const;
export const userUpdateEndpointContracts = { 'i/update': iUpdateDefinition.contract } as const;
type Inputs = InferContractRouterInputs<typeof userUpdateEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof userUpdateEndpointContracts>;
export type UserUpdateEndpoints = {
	[K in keyof typeof userUpdateEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
