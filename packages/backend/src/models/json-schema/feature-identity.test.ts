/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { refs } from '@/misc/json-schema.js';
import * as schema0 from '../../../../features/announcements/backend/models/json-schema/announcement.js';
import * as schema1 from '../../../../features/auth/backend/models/json-schema/app.js';
import * as schema2 from '../../../../features/auth/backend/models/json-schema/invite-code.js';
import * as schema3 from '../../../../features/auth/backend/models/json-schema/signin.js';
import * as schema4 from '../../../../features/channels/backend/models/json-schema/channel.js';
import * as schema5 from '../../../../features/chat/backend/models/json-schema/chat-message.js';
import * as schema6 from '../../../../features/chat/backend/models/json-schema/chat-room-invitation.js';
import * as schema7 from '../../../../features/chat/backend/models/json-schema/chat-room-membership.js';
import * as schema8 from '../../../../features/chat/backend/models/json-schema/chat-room.js';
import * as schema9 from '../../../../features/collections/backend/models/json-schema/clip.js';
import * as schema10 from '../../../../features/collections/backend/models/json-schema/note-favorite.js';
import * as schema11 from '../../../../features/discovery/backend/models/json-schema/hashtag.js';
import * as schema12 from '../../../../features/drive/backend/models/json-schema/drive-file.js';
import * as schema13 from '../../../../features/drive/backend/models/json-schema/drive-folder.js';
import * as schema14 from '../../../../features/emojis/backend/models/json-schema/emoji.js';
import * as schema15 from '../../../../features/federation/backend/models/json-schema/federation-instance.js';
import * as schema16 from '../../../../features/gallery/backend/models/json-schema/gallery-post.js';
import * as schema17 from '../../../../features/games/backend/models/json-schema/reversi-game.js';
import * as schema18 from '../../../../features/instance/backend/models/json-schema/ad.js';
import * as schema19 from '../../../../features/instance/backend/models/json-schema/meta.js';
import * as schema20 from '../../../../features/integrations/backend/models/json-schema/system-webhook.js';
import * as schema21 from '../../../../features/integrations/backend/models/json-schema/user-webhook.js';
import * as schema22 from '../../../../features/moderation/backend/models/json-schema/abuse-report-notification-recipient.js';
import * as schema23 from '../../../../features/notes/backend/models/json-schema/note-draft.js';
import * as schema24 from '../../../../features/notes/backend/models/json-schema/note-reaction.js';
import * as schema25 from '../../../../features/notes/backend/models/json-schema/note.js';
import * as schema26 from '../../../../features/notifications/backend/models/json-schema/notification.js';
import * as schema27 from '../../../../features/operations/backend/models/json-schema/queue.js';
import * as schema28 from '../../../../features/pages/backend/models/json-schema/page.js';
import * as schema29 from '../../../../features/play/backend/models/json-schema/flash.js';
import * as schema30 from '../../../../features/relationships/backend/models/json-schema/blocking.js';
import * as schema31 from '../../../../features/relationships/backend/models/json-schema/following.js';
import * as schema32 from '../../../../features/relationships/backend/models/json-schema/muting.js';
import * as schema33 from '../../../../features/relationships/backend/models/json-schema/renote-muting.js';
import * as schema34 from '../../../../features/relationships/backend/models/json-schema/user-list.js';
import * as schema35 from '../../../../features/roles/backend/models/json-schema/role.js';
import * as schema36 from '../../../../features/timelines/backend/models/json-schema/antenna.js';
import * as schema37 from '../../../../features/users/backend/models/json-schema/achievement.js';
import * as schema38 from '../../../../features/users/backend/models/json-schema/user.js';

const canonicalSchemas: Array<readonly [keyof typeof refs, unknown]> = [
	['UserLite', schema38.packedUserLiteSchema],
	['UserDetailedNotMeOnly', schema38.packedUserDetailedNotMeOnlySchema],
	['MeDetailedOnly', schema38.packedMeDetailedOnlySchema],
	['UserDetailedNotMe', schema38.packedUserDetailedNotMeSchema],
	['MeDetailed', schema38.packedMeDetailedSchema],
	['UserDetailed', schema38.packedUserDetailedSchema],
	['User', schema38.packedUserSchema],
	['UserList', schema34.packedUserListSchema],
	['Achievement', schema37.packedAchievementSchema],
	['AchievementName', schema37.packedAchievementNameSchema],
	['Ad', schema18.packedAdSchema],
	['Announcement', schema0.packedAnnouncementSchema],
	['App', schema1.packedAppSchema],
	['Note', schema25.packedNoteSchema],
	['NoteDraft', schema23.packedNoteDraftSchema],
	['NoteReaction', schema24.packedNoteReactionSchema],
	['NoteReactionWithNote', schema24.packedNoteReactionWithNoteSchema],
	['NoteFavorite', schema10.packedNoteFavoriteSchema],
	['Notification', schema26.packedNotificationSchema],
	['DriveFile', schema12.packedDriveFileSchema],
	['DriveFolder', schema13.packedDriveFolderSchema],
	['Following', schema31.packedFollowingSchema],
	['Muting', schema32.packedMutingSchema],
	['RenoteMuting', schema33.packedRenoteMutingSchema],
	['Blocking', schema30.packedBlockingSchema],
	['Hashtag', schema11.packedHashtagSchema],
	['InviteCode', schema2.packedInviteCodeSchema],
	['Page', schema28.packedPageSchema],
	['PageBlock', schema28.packedPageBlockSchema],
	['Channel', schema4.packedChannelSchema],
	['QueueCount', schema27.packedQueueCountSchema],
	['QueueMetrics', schema27.packedQueueMetricsSchema],
	['QueueJob', schema27.packedQueueJobSchema],
	['Antenna', schema36.packedAntennaSchema],
	['Clip', schema9.packedClipSchema],
	['FederationInstance', schema15.packedFederationInstanceSchema],
	['GalleryPost', schema16.packedGalleryPostSchema],
	['EmojiSimple', schema14.packedEmojiSimpleSchema],
	['EmojiDetailed', schema14.packedEmojiDetailedSchema],
	['EmojiDetailedAdmin', schema14.packedEmojiDetailedAdminSchema],
	['Flash', schema29.packedFlashSchema],
	['Signin', schema3.packedSigninSchema],
	['RoleCondFormulaLogics', schema35.packedRoleCondFormulaLogicsSchema],
	['RoleCondFormulaValueNot', schema35.packedRoleCondFormulaValueNot],
	['RoleCondFormulaValueIsLocalOrRemote', schema35.packedRoleCondFormulaValueIsLocalOrRemoteSchema],
	['RoleCondFormulaValueUserSettingBooleanSchema', schema35.packedRoleCondFormulaValueUserSettingBooleanSchema],
	['RoleCondFormulaValueAssignedRole', schema35.packedRoleCondFormulaValueAssignedRoleSchema],
	['RoleCondFormulaValueCreated', schema35.packedRoleCondFormulaValueCreatedSchema],
	['RoleCondFormulaFollowersOrFollowingOrNotes', schema35.packedRoleCondFormulaFollowersOrFollowingOrNotesSchema],
	['RoleCondFormulaValue', schema35.packedRoleCondFormulaValueSchema],
	['RoleLite', schema35.packedRoleLiteSchema],
	['Role', schema35.packedRoleSchema],
	['RolePolicies', schema35.packedRolePoliciesSchema],
	['ReversiGameLite', schema17.packedReversiGameLiteSchema],
	['ReversiGameDetailed', schema17.packedReversiGameDetailedSchema],
	['MetaLite', schema19.packedMetaLiteSchema],
	['MetaDetailedOnly', schema19.packedMetaDetailedOnlySchema],
	['MetaDetailed', schema19.packedMetaDetailedSchema],
	['MetaClientOptions', schema19.packedMetaClientOptionsSchema],
	['UserWebhook', schema21.packedUserWebhookSchema],
	['SystemWebhook', schema20.packedSystemWebhookSchema],
	['AbuseReportNotificationRecipient', schema22.packedAbuseReportNotificationRecipientSchema],
	['ChatMessage', schema5.packedChatMessageSchema],
	['ChatMessageLite', schema5.packedChatMessageLiteSchema],
	['ChatMessageLiteFor1on1', schema5.packedChatMessageLiteFor1on1Schema],
	['ChatMessageLiteForRoom', schema5.packedChatMessageLiteForRoomSchema],
	['ChatRoom', schema8.packedChatRoomSchema],
	['ChatRoomInvitation', schema6.packedChatRoomInvitationSchema],
	['ChatRoomMembership', schema7.packedChatRoomMembershipSchema],
];

for (const [name, canonicalSchema] of canonicalSchemas) {
	test(`${name} API schema uses its canonical feature definition`, () => {
		expect(refs[name]).toBe(canonicalSchema);
	});
}
