/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	packedAnnouncementSchema,
} from '../../users/backend/user-related.schema.js';

import {
	packedAppSchema,
	packedInviteCodeSchema,
	packedSigninSchema,
} from '../../auth/backend/auth.schema.js';

import {
	packedChannelSchema,
} from '../../channels/backend/channel.schema.js';

import {
	packedChatMessageSchema,
	packedChatMessageLiteSchema,
	packedChatMessageLiteFor1on1Schema,
	packedChatMessageLiteForRoomSchema,
	packedChatRoomSchema,
	packedChatRoomInvitationSchema,
	packedChatRoomMembershipSchema,
} from '../../chat/backend/chat.schema.js';

import {
	packedNoteFavoriteSchema,
	packedClipSchema,
} from '../../collections/backend/api.definition.js';

import {
	packedHashtagSchema,
} from '../../discovery/backend/endpoints/hashtag.schema.js';

import {
	packedDriveFileSchema,
	packedDriveFolderSchema,
} from '../../notes/backend/drive.schema.js';

import {
	emojiSimpleResult as packedEmojiSimpleSchema,
	emojiDetailedResult as packedEmojiDetailedSchema,
	packedEmojiDetailedAdminSchema,
} from '../../emojis/backend/api.definition.js';

import {
	federationInstanceSchema as packedFederationInstanceSchema,
} from '../../federation/backend/federation.schema.js';

import {
	packedGalleryPostSchema,
} from '../../collections/backend/api.definition.js';

import {
	packedReversiGameLiteSchema,
	packedReversiGameDetailedSchema,
} from '../../games/backend/reversi.schema.js';

import {
	packedAdSchema,
	packedMetaLiteSchema,
	packedMetaDetailedOnlySchema,
	packedMetaDetailedSchema,
	packedMetaClientOptionsSchema,
} from '../../instance/backend/endpoints/meta.schema.js';

import {
	userWebhookSchema as packedUserWebhookSchema,
	systemWebhookSchema as packedSystemWebhookSchema,
} from '../../integrations/backend/webhook.schema.js';

import {
	abuseReportNotificationRecipientSchema as packedAbuseReportNotificationRecipientSchema,
} from '../../moderation/backend/api.definition.js';

import {
	packedNoteSchema,
	packedNoteDraftSchema,
	packedNoteReactionSchema,
	packedNoteReactionWithNoteSchema,
} from '../../notes/backend/note.schema.js';

import {
	packedNotificationSchema,
} from '../../notifications/backend/notification.schema.js';

import {
	queueCounterSchema as packedQueueCountSchema,
	queueMetricsSchema as packedQueueMetricsSchema,
	queueJobSchema as packedQueueJobSchema,
} from '../../operations/backend/queue.schema.js';

import {
	packedPageSchema,
} from '../../users/backend/page.schema.js';

import {
	packedFlashSchema,
} from '../../play/backend/flash.schema.js';

import {
	packedUserListSchema,
	packedFollowingSchema,
	packedMutingSchema,
	packedRenoteMutingSchema,
	packedBlockingSchema,
} from '../../relationships/backend/endpoints/relationships.schema.js';

import {
	packedRoleCondFormulaLogicsSchema,
	packedRoleCondFormulaValueNot,
	packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	packedRoleCondFormulaValueUserSettingBooleanSchema,
	packedRoleCondFormulaValueAssignedRoleSchema,
	packedRoleCondFormulaValueCreatedSchema,
	packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	packedRoleLiteSchema,
	packedRolePoliciesSchema,
} from '../../notifications/backend/notification-related.schema.js';

import {
	packedAntennaSchema,
} from '../../timelines/backend/antenna.schema.js';

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
} from '../../users/backend/user.schema.js';

import { packedPageBlockSchema } from '../../pages/backend/page-block.schema.js';

import { packedRoleSchema, packedRoleCondFormulaValueSchema } from '../../roles/backend/role.schema.js';

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

// Defer output inference to a concrete registry key so recursive packed models
// do not force a structural check of the entire schema union in SDK declarations.
type PackedSchemaOutput<Schema> = Schema extends {
	readonly '~standard': { readonly types?: { readonly output: infer Output } | undefined };
} ? Output : never;

export type Packed<K extends keyof typeof packedSchemas> = PackedSchemaOutput<(typeof packedSchemas)[K]>;

/** Canonical model types inferred directly from native feature DTO schemas. */
export type PackedModels = { [Name in keyof typeof packedSchemas]: Packed<Name> };
