/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	FindOneOptions,
	ObjectLiteral,
	Repository,
} from 'typeorm';
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
import { MiFollowing } from '@features/relationships/backend/models/Following.js';
import { MiFollowRequest } from '@features/relationships/backend/models/FollowRequest.js';
import { MiGalleryLike } from '@features/collections/backend/models/GalleryLike.js';
import { MiGalleryPost } from '@features/collections/backend/models/GalleryPost.js';
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
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

export interface MiRepository<T extends ObjectLiteral> {
	insertOne(this: Repository<T> & MiRepository<T>, entity: QueryDeepPartialEntity<T>, findOptions?: Pick<FindOneOptions<T>, 'relations'>): Promise<T>;
}

export const miRepository = {
	async insertOne(entity, findOptions?) {
		return await this.insert(entity).then(x => this.findOneOrFail({ where: x.identifiers[0], ...findOptions }));
	},
} satisfies MiRepository<ObjectLiteral>;

export {
	MiAbuseUserReport,
	MiAbuseReportNotificationRecipient,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiBlocking,
	MiChannelFollowing,
	MiChannelFavorite,
	MiChannelMuting,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiDriveFile,
	MiDriveFolder,
	MiEmoji,
	MiFollowing,
	MiFollowRequest,
	MiGalleryLike,
	MiGalleryPost,
	MiHashtag,
	MiInstance,
	MiMeta,
	MiModerationLog,
	MiMuting,
	MiRenoteMuting,
	MiNote,
	MiNoteDraft,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiPage,
	MiPageLike,
	MiPasswordResetRequest,
	MiPoll,
	MiPollVote,
	MiPromoNote,
	MiPromoRead,
	MiRegistrationTicket,
	MiRegistryItem,
	MiRelay,
	MiSignin,
	MiSwSubscription,
	MiSystemAccount,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
	MiSystemWebhook,
	MiChannel,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
	MiChatMessage,
	MiChatRoom,
	MiChatRoomMembership,
	MiChatRoomInvitation,
	MiChatApproval,
	MiBubbleGameRecord,
	MiReversiGame,
};

export type AbuseUserReportsRepository = Repository<MiAbuseUserReport> & MiRepository<MiAbuseUserReport>;
export type AbuseReportNotificationRecipientRepository =
	Repository<MiAbuseReportNotificationRecipient>
	& MiRepository<MiAbuseReportNotificationRecipient>;
export type AccessTokensRepository = Repository<MiAccessToken> & MiRepository<MiAccessToken>;
export type AdsRepository = Repository<MiAd> & MiRepository<MiAd>;
export type AnnouncementsRepository = Repository<MiAnnouncement> & MiRepository<MiAnnouncement>;
export type AnnouncementReadsRepository = Repository<MiAnnouncementRead> & MiRepository<MiAnnouncementRead>;
export type AntennasRepository = Repository<MiAntenna> & MiRepository<MiAntenna>;
export type AppsRepository = Repository<MiApp> & MiRepository<MiApp>;
export type AvatarDecorationsRepository = Repository<MiAvatarDecoration> & MiRepository<MiAvatarDecoration>;
export type AuthSessionsRepository = Repository<MiAuthSession> & MiRepository<MiAuthSession>;
export type BlockingsRepository = Repository<MiBlocking> & MiRepository<MiBlocking>;
export type ChannelFollowingsRepository = Repository<MiChannelFollowing> & MiRepository<MiChannelFollowing>;
export type ChannelFavoritesRepository = Repository<MiChannelFavorite> & MiRepository<MiChannelFavorite>;
export type ChannelMutingRepository = Repository<MiChannelMuting> & MiRepository<MiChannelMuting>;
export type ClipsRepository = Repository<MiClip> & MiRepository<MiClip>;
export type ClipNotesRepository = Repository<MiClipNote> & MiRepository<MiClipNote>;
export type ClipFavoritesRepository = Repository<MiClipFavorite> & MiRepository<MiClipFavorite>;
export type DriveFilesRepository = Repository<MiDriveFile> & MiRepository<MiDriveFile>;
export type DriveFoldersRepository = Repository<MiDriveFolder> & MiRepository<MiDriveFolder>;
export type EmojisRepository = Repository<MiEmoji> & MiRepository<MiEmoji>;
export type FollowingsRepository = Repository<MiFollowing> & MiRepository<MiFollowing>;
export type FollowRequestsRepository = Repository<MiFollowRequest> & MiRepository<MiFollowRequest>;
export type GalleryLikesRepository = Repository<MiGalleryLike> & MiRepository<MiGalleryLike>;
export type GalleryPostsRepository = Repository<MiGalleryPost> & MiRepository<MiGalleryPost>;
export type HashtagsRepository = Repository<MiHashtag> & MiRepository<MiHashtag>;
export type InstancesRepository = Repository<MiInstance> & MiRepository<MiInstance>;
export type MetasRepository = Repository<MiMeta> & MiRepository<MiMeta>;
export type ModerationLogsRepository = Repository<MiModerationLog> & MiRepository<MiModerationLog>;
export type MutingsRepository = Repository<MiMuting> & MiRepository<MiMuting>;
export type RenoteMutingsRepository = Repository<MiRenoteMuting> & MiRepository<MiRenoteMuting>;
export type NotesRepository = Repository<MiNote> & MiRepository<MiNote>;
export type NoteDraftsRepository = Repository<MiNoteDraft> & MiRepository<MiNoteDraft>;
export type NoteFavoritesRepository = Repository<MiNoteFavorite> & MiRepository<MiNoteFavorite>;
export type NoteReactionsRepository = Repository<MiNoteReaction> & MiRepository<MiNoteReaction>;
export type NoteThreadMutingsRepository = Repository<MiNoteThreadMuting> & MiRepository<MiNoteThreadMuting>;
export type PagesRepository = Repository<MiPage> & MiRepository<MiPage>;
export type PageLikesRepository = Repository<MiPageLike> & MiRepository<MiPageLike>;
export type PasswordResetRequestsRepository = Repository<MiPasswordResetRequest> & MiRepository<MiPasswordResetRequest>;
export type PollsRepository = Repository<MiPoll> & MiRepository<MiPoll>;
export type PollVotesRepository = Repository<MiPollVote> & MiRepository<MiPollVote>;
export type PromoNotesRepository = Repository<MiPromoNote> & MiRepository<MiPromoNote>;
export type PromoReadsRepository = Repository<MiPromoRead> & MiRepository<MiPromoRead>;
export type RegistrationTicketsRepository = Repository<MiRegistrationTicket> & MiRepository<MiRegistrationTicket>;
export type RegistryItemsRepository = Repository<MiRegistryItem> & MiRepository<MiRegistryItem>;
export type RelaysRepository = Repository<MiRelay> & MiRepository<MiRelay>;
export type SigninsRepository = Repository<MiSignin> & MiRepository<MiSignin>;
export type SwSubscriptionsRepository = Repository<MiSwSubscription> & MiRepository<MiSwSubscription>;
export type SystemAccountsRepository = Repository<MiSystemAccount> & MiRepository<MiSystemAccount>;
export type UsedUsernamesRepository = Repository<MiUsedUsername> & MiRepository<MiUsedUsername>;
export type UsersRepository = Repository<MiUser> & MiRepository<MiUser>;
export type UserIpsRepository = Repository<MiUserIp> & MiRepository<MiUserIp>;
export type UserKeypairsRepository = Repository<MiUserKeypair> & MiRepository<MiUserKeypair>;
export type UserListsRepository = Repository<MiUserList> & MiRepository<MiUserList>;
export type UserListFavoritesRepository = Repository<MiUserListFavorite> & MiRepository<MiUserListFavorite>;
export type UserListMembershipsRepository = Repository<MiUserListMembership> & MiRepository<MiUserListMembership>;
export type UserNotePiningsRepository = Repository<MiUserNotePining> & MiRepository<MiUserNotePining>;
export type UserPendingsRepository = Repository<MiUserPending> & MiRepository<MiUserPending>;
export type UserProfilesRepository = Repository<MiUserProfile> & MiRepository<MiUserProfile>;
export type UserPublickeysRepository = Repository<MiUserPublickey> & MiRepository<MiUserPublickey>;
export type UserSecurityKeysRepository = Repository<MiUserSecurityKey> & MiRepository<MiUserSecurityKey>;
export type WebhooksRepository = Repository<MiWebhook> & MiRepository<MiWebhook>;
export type SystemWebhooksRepository = Repository<MiSystemWebhook> & MiRepository<MiSystemWebhook>;
export type ChannelsRepository = Repository<MiChannel> & MiRepository<MiChannel>;
export type RetentionAggregationsRepository = Repository<MiRetentionAggregation> & MiRepository<MiRetentionAggregation>;
export type RolesRepository = Repository<MiRole> & MiRepository<MiRole>;
export type RoleAssignmentsRepository = Repository<MiRoleAssignment> & MiRepository<MiRoleAssignment>;
export type FlashsRepository = Repository<MiFlash> & MiRepository<MiFlash>;
export type FlashLikesRepository = Repository<MiFlashLike> & MiRepository<MiFlashLike>;
export type UserMemoRepository = Repository<MiUserMemo> & MiRepository<MiUserMemo>;
export type ChatMessagesRepository = Repository<MiChatMessage> & MiRepository<MiChatMessage>;
export type ChatRoomsRepository = Repository<MiChatRoom> & MiRepository<MiChatRoom>;
export type ChatRoomMembershipsRepository = Repository<MiChatRoomMembership> & MiRepository<MiChatRoomMembership>;
export type ChatRoomInvitationsRepository = Repository<MiChatRoomInvitation> & MiRepository<MiChatRoomInvitation>;
export type ChatApprovalsRepository = Repository<MiChatApproval> & MiRepository<MiChatApproval>;
export type BubbleGameRecordsRepository = Repository<MiBubbleGameRecord> & MiRepository<MiBubbleGameRecord>;
export type ReversiGamesRepository = Repository<MiReversiGame> & MiRepository<MiReversiGame>;
