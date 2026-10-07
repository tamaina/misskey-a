/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { notificationReceiveRule } from '../../users/contract/notification-receive-config.js';

export const adminShowUserInput = jsonObject({ userId: misskeyId });
/** Documented response. The legacy backend still returns raw, unpacked signins. */
export const adminShowUserOutput = resultObject({
	email: v.nullable(v.string()),
	emailVerified: v.boolean(),
	followedMessage: v.nullable(v.string()),
	autoAcceptFollowed: v.boolean(),
	noCrawle: v.boolean(),
	preventAiLearning: v.boolean(),
	alwaysMarkNsfw: v.boolean(),
	autoSensitive: v.boolean(),
	carefulBot: v.boolean(),
	injectFeaturedNote: v.boolean(),
	receiveAnnouncementEmail: v.boolean(),
	mutedWords: v.array(v.union([v.string(), v.array(v.string())])),
	mutedInstances: v.array(v.string()),
	notificationRecieveConfig: resultObject({
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
	}),
	isModerator: v.boolean(),
	isSilenced: v.boolean(),
	isSuspended: v.boolean(),
	isHibernated: v.boolean(),
	lastActiveDate: v.nullable(v.string()),
	moderationNote: v.string(),
	signins: v.array(packedReference('Signin', { legacyOutputType: 'omit' })),
	policies: packedReference('RolePolicies'),
	roles: v.array(packedReference('Role')),
	roleAssigns: v.array(resultObject({
		createdAt: v.string(),
		expiresAt: v.nullable(v.string()),
		roleId: v.string(),
	})),
});
export const adminShowUserDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/show-user', tags: ['admin'] },
	adminShowUserInput,
	adminShowUserOutput,
);
export const adminUserEndpointContracts = { 'admin/show-user': adminShowUserDefinition.contract } as const;
export type AdminUserEndpoints = {
	'admin/show-user': { req: v.InferInput<typeof adminShowUserInput>; res: v.InferOutput<typeof adminShowUserOutput> };
};
