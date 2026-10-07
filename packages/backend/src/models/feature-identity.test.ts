/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { expect, test } from 'vitest';

import { MiAbuseReportNotificationRecipient } from '@features/moderation/backend/models/AbuseReportNotificationRecipient.js';

import { MiAbuseUserReport } from '@features/moderation/backend/models/AbuseUserReport.js';

import { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';

import { MiAd } from '@features/instance/backend/models/Ad.js';

import { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';

import { MiAnnouncementRead } from '@features/announcements/backend/models/AnnouncementRead.js';

import { MiAntenna } from '@features/timelines/backend/models/Antenna.js';

import { MiApp } from '@features/auth/backend/models/App.js';

import { MiAuthSession } from '@features/auth/backend/models/AuthSession.js';

import { MiAvatarDecoration } from '@features/avatar-decorations/backend/models/AvatarDecoration.js';

import { MiBlocking } from '@features/relationships/backend/models/Blocking.js';

import { MiBubbleGameRecord } from '@features/games/backend/models/BubbleGameRecord.js';

import { MiChannel } from '@features/channels/backend/models/Channel.js';

import { MiChannelFavorite } from '@features/channels/backend/models/ChannelFavorite.js';

import { MiChannelFollowing } from '@features/channels/backend/models/ChannelFollowing.js';

import { MiChannelMuting } from '@features/channels/backend/models/ChannelMuting.js';

import { MiChatApproval } from '@features/chat/backend/models/ChatApproval.js';

import { MiChatMessage } from '@features/chat/backend/models/ChatMessage.js';

import { MiChatRoom } from '@features/chat/backend/models/ChatRoom.js';

import { MiChatRoomInvitation } from '@features/chat/backend/models/ChatRoomInvitation.js';

import { MiChatRoomMembership } from '@features/chat/backend/models/ChatRoomMembership.js';

import { MiClip } from '@features/collections/backend/models/Clip.js';

import { MiClipFavorite } from '@features/collections/backend/models/ClipFavorite.js';

import { MiClipNote } from '@features/collections/backend/models/ClipNote.js';

import { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';

import { MiDriveFolder } from '@features/drive/backend/models/DriveFolder.js';

import { MiEmoji } from '@features/emojis/backend/models/Emoji.js';

import { MiFlash } from '@features/play/backend/models/Flash.js';

import { MiFlashLike } from '@features/play/backend/models/FlashLike.js';

import { MiFollowRequest } from '@features/relationships/backend/models/FollowRequest.js';

import { MiFollowing } from '@features/relationships/backend/models/Following.js';

import { MiGalleryLike } from '@features/gallery/backend/models/GalleryLike.js';

import { MiGalleryPost } from '@features/gallery/backend/models/GalleryPost.js';

import { MiHashtag } from '@features/discovery/backend/models/Hashtag.js';

import { MiInstance } from '@features/federation/backend/models/Instance.js';

import { MiMeta } from '@features/instance/backend/models/Meta.js';

import { MiModerationLog } from '@features/moderation/backend/models/ModerationLog.js';

import { MiMuting } from '@features/relationships/backend/models/Muting.js';

import { MiNote } from '@features/notes/backend/models/Note.js';

import { MiNoteDraft } from '@features/notes/backend/models/NoteDraft.js';

import { MiNoteFavorite } from '@features/collections/backend/models/NoteFavorite.js';

import { MiNoteReaction } from '@features/notes/backend/models/NoteReaction.js';

import { MiNoteThreadMuting } from '@features/notes/backend/models/NoteThreadMuting.js';

import { MiPage } from '@features/pages/backend/models/Page.js';

import { MiPageLike } from '@features/pages/backend/models/PageLike.js';

import { MiPasswordResetRequest } from '@features/auth/backend/models/PasswordResetRequest.js';

import { MiPoll } from '@features/notes/backend/models/Poll.js';

import { MiPollVote } from '@features/notes/backend/models/PollVote.js';

import { MiPromoNote } from '@features/instance/backend/models/PromoNote.js';

import { MiPromoRead } from '@features/instance/backend/models/PromoRead.js';

import { MiRegistrationTicket } from '@features/auth/backend/models/RegistrationTicket.js';

import { MiRegistryItem } from '@features/preferences/backend/models/RegistryItem.js';

import { MiRelay } from '@features/federation/backend/models/Relay.js';

import { MiRenoteMuting } from '@features/relationships/backend/models/RenoteMuting.js';

import { MiRetentionAggregation } from '@features/statistics/backend/models/RetentionAggregation.js';

import { MiReversiGame } from '@features/games/backend/models/ReversiGame.js';

import { MiRole } from '@features/roles/backend/models/Role.js';

import { MiRoleAssignment } from '@features/roles/backend/models/RoleAssignment.js';

import { MiSignin } from '@features/auth/backend/models/Signin.js';

import { MiSwSubscription } from '@features/notifications/backend/models/SwSubscription.js';

import { MiSystemAccount } from '@features/users/backend/models/SystemAccount.js';

import { MiSystemWebhook } from '@features/integrations/backend/models/SystemWebhook.js';

import { MiUsedUsername } from '@features/users/backend/models/UsedUsername.js';

import { MiUser } from '@features/users/backend/models/User.js';

import { MiUserIp } from '@features/auth/backend/models/UserIp.js';

import { MiUserKeypair } from '@features/federation/backend/models/UserKeypair.js';

import { MiUserList } from '@features/relationships/backend/models/UserList.js';

import { MiUserListFavorite } from '@features/relationships/backend/models/UserListFavorite.js';

import { MiUserListMembership } from '@features/relationships/backend/models/UserListMembership.js';

import { MiUserMemo } from '@features/users/backend/models/UserMemo.js';

import { MiUserNotePining } from '@features/notes/backend/models/UserNotePining.js';

import { MiUserPending } from '@features/auth/backend/models/UserPending.js';

import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';

import { MiUserPublickey } from '@features/federation/backend/models/UserPublickey.js';

import { MiUserSecurityKey } from '@features/auth/backend/models/UserSecurityKey.js';

import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';

const entities = [
	['MiAbuseReportNotificationRecipient', MiAbuseReportNotificationRecipient, 'abuse_report_notification_recipient'],
	['MiAbuseUserReport', MiAbuseUserReport, 'abuse_user_report'],
	['MiAccessToken', MiAccessToken, 'access_token'],
	['MiAd', MiAd, 'ad'],
	['MiAnnouncement', MiAnnouncement, 'announcement'],
	['MiAnnouncementRead', MiAnnouncementRead, 'announcement_read'],
	['MiAntenna', MiAntenna, 'antenna'],
	['MiApp', MiApp, 'app'],
	['MiAuthSession', MiAuthSession, 'auth_session'],
	['MiAvatarDecoration', MiAvatarDecoration, 'avatar_decoration'],
	['MiBlocking', MiBlocking, 'blocking'],
	['MiBubbleGameRecord', MiBubbleGameRecord, 'bubble_game_record'],
	['MiChannel', MiChannel, 'channel'],
	['MiChannelFavorite', MiChannelFavorite, 'channel_favorite'],
	['MiChannelFollowing', MiChannelFollowing, 'channel_following'],
	['MiChannelMuting', MiChannelMuting, 'channel_muting'],
	['MiChatApproval', MiChatApproval, 'chat_approval'],
	['MiChatMessage', MiChatMessage, 'chat_message'],
	['MiChatRoom', MiChatRoom, 'chat_room'],
	['MiChatRoomInvitation', MiChatRoomInvitation, 'chat_room_invitation'],
	['MiChatRoomMembership', MiChatRoomMembership, 'chat_room_membership'],
	['MiClip', MiClip, 'clip'],
	['MiClipFavorite', MiClipFavorite, 'clip_favorite'],
	['MiClipNote', MiClipNote, 'clip_note'],
	['MiDriveFile', MiDriveFile, 'drive_file'],
	['MiDriveFolder', MiDriveFolder, 'drive_folder'],
	['MiEmoji', MiEmoji, 'emoji'],
	['MiFlash', MiFlash, 'flash'],
	['MiFlashLike', MiFlashLike, 'flash_like'],
	['MiFollowRequest', MiFollowRequest, 'follow_request'],
	['MiFollowing', MiFollowing, 'following'],
	['MiGalleryLike', MiGalleryLike, 'gallery_like'],
	['MiGalleryPost', MiGalleryPost, 'gallery_post'],
	['MiHashtag', MiHashtag, 'hashtag'],
	['MiInstance', MiInstance, 'instance'],
	['MiMeta', MiMeta, 'meta'],
	['MiModerationLog', MiModerationLog, 'moderation_log'],
	['MiMuting', MiMuting, 'muting'],
	['MiNote', MiNote, 'note'],
	['MiNoteDraft', MiNoteDraft, 'note_draft'],
	['MiNoteFavorite', MiNoteFavorite, 'note_favorite'],
	['MiNoteReaction', MiNoteReaction, 'note_reaction'],
	['MiNoteThreadMuting', MiNoteThreadMuting, 'note_thread_muting'],
	['MiPage', MiPage, 'page'],
	['MiPageLike', MiPageLike, 'page_like'],
	['MiPasswordResetRequest', MiPasswordResetRequest, 'password_reset_request'],
	['MiPoll', MiPoll, 'poll'],
	['MiPollVote', MiPollVote, 'poll_vote'],
	['MiPromoNote', MiPromoNote, 'promo_note'],
	['MiPromoRead', MiPromoRead, 'promo_read'],
	['MiRegistrationTicket', MiRegistrationTicket, 'registration_ticket'],
	['MiRegistryItem', MiRegistryItem, 'registry_item'],
	['MiRelay', MiRelay, 'relay'],
	['MiRenoteMuting', MiRenoteMuting, 'renote_muting'],
	['MiRetentionAggregation', MiRetentionAggregation, 'retention_aggregation'],
	['MiReversiGame', MiReversiGame, 'reversi_game'],
	['MiRole', MiRole, 'role'],
	['MiRoleAssignment', MiRoleAssignment, 'role_assignment'],
	['MiSignin', MiSignin, 'signin'],
	['MiSwSubscription', MiSwSubscription, 'sw_subscription'],
	['MiSystemAccount', MiSystemAccount, 'system_account'],
	['MiSystemWebhook', MiSystemWebhook, 'system_webhook'],
	['MiUsedUsername', MiUsedUsername, 'used_username'],
	['MiUser', MiUser, 'user'],
	['MiUserIp', MiUserIp, 'user_ip'],
	['MiUserKeypair', MiUserKeypair, 'user_keypair'],
	['MiUserList', MiUserList, 'user_list'],
	['MiUserListFavorite', MiUserListFavorite, 'user_list_favorite'],
	['MiUserListMembership', MiUserListMembership, 'user_list_membership'],
	['MiUserMemo', MiUserMemo, 'user_memo'],
	['MiUserNotePining', MiUserNotePining, 'user_note_pining'],
	['MiUserPending', MiUserPending, 'user_pending'],
	['MiUserProfile', MiUserProfile, 'user_profile'],
	['MiUserPublickey', MiUserPublickey, 'user_publickey'],
	['MiUserSecurityKey', MiUserSecurityKey, 'user_security_key'],
	['MiWebhook', MiWebhook, 'webhook'],
] as const;

for (const [name, feature, table] of entities) {
	test(`${name} keeps one canonical TypeORM entity constructor`, () => {
		const entries = getMetadataArgsStorage().tables.filter(entry => entry.target === feature);
		expect(entries).toHaveLength(1);
		expect(entries[0].target).toBe(feature);
		expect(entries[0].name).toBe(table);
	});
}
