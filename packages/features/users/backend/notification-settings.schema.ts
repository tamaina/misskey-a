/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { packedOptionalJsonValueSchema, packedJsonValueSchema, businessJsonObjectWithRest, type PackedJsonValue, toPackedJsonValue } from './json-value.schema.js';
export type NotificationReceiveRule = ({
	type: 'all' | 'following' | 'follower' | 'mutualFollow' | 'followingOrFollower' | 'never';
} | {
	type: 'list';
	userListId: string;
}) & {
	[key: string]: PackedJsonValue;
};
export type NotificationSettingName = 'note' | 'follow' | 'mention' | 'reply' | 'renote' | 'quote' | 'reaction' | 'pollEnded' | 'scheduledNotePosted' | 'scheduledNotePostFailed' | 'receiveFollowRequest' | 'followRequestAccepted' | 'roleAssigned' | 'chatRoomInvitationReceived' | 'achievementEarned' | 'app' | 'test' | 'login' | 'createToken' | 'exportCompleted';
export type NotificationSettings = {
	[Name in NotificationSettingName]?: NotificationReceiveRule | undefined;
} & {
	[key: string]: PackedJsonValue | undefined;
};
export const notificationReceiveRule: v.GenericSchema<NotificationReceiveRule, NotificationReceiveRule> = v.union([
	businessJsonObjectWithRest({
		type: v.picklist(['all', 'following', 'follower', 'mutualFollow', 'followingOrFollower', 'never']),
	}, packedJsonValueSchema),
	businessJsonObjectWithRest({
		type: v.literal('list'),
		userListId: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)),
	}, packedJsonValueSchema),
]);
const notificationRuleEntries = {
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
	login: v.optional(notificationReceiveRule),
	createToken: v.optional(notificationReceiveRule),
	exportCompleted: v.optional(notificationReceiveRule),
};
export const notificationSettings: v.GenericSchema<NotificationSettings, NotificationSettings> = v.pipe(businessJsonObjectWithRest(notificationRuleEntries, packedOptionalJsonValueSchema), v.check(settings => Object.keys(settings).every(key => Object.hasOwn(notificationRuleEntries, key) || settings[key] !== undefined), 'Notification extension values must be JSON'), v.transform(settings => {
	for (const key of Object.keys(settings)) {
		if (settings[key] === undefined) delete settings[key];
	}
	return settings;
}), v.metadata({ required: undefined }), v.metadata({ nullable: false }));
/** Keep the JSON business keys while omitting declared optional undefined settings. */
export function toPackedNotificationSettings(settings: NotificationSettings): NotificationSettings {
	const result: NotificationSettings = {};
	for (const [key, value] of Object.entries(settings)) {
		if (value === undefined) {
			if (!Object.hasOwn(notificationRuleEntries, key)) throw new TypeError('Notification extension values must be JSON');
			continue;
		}
		Object.defineProperty(result, key, { value: toPackedJsonValue(value), enumerable: true, writable: true, configurable: true });
	}
	return result;
}
