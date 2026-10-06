/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { expect, test } from 'vitest';
import { MiAbuseReportNotificationRecipient as LegacyMiAbuseReportNotificationRecipient } from './AbuseReportNotificationRecipient.js';
import { MiAbuseReportNotificationRecipient } from '../../../features/moderation/backend/models/AbuseReportNotificationRecipient.js';
import { MiAbuseUserReport as LegacyMiAbuseUserReport } from './AbuseUserReport.js';
import { MiAbuseUserReport } from '../../../features/moderation/backend/models/AbuseUserReport.js';
import { MiAccessToken as LegacyMiAccessToken } from './AccessToken.js';
import { MiAccessToken } from '../../../features/auth/backend/models/AccessToken.js';
import { MiAd as LegacyMiAd } from './Ad.js';
import { MiAd } from '../../../features/instance/backend/models/Ad.js';
import { MiAnnouncement as LegacyMiAnnouncement } from './Announcement.js';
import { MiAnnouncement } from '../../../features/announcements/backend/models/Announcement.js';
import { MiAnnouncementRead as LegacyMiAnnouncementRead } from './AnnouncementRead.js';
import { MiAnnouncementRead } from '../../../features/announcements/backend/models/AnnouncementRead.js';
import { MiAntenna as LegacyMiAntenna } from './Antenna.js';
import { MiAntenna } from '../../../features/timelines/backend/models/Antenna.js';
import { MiApp as LegacyMiApp } from './App.js';
import { MiApp } from '../../../features/auth/backend/models/App.js';
import { MiAuthSession as LegacyMiAuthSession } from './AuthSession.js';
import { MiAuthSession } from '../../../features/auth/backend/models/AuthSession.js';
import { MiAvatarDecoration as LegacyMiAvatarDecoration } from './AvatarDecoration.js';
import { MiAvatarDecoration } from '../../../features/avatar-decorations/backend/models/AvatarDecoration.js';
import { MiBlocking as LegacyMiBlocking } from './Blocking.js';
import { MiBlocking } from '../../../features/relationships/backend/models/Blocking.js';
import { MiBubbleGameRecord as LegacyMiBubbleGameRecord } from './BubbleGameRecord.js';
import { MiBubbleGameRecord } from '../../../features/games/backend/models/BubbleGameRecord.js';
import { MiChannel as LegacyMiChannel } from './Channel.js';
import { MiChannel } from '../../../features/channels/backend/models/Channel.js';
import { MiChannelFavorite as LegacyMiChannelFavorite } from './ChannelFavorite.js';
import { MiChannelFavorite } from '../../../features/channels/backend/models/ChannelFavorite.js';
import { MiChannelFollowing as LegacyMiChannelFollowing } from './ChannelFollowing.js';
import { MiChannelFollowing } from '../../../features/channels/backend/models/ChannelFollowing.js';
import { MiChannelMuting as LegacyMiChannelMuting } from './ChannelMuting.js';
import { MiChannelMuting } from '../../../features/channels/backend/models/ChannelMuting.js';
import { MiChatApproval as LegacyMiChatApproval } from './ChatApproval.js';
import { MiChatApproval } from '../../../features/chat/backend/models/ChatApproval.js';
import { MiChatMessage as LegacyMiChatMessage } from './ChatMessage.js';
import { MiChatMessage } from '../../../features/chat/backend/models/ChatMessage.js';
import { MiChatRoom as LegacyMiChatRoom } from './ChatRoom.js';
import { MiChatRoom } from '../../../features/chat/backend/models/ChatRoom.js';
import { MiChatRoomInvitation as LegacyMiChatRoomInvitation } from './ChatRoomInvitation.js';
import { MiChatRoomInvitation } from '../../../features/chat/backend/models/ChatRoomInvitation.js';
import { MiChatRoomMembership as LegacyMiChatRoomMembership } from './ChatRoomMembership.js';
import { MiChatRoomMembership } from '../../../features/chat/backend/models/ChatRoomMembership.js';
import { MiClip as LegacyMiClip } from './Clip.js';
import { MiClip } from '../../../features/collections/backend/models/Clip.js';
import { MiClipFavorite as LegacyMiClipFavorite } from './ClipFavorite.js';
import { MiClipFavorite } from '../../../features/collections/backend/models/ClipFavorite.js';
import { MiClipNote as LegacyMiClipNote } from './ClipNote.js';
import { MiClipNote } from '../../../features/collections/backend/models/ClipNote.js';
import { MiDriveFile as LegacyMiDriveFile } from './DriveFile.js';
import { MiDriveFile } from '../../../features/drive/backend/models/DriveFile.js';
import { MiDriveFolder as LegacyMiDriveFolder } from './DriveFolder.js';
import { MiDriveFolder } from '../../../features/drive/backend/models/DriveFolder.js';
import { MiEmoji as LegacyMiEmoji } from './Emoji.js';
import { MiEmoji } from '../../../features/emojis/backend/models/Emoji.js';
import { MiFlash as LegacyMiFlash } from './Flash.js';
import { MiFlash } from '../../../features/play/backend/models/Flash.js';
import { MiFlashLike as LegacyMiFlashLike } from './FlashLike.js';
import { MiFlashLike } from '../../../features/play/backend/models/FlashLike.js';
import { MiFollowRequest as LegacyMiFollowRequest } from './FollowRequest.js';
import { MiFollowRequest } from '../../../features/relationships/backend/models/FollowRequest.js';
import { MiFollowing as LegacyMiFollowing } from './Following.js';
import { MiFollowing } from '../../../features/relationships/backend/models/Following.js';
import { MiGalleryLike as LegacyMiGalleryLike } from './GalleryLike.js';
import { MiGalleryLike } from '../../../features/gallery/backend/models/GalleryLike.js';
import { MiGalleryPost as LegacyMiGalleryPost } from './GalleryPost.js';
import { MiGalleryPost } from '../../../features/gallery/backend/models/GalleryPost.js';
import { MiHashtag as LegacyMiHashtag } from './Hashtag.js';
import { MiHashtag } from '../../../features/discovery/backend/models/Hashtag.js';
import { MiInstance as LegacyMiInstance } from './Instance.js';
import { MiInstance } from '../../../features/federation/backend/models/Instance.js';
import { MiMeta as LegacyMiMeta } from './Meta.js';
import { MiMeta } from '../../../features/instance/backend/models/Meta.js';
import { MiModerationLog as LegacyMiModerationLog } from './ModerationLog.js';
import { MiModerationLog } from '../../../features/moderation/backend/models/ModerationLog.js';
import { MiMuting as LegacyMiMuting } from './Muting.js';
import { MiMuting } from '../../../features/relationships/backend/models/Muting.js';
import { MiNote as LegacyMiNote } from './Note.js';
import { MiNote } from '../../../features/notes/backend/models/Note.js';
import { MiNoteDraft as LegacyMiNoteDraft } from './NoteDraft.js';
import { MiNoteDraft } from '../../../features/notes/backend/models/NoteDraft.js';
import { MiNoteFavorite as LegacyMiNoteFavorite } from './NoteFavorite.js';
import { MiNoteFavorite } from '../../../features/collections/backend/models/NoteFavorite.js';
import { MiNoteReaction as LegacyMiNoteReaction } from './NoteReaction.js';
import { MiNoteReaction } from '../../../features/notes/backend/models/NoteReaction.js';
import { MiNoteThreadMuting as LegacyMiNoteThreadMuting } from './NoteThreadMuting.js';
import { MiNoteThreadMuting } from '../../../features/notes/backend/models/NoteThreadMuting.js';
import { MiPage as LegacyMiPage } from './Page.js';
import { MiPage } from '../../../features/pages/backend/models/Page.js';
import { MiPageLike as LegacyMiPageLike } from './PageLike.js';
import { MiPageLike } from '../../../features/pages/backend/models/PageLike.js';
import { MiPasswordResetRequest as LegacyMiPasswordResetRequest } from './PasswordResetRequest.js';
import { MiPasswordResetRequest } from '../../../features/auth/backend/models/PasswordResetRequest.js';
import { MiPoll as LegacyMiPoll } from './Poll.js';
import { MiPoll } from '../../../features/notes/backend/models/Poll.js';
import { MiPollVote as LegacyMiPollVote } from './PollVote.js';
import { MiPollVote } from '../../../features/notes/backend/models/PollVote.js';
import { MiPromoNote as LegacyMiPromoNote } from './PromoNote.js';
import { MiPromoNote } from '../../../features/instance/backend/models/PromoNote.js';
import { MiPromoRead as LegacyMiPromoRead } from './PromoRead.js';
import { MiPromoRead } from '../../../features/instance/backend/models/PromoRead.js';
import { MiRegistrationTicket as LegacyMiRegistrationTicket } from './RegistrationTicket.js';
import { MiRegistrationTicket } from '../../../features/auth/backend/models/RegistrationTicket.js';
import { MiRegistryItem as LegacyMiRegistryItem } from './RegistryItem.js';
import { MiRegistryItem } from '../../../features/preferences/backend/models/RegistryItem.js';
import { MiRelay as LegacyMiRelay } from './Relay.js';
import { MiRelay } from '../../../features/federation/backend/models/Relay.js';
import { MiRenoteMuting as LegacyMiRenoteMuting } from './RenoteMuting.js';
import { MiRenoteMuting } from '../../../features/relationships/backend/models/RenoteMuting.js';
import { MiRetentionAggregation as LegacyMiRetentionAggregation } from './RetentionAggregation.js';
import { MiRetentionAggregation } from '../../../features/statistics/backend/models/RetentionAggregation.js';
import { MiReversiGame as LegacyMiReversiGame } from './ReversiGame.js';
import { MiReversiGame } from '../../../features/games/backend/models/ReversiGame.js';
import { MiRole as LegacyMiRole } from './Role.js';
import { MiRole } from '../../../features/roles/backend/models/Role.js';
import { MiRoleAssignment as LegacyMiRoleAssignment } from './RoleAssignment.js';
import { MiRoleAssignment } from '../../../features/roles/backend/models/RoleAssignment.js';
import { MiSignin as LegacyMiSignin } from './Signin.js';
import { MiSignin } from '../../../features/auth/backend/models/Signin.js';
import { MiSwSubscription as LegacyMiSwSubscription } from './SwSubscription.js';
import { MiSwSubscription } from '../../../features/notifications/backend/models/SwSubscription.js';
import { MiSystemAccount as LegacyMiSystemAccount } from './SystemAccount.js';
import { MiSystemAccount } from '../../../features/users/backend/models/SystemAccount.js';
import { MiSystemWebhook as LegacyMiSystemWebhook } from './SystemWebhook.js';
import { MiSystemWebhook } from '../../../features/integrations/backend/models/SystemWebhook.js';
import { MiUsedUsername as LegacyMiUsedUsername } from './UsedUsername.js';
import { MiUsedUsername } from '../../../features/users/backend/models/UsedUsername.js';
import { MiUser as LegacyMiUser } from './User.js';
import { MiUser } from '../../../features/users/backend/models/User.js';
import { MiUserIp as LegacyMiUserIp } from './UserIp.js';
import { MiUserIp } from '../../../features/auth/backend/models/UserIp.js';
import { MiUserKeypair as LegacyMiUserKeypair } from './UserKeypair.js';
import { MiUserKeypair } from '../../../features/federation/backend/models/UserKeypair.js';
import { MiUserList as LegacyMiUserList } from './UserList.js';
import { MiUserList } from '../../../features/relationships/backend/models/UserList.js';
import { MiUserListFavorite as LegacyMiUserListFavorite } from './UserListFavorite.js';
import { MiUserListFavorite } from '../../../features/relationships/backend/models/UserListFavorite.js';
import { MiUserListMembership as LegacyMiUserListMembership } from './UserListMembership.js';
import { MiUserListMembership } from '../../../features/relationships/backend/models/UserListMembership.js';
import { MiUserMemo as LegacyMiUserMemo } from './UserMemo.js';
import { MiUserMemo } from '../../../features/users/backend/models/UserMemo.js';
import { MiUserNotePining as LegacyMiUserNotePining } from './UserNotePining.js';
import { MiUserNotePining } from '../../../features/notes/backend/models/UserNotePining.js';
import { MiUserPending as LegacyMiUserPending } from './UserPending.js';
import { MiUserPending } from '../../../features/auth/backend/models/UserPending.js';
import { MiUserProfile as LegacyMiUserProfile } from './UserProfile.js';
import { MiUserProfile } from '../../../features/users/backend/models/UserProfile.js';
import { MiUserPublickey as LegacyMiUserPublickey } from './UserPublickey.js';
import { MiUserPublickey } from '../../../features/federation/backend/models/UserPublickey.js';
import { MiUserSecurityKey as LegacyMiUserSecurityKey } from './UserSecurityKey.js';
import { MiUserSecurityKey } from '../../../features/auth/backend/models/UserSecurityKey.js';
import { MiWebhook as LegacyMiWebhook } from './Webhook.js';
import { MiWebhook } from '../../../features/integrations/backend/models/Webhook.js';

const entities = [
	['MiAbuseReportNotificationRecipient', LegacyMiAbuseReportNotificationRecipient, MiAbuseReportNotificationRecipient, 'abuse_report_notification_recipient'],
	['MiAbuseUserReport', LegacyMiAbuseUserReport, MiAbuseUserReport, 'abuse_user_report'],
	['MiAccessToken', LegacyMiAccessToken, MiAccessToken, 'access_token'],
	['MiAd', LegacyMiAd, MiAd, 'ad'],
	['MiAnnouncement', LegacyMiAnnouncement, MiAnnouncement, 'announcement'],
	['MiAnnouncementRead', LegacyMiAnnouncementRead, MiAnnouncementRead, 'announcement_read'],
	['MiAntenna', LegacyMiAntenna, MiAntenna, 'antenna'],
	['MiApp', LegacyMiApp, MiApp, 'app'],
	['MiAuthSession', LegacyMiAuthSession, MiAuthSession, 'auth_session'],
	['MiAvatarDecoration', LegacyMiAvatarDecoration, MiAvatarDecoration, 'avatar_decoration'],
	['MiBlocking', LegacyMiBlocking, MiBlocking, 'blocking'],
	['MiBubbleGameRecord', LegacyMiBubbleGameRecord, MiBubbleGameRecord, 'bubble_game_record'],
	['MiChannel', LegacyMiChannel, MiChannel, 'channel'],
	['MiChannelFavorite', LegacyMiChannelFavorite, MiChannelFavorite, 'channel_favorite'],
	['MiChannelFollowing', LegacyMiChannelFollowing, MiChannelFollowing, 'channel_following'],
	['MiChannelMuting', LegacyMiChannelMuting, MiChannelMuting, 'channel_muting'],
	['MiChatApproval', LegacyMiChatApproval, MiChatApproval, 'chat_approval'],
	['MiChatMessage', LegacyMiChatMessage, MiChatMessage, 'chat_message'],
	['MiChatRoom', LegacyMiChatRoom, MiChatRoom, 'chat_room'],
	['MiChatRoomInvitation', LegacyMiChatRoomInvitation, MiChatRoomInvitation, 'chat_room_invitation'],
	['MiChatRoomMembership', LegacyMiChatRoomMembership, MiChatRoomMembership, 'chat_room_membership'],
	['MiClip', LegacyMiClip, MiClip, 'clip'],
	['MiClipFavorite', LegacyMiClipFavorite, MiClipFavorite, 'clip_favorite'],
	['MiClipNote', LegacyMiClipNote, MiClipNote, 'clip_note'],
	['MiDriveFile', LegacyMiDriveFile, MiDriveFile, 'drive_file'],
	['MiDriveFolder', LegacyMiDriveFolder, MiDriveFolder, 'drive_folder'],
	['MiEmoji', LegacyMiEmoji, MiEmoji, 'emoji'],
	['MiFlash', LegacyMiFlash, MiFlash, 'flash'],
	['MiFlashLike', LegacyMiFlashLike, MiFlashLike, 'flash_like'],
	['MiFollowRequest', LegacyMiFollowRequest, MiFollowRequest, 'follow_request'],
	['MiFollowing', LegacyMiFollowing, MiFollowing, 'following'],
	['MiGalleryLike', LegacyMiGalleryLike, MiGalleryLike, 'gallery_like'],
	['MiGalleryPost', LegacyMiGalleryPost, MiGalleryPost, 'gallery_post'],
	['MiHashtag', LegacyMiHashtag, MiHashtag, 'hashtag'],
	['MiInstance', LegacyMiInstance, MiInstance, 'instance'],
	['MiMeta', LegacyMiMeta, MiMeta, 'meta'],
	['MiModerationLog', LegacyMiModerationLog, MiModerationLog, 'moderation_log'],
	['MiMuting', LegacyMiMuting, MiMuting, 'muting'],
	['MiNote', LegacyMiNote, MiNote, 'note'],
	['MiNoteDraft', LegacyMiNoteDraft, MiNoteDraft, 'note_draft'],
	['MiNoteFavorite', LegacyMiNoteFavorite, MiNoteFavorite, 'note_favorite'],
	['MiNoteReaction', LegacyMiNoteReaction, MiNoteReaction, 'note_reaction'],
	['MiNoteThreadMuting', LegacyMiNoteThreadMuting, MiNoteThreadMuting, 'note_thread_muting'],
	['MiPage', LegacyMiPage, MiPage, 'page'],
	['MiPageLike', LegacyMiPageLike, MiPageLike, 'page_like'],
	['MiPasswordResetRequest', LegacyMiPasswordResetRequest, MiPasswordResetRequest, 'password_reset_request'],
	['MiPoll', LegacyMiPoll, MiPoll, 'poll'],
	['MiPollVote', LegacyMiPollVote, MiPollVote, 'poll_vote'],
	['MiPromoNote', LegacyMiPromoNote, MiPromoNote, 'promo_note'],
	['MiPromoRead', LegacyMiPromoRead, MiPromoRead, 'promo_read'],
	['MiRegistrationTicket', LegacyMiRegistrationTicket, MiRegistrationTicket, 'registration_ticket'],
	['MiRegistryItem', LegacyMiRegistryItem, MiRegistryItem, 'registry_item'],
	['MiRelay', LegacyMiRelay, MiRelay, 'relay'],
	['MiRenoteMuting', LegacyMiRenoteMuting, MiRenoteMuting, 'renote_muting'],
	['MiRetentionAggregation', LegacyMiRetentionAggregation, MiRetentionAggregation, 'retention_aggregation'],
	['MiReversiGame', LegacyMiReversiGame, MiReversiGame, 'reversi_game'],
	['MiRole', LegacyMiRole, MiRole, 'role'],
	['MiRoleAssignment', LegacyMiRoleAssignment, MiRoleAssignment, 'role_assignment'],
	['MiSignin', LegacyMiSignin, MiSignin, 'signin'],
	['MiSwSubscription', LegacyMiSwSubscription, MiSwSubscription, 'sw_subscription'],
	['MiSystemAccount', LegacyMiSystemAccount, MiSystemAccount, 'system_account'],
	['MiSystemWebhook', LegacyMiSystemWebhook, MiSystemWebhook, 'system_webhook'],
	['MiUsedUsername', LegacyMiUsedUsername, MiUsedUsername, 'used_username'],
	['MiUser', LegacyMiUser, MiUser, 'user'],
	['MiUserIp', LegacyMiUserIp, MiUserIp, 'user_ip'],
	['MiUserKeypair', LegacyMiUserKeypair, MiUserKeypair, 'user_keypair'],
	['MiUserList', LegacyMiUserList, MiUserList, 'user_list'],
	['MiUserListFavorite', LegacyMiUserListFavorite, MiUserListFavorite, 'user_list_favorite'],
	['MiUserListMembership', LegacyMiUserListMembership, MiUserListMembership, 'user_list_membership'],
	['MiUserMemo', LegacyMiUserMemo, MiUserMemo, 'user_memo'],
	['MiUserNotePining', LegacyMiUserNotePining, MiUserNotePining, 'user_note_pining'],
	['MiUserPending', LegacyMiUserPending, MiUserPending, 'user_pending'],
	['MiUserProfile', LegacyMiUserProfile, MiUserProfile, 'user_profile'],
	['MiUserPublickey', LegacyMiUserPublickey, MiUserPublickey, 'user_publickey'],
	['MiUserSecurityKey', LegacyMiUserSecurityKey, MiUserSecurityKey, 'user_security_key'],
	['MiWebhook', LegacyMiWebhook, MiWebhook, 'webhook'],
] as const;

for (const [name, legacy, feature, table] of entities) {
	test(`${name} keeps one entity constructor and its table mapping`, () => {
		expect(legacy).toBe(feature);
		const entries = getMetadataArgsStorage().tables.filter(entry => entry.target === feature);
		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe(table);
	});
}
