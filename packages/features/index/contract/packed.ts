/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

import {
	packedAnnouncementSchema,
} from '../../announcements/contract/packed.js';

import {
	packedAppSchema,
	packedInviteCodeSchema,
	packedSigninSchema,
} from '../../auth/contract/packed.js';

import {
	packedChannelSchema,
} from '../../channels/contract/packed.js';

import {
	packedChatMessageSchema,
	packedChatMessageLiteSchema,
	packedChatMessageLiteFor1on1Schema,
	packedChatMessageLiteForRoomSchema,
	packedChatRoomSchema,
	packedChatRoomInvitationSchema,
	packedChatRoomMembershipSchema,
} from '../../chat/contract/packed.js';

import {
	packedNoteFavoriteSchema,
	packedClipSchema,
} from '../../collections/contract/packed.js';

import {
	packedHashtagSchema,
} from '../../discovery/contract/packed.js';

import {
	packedDriveFileSchema,
	packedDriveFolderSchema,
} from '../../drive/contract/packed.js';

import {
	packedEmojiSimpleSchema,
	packedEmojiDetailedSchema,
	packedEmojiDetailedAdminSchema,
} from '../../emojis/contract/packed.js';

import {
	packedFederationInstanceSchema,
} from '../../federation/contract/packed.js';

import {
	packedGalleryPostSchema,
} from '../../gallery/contract/packed.js';

import {
	packedReversiGameLiteSchema,
	packedReversiGameDetailedSchema,
} from '../../games/contract/packed.js';

import {
	packedAdSchema,
	packedMetaLiteSchema,
	packedMetaDetailedOnlySchema,
	packedMetaDetailedSchema,
	packedMetaClientOptionsSchema,
} from '../../instance/contract/packed.js';

import {
	packedUserWebhookSchema,
	packedSystemWebhookSchema,
} from '../../integrations/contract/packed.js';

import {
	packedAbuseReportNotificationRecipientSchema,
} from '../../moderation/contract/packed.js';

import {
	packedNoteSchema,
	packedNoteDraftSchema,
	packedNoteReactionSchema,
	packedNoteReactionWithNoteSchema,
} from '../../notes/contract/packed.js';

import {
	packedNotificationSchema,
} from '../../notifications/contract/packed.js';

import {
	packedQueueCountSchema,
	packedQueueMetricsSchema,
	packedQueueJobSchema,
} from '../../operations/contract/packed.js';

import {
	packedPageSchema,
	packedPageBlockSchema,
} from '../../pages/contract/packed.js';

import {
	packedFlashSchema,
} from '../../play/contract/packed.js';

import {
	packedUserListSchema,
	packedFollowingSchema,
	packedMutingSchema,
	packedRenoteMutingSchema,
	packedBlockingSchema,
} from '../../relationships/contract/packed.js';

import {
	packedRoleCondFormulaLogicsSchema,
	packedRoleCondFormulaValueNot,
	packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	packedRoleCondFormulaValueUserSettingBooleanSchema,
	packedRoleCondFormulaValueAssignedRoleSchema,
	packedRoleCondFormulaValueCreatedSchema,
	packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	packedRoleCondFormulaValueSchema,
	packedRoleLiteSchema,
	packedRoleSchema,
	packedRolePoliciesSchema,
} from '../../roles/contract/packed.js';

import {
	packedAntennaSchema,
} from '../../timelines/contract/packed.js';

import {
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
	packedMeDetailedOnlySchema,
	packedUserDetailedNotMeSchema,
	packedMeDetailedSchema,
	packedUserDetailedSchema,
	packedUserSchema,
	packedAchievementSchema,
	packedAchievementNameSchema,
} from '../../users/contract/packed.js';

type PackedSchemaRegistry = {
	readonly UserLite: typeof packedUserLiteSchema;
	readonly UserDetailedNotMeOnly: typeof packedUserDetailedNotMeOnlySchema;
	readonly MeDetailedOnly: typeof packedMeDetailedOnlySchema;
	readonly UserDetailedNotMe: typeof packedUserDetailedNotMeSchema;
	readonly MeDetailed: typeof packedMeDetailedSchema;
	readonly UserDetailed: typeof packedUserDetailedSchema;
	readonly User: typeof packedUserSchema;
	readonly UserList: typeof packedUserListSchema;
	readonly Achievement: typeof packedAchievementSchema;
	readonly AchievementName: typeof packedAchievementNameSchema;
	readonly Ad: typeof packedAdSchema;
	readonly Announcement: typeof packedAnnouncementSchema;
	readonly App: typeof packedAppSchema;
	readonly Note: typeof packedNoteSchema;
	readonly NoteDraft: typeof packedNoteDraftSchema;
	readonly NoteReaction: typeof packedNoteReactionSchema;
	readonly NoteReactionWithNote: typeof packedNoteReactionWithNoteSchema;
	readonly NoteFavorite: typeof packedNoteFavoriteSchema;
	readonly Notification: typeof packedNotificationSchema;
	readonly DriveFile: typeof packedDriveFileSchema;
	readonly DriveFolder: typeof packedDriveFolderSchema;
	readonly Following: typeof packedFollowingSchema;
	readonly Muting: typeof packedMutingSchema;
	readonly RenoteMuting: typeof packedRenoteMutingSchema;
	readonly Blocking: typeof packedBlockingSchema;
	readonly Hashtag: typeof packedHashtagSchema;
	readonly InviteCode: typeof packedInviteCodeSchema;
	readonly Page: typeof packedPageSchema;
	readonly PageBlock: typeof packedPageBlockSchema;
	readonly Channel: typeof packedChannelSchema;
	readonly QueueCount: typeof packedQueueCountSchema;
	readonly QueueMetrics: typeof packedQueueMetricsSchema;
	readonly QueueJob: typeof packedQueueJobSchema;
	readonly Antenna: typeof packedAntennaSchema;
	readonly Clip: typeof packedClipSchema;
	readonly FederationInstance: typeof packedFederationInstanceSchema;
	readonly GalleryPost: typeof packedGalleryPostSchema;
	readonly EmojiSimple: typeof packedEmojiSimpleSchema;
	readonly EmojiDetailed: typeof packedEmojiDetailedSchema;
	readonly EmojiDetailedAdmin: typeof packedEmojiDetailedAdminSchema;
	readonly Flash: typeof packedFlashSchema;
	readonly Signin: typeof packedSigninSchema;
	readonly RoleCondFormulaLogics: typeof packedRoleCondFormulaLogicsSchema;
	readonly RoleCondFormulaValueNot: typeof packedRoleCondFormulaValueNot;
	readonly RoleCondFormulaValueIsLocalOrRemote: typeof packedRoleCondFormulaValueIsLocalOrRemoteSchema;
	readonly RoleCondFormulaValueUserSettingBooleanSchema: typeof packedRoleCondFormulaValueUserSettingBooleanSchema;
	readonly RoleCondFormulaValueAssignedRole: typeof packedRoleCondFormulaValueAssignedRoleSchema;
	readonly RoleCondFormulaValueCreated: typeof packedRoleCondFormulaValueCreatedSchema;
	readonly RoleCondFormulaFollowersOrFollowingOrNotes: typeof packedRoleCondFormulaFollowersOrFollowingOrNotesSchema;
	readonly RoleCondFormulaValue: typeof packedRoleCondFormulaValueSchema;
	readonly RoleLite: typeof packedRoleLiteSchema;
	readonly Role: typeof packedRoleSchema;
	readonly RolePolicies: typeof packedRolePoliciesSchema;
	readonly ReversiGameLite: typeof packedReversiGameLiteSchema;
	readonly ReversiGameDetailed: typeof packedReversiGameDetailedSchema;
	readonly MetaLite: typeof packedMetaLiteSchema;
	readonly MetaDetailedOnly: typeof packedMetaDetailedOnlySchema;
	readonly MetaDetailed: typeof packedMetaDetailedSchema;
	readonly MetaClientOptions: typeof packedMetaClientOptionsSchema;
	readonly UserWebhook: typeof packedUserWebhookSchema;
	readonly SystemWebhook: typeof packedSystemWebhookSchema;
	readonly AbuseReportNotificationRecipient: typeof packedAbuseReportNotificationRecipientSchema;
	readonly ChatMessage: typeof packedChatMessageSchema;
	readonly ChatMessageLite: typeof packedChatMessageLiteSchema;
	readonly ChatMessageLiteFor1on1: typeof packedChatMessageLiteFor1on1Schema;
	readonly ChatMessageLiteForRoom: typeof packedChatMessageLiteForRoomSchema;
	readonly ChatRoom: typeof packedChatRoomSchema;
	readonly ChatRoomInvitation: typeof packedChatRoomInvitationSchema;
	readonly ChatRoomMembership: typeof packedChatRoomMembershipSchema;
};

export const packedSchemas: PackedSchemaRegistry = {
	UserLite: packedUserLiteSchema,
	UserDetailedNotMeOnly: packedUserDetailedNotMeOnlySchema,
	MeDetailedOnly: packedMeDetailedOnlySchema,
	UserDetailedNotMe: packedUserDetailedNotMeSchema,
	MeDetailed: packedMeDetailedSchema,
	UserDetailed: packedUserDetailedSchema,
	User: packedUserSchema,
	UserList: packedUserListSchema,
	Achievement: packedAchievementSchema,
	AchievementName: packedAchievementNameSchema,
	Ad: packedAdSchema,
	Announcement: packedAnnouncementSchema,
	App: packedAppSchema,
	Note: packedNoteSchema,
	NoteDraft: packedNoteDraftSchema,
	NoteReaction: packedNoteReactionSchema,
	NoteReactionWithNote: packedNoteReactionWithNoteSchema,
	NoteFavorite: packedNoteFavoriteSchema,
	Notification: packedNotificationSchema,
	DriveFile: packedDriveFileSchema,
	DriveFolder: packedDriveFolderSchema,
	Following: packedFollowingSchema,
	Muting: packedMutingSchema,
	RenoteMuting: packedRenoteMutingSchema,
	Blocking: packedBlockingSchema,
	Hashtag: packedHashtagSchema,
	InviteCode: packedInviteCodeSchema,
	Page: packedPageSchema,
	PageBlock: packedPageBlockSchema,
	Channel: packedChannelSchema,
	QueueCount: packedQueueCountSchema,
	QueueMetrics: packedQueueMetricsSchema,
	QueueJob: packedQueueJobSchema,
	Antenna: packedAntennaSchema,
	Clip: packedClipSchema,
	FederationInstance: packedFederationInstanceSchema,
	GalleryPost: packedGalleryPostSchema,
	EmojiSimple: packedEmojiSimpleSchema,
	EmojiDetailed: packedEmojiDetailedSchema,
	EmojiDetailedAdmin: packedEmojiDetailedAdminSchema,
	Flash: packedFlashSchema,
	Signin: packedSigninSchema,
	RoleCondFormulaLogics: packedRoleCondFormulaLogicsSchema,
	RoleCondFormulaValueNot: packedRoleCondFormulaValueNot,
	RoleCondFormulaValueIsLocalOrRemote: packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	RoleCondFormulaValueUserSettingBooleanSchema: packedRoleCondFormulaValueUserSettingBooleanSchema,
	RoleCondFormulaValueAssignedRole: packedRoleCondFormulaValueAssignedRoleSchema,
	RoleCondFormulaValueCreated: packedRoleCondFormulaValueCreatedSchema,
	RoleCondFormulaFollowersOrFollowingOrNotes: packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	RoleCondFormulaValue: packedRoleCondFormulaValueSchema,
	RoleLite: packedRoleLiteSchema,
	Role: packedRoleSchema,
	RolePolicies: packedRolePoliciesSchema,
	ReversiGameLite: packedReversiGameLiteSchema,
	ReversiGameDetailed: packedReversiGameDetailedSchema,
	MetaLite: packedMetaLiteSchema,
	MetaDetailedOnly: packedMetaDetailedOnlySchema,
	MetaDetailed: packedMetaDetailedSchema,
	MetaClientOptions: packedMetaClientOptionsSchema,
	UserWebhook: packedUserWebhookSchema,
	SystemWebhook: packedSystemWebhookSchema,
	AbuseReportNotificationRecipient: packedAbuseReportNotificationRecipientSchema,
	ChatMessage: packedChatMessageSchema,
	ChatMessageLite: packedChatMessageLiteSchema,
	ChatMessageLiteFor1on1: packedChatMessageLiteFor1on1Schema,
	ChatMessageLiteForRoom: packedChatMessageLiteForRoomSchema,
	ChatRoom: packedChatRoomSchema,
	ChatRoomInvitation: packedChatRoomInvitationSchema,
	ChatRoomMembership: packedChatRoomMembershipSchema,
};

export type Packed<K extends keyof typeof packedSchemas> = v.InferOutput<(typeof packedSchemas)[K]>;
