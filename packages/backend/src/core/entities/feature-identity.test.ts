/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, test } from 'vitest';
import { AbuseReportNotificationRecipientEntityService as LegacyAbuseReportNotificationRecipientEntityService } from './AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationRecipientEntityService } from '../../../../features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService as LegacyAbuseUserReportEntityService } from './AbuseUserReportEntityService.js';
import { AbuseUserReportEntityService } from '../../../../features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { AnnouncementEntityService as LegacyAnnouncementEntityService } from './AnnouncementEntityService.js';
import { AnnouncementEntityService } from '../../../../features/announcements/backend/serializers/AnnouncementEntityService.js';
import { AntennaEntityService as LegacyAntennaEntityService } from './AntennaEntityService.js';
import { AntennaEntityService } from '../../../../features/timelines/backend/serializers/AntennaEntityService.js';
import { AppEntityService as LegacyAppEntityService } from './AppEntityService.js';
import { AppEntityService } from '../../../../features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService as LegacyAuthSessionEntityService } from './AuthSessionEntityService.js';
import { AuthSessionEntityService } from '../../../../features/auth/backend/serializers/AuthSessionEntityService.js';
import { BlockingEntityService as LegacyBlockingEntityService } from './BlockingEntityService.js';
import { BlockingEntityService } from '../../../../features/relationships/backend/serializers/BlockingEntityService.js';
import { ChannelEntityService as LegacyChannelEntityService } from './ChannelEntityService.js';
import { ChannelEntityService } from '../../../../features/channels/backend/serializers/ChannelEntityService.js';
import { ChatEntityService as LegacyChatEntityService } from './ChatEntityService.js';
import { ChatEntityService } from '../../../../features/chat/backend/serializers/ChatEntityService.js';
import { ClipEntityService as LegacyClipEntityService } from './ClipEntityService.js';
import { ClipEntityService } from '../../../../features/collections/backend/serializers/ClipEntityService.js';
import { DriveFileEntityService as LegacyDriveFileEntityService } from './DriveFileEntityService.js';
import { DriveFileEntityService } from '../../../../features/drive/backend/serializers/DriveFileEntityService.js';
import { DriveFolderEntityService as LegacyDriveFolderEntityService } from './DriveFolderEntityService.js';
import { DriveFolderEntityService } from '../../../../features/drive/backend/serializers/DriveFolderEntityService.js';
import { EmojiEntityService as LegacyEmojiEntityService } from './EmojiEntityService.js';
import { EmojiEntityService } from '../../../../features/emojis/backend/serializers/EmojiEntityService.js';
import { FlashEntityService as LegacyFlashEntityService } from './FlashEntityService.js';
import { FlashEntityService } from '../../../../features/play/backend/serializers/FlashEntityService.js';
import { FlashLikeEntityService as LegacyFlashLikeEntityService } from './FlashLikeEntityService.js';
import { FlashLikeEntityService } from '../../../../features/play/backend/serializers/FlashLikeEntityService.js';
import { FollowingEntityService as LegacyFollowingEntityService } from './FollowingEntityService.js';
import { FollowingEntityService } from '../../../../features/relationships/backend/serializers/FollowingEntityService.js';
import { FollowRequestEntityService as LegacyFollowRequestEntityService } from './FollowRequestEntityService.js';
import { FollowRequestEntityService } from '../../../../features/relationships/backend/serializers/FollowRequestEntityService.js';
import { GalleryLikeEntityService as LegacyGalleryLikeEntityService } from './GalleryLikeEntityService.js';
import { GalleryLikeEntityService } from '../../../../features/gallery/backend/serializers/GalleryLikeEntityService.js';
import { GalleryPostEntityService as LegacyGalleryPostEntityService } from './GalleryPostEntityService.js';
import { GalleryPostEntityService } from '../../../../features/gallery/backend/serializers/GalleryPostEntityService.js';
import { HashtagEntityService as LegacyHashtagEntityService } from './HashtagEntityService.js';
import { HashtagEntityService } from '../../../../features/discovery/backend/serializers/HashtagEntityService.js';
import { InstanceEntityService as LegacyInstanceEntityService } from './InstanceEntityService.js';
import { InstanceEntityService } from '../../../../features/instance/backend/serializers/InstanceEntityService.js';
import { InviteCodeEntityService as LegacyInviteCodeEntityService } from './InviteCodeEntityService.js';
import { InviteCodeEntityService } from '../../../../features/auth/backend/serializers/InviteCodeEntityService.js';
import { MetaEntityService as LegacyMetaEntityService } from './MetaEntityService.js';
import { MetaEntityService } from '../../../../features/instance/backend/serializers/MetaEntityService.js';
import { ModerationLogEntityService as LegacyModerationLogEntityService } from './ModerationLogEntityService.js';
import { ModerationLogEntityService } from '../../../../features/moderation/backend/serializers/ModerationLogEntityService.js';
import { MutingEntityService as LegacyMutingEntityService } from './MutingEntityService.js';
import { MutingEntityService } from '../../../../features/relationships/backend/serializers/MutingEntityService.js';
import { NoteDraftEntityService as LegacyNoteDraftEntityService } from './NoteDraftEntityService.js';
import { NoteDraftEntityService } from '../../../../features/notes/backend/serializers/NoteDraftEntityService.js';
import { NoteEntityService as LegacyNoteEntityService } from './NoteEntityService.js';
import { NoteEntityService } from '../../../../features/notes/backend/serializers/NoteEntityService.js';
import { NoteFavoriteEntityService as LegacyNoteFavoriteEntityService } from './NoteFavoriteEntityService.js';
import { NoteFavoriteEntityService } from '../../../../features/collections/backend/serializers/NoteFavoriteEntityService.js';
import { NoteReactionEntityService as LegacyNoteReactionEntityService } from './NoteReactionEntityService.js';
import { NoteReactionEntityService } from '../../../../features/notes/backend/serializers/NoteReactionEntityService.js';
import { NotificationEntityService as LegacyNotificationEntityService } from './NotificationEntityService.js';
import { NotificationEntityService } from '../../../../features/notifications/backend/serializers/NotificationEntityService.js';
import { PageEntityService as LegacyPageEntityService } from './PageEntityService.js';
import { PageEntityService } from '../../../../features/pages/backend/serializers/PageEntityService.js';
import { PageLikeEntityService as LegacyPageLikeEntityService } from './PageLikeEntityService.js';
import { PageLikeEntityService } from '../../../../features/pages/backend/serializers/PageLikeEntityService.js';
import { RenoteMutingEntityService as LegacyRenoteMutingEntityService } from './RenoteMutingEntityService.js';
import { RenoteMutingEntityService } from '../../../../features/relationships/backend/serializers/RenoteMutingEntityService.js';
import { ReversiGameEntityService as LegacyReversiGameEntityService } from './ReversiGameEntityService.js';
import { ReversiGameEntityService } from '../../../../features/games/backend/serializers/ReversiGameEntityService.js';
import { RoleEntityService as LegacyRoleEntityService } from './RoleEntityService.js';
import { RoleEntityService } from '../../../../features/roles/backend/serializers/RoleEntityService.js';
import { SigninEntityService as LegacySigninEntityService } from './SigninEntityService.js';
import { SigninEntityService } from '../../../../features/auth/backend/serializers/SigninEntityService.js';
import { SystemWebhookEntityService as LegacySystemWebhookEntityService } from './SystemWebhookEntityService.js';
import { SystemWebhookEntityService } from '../../../../features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { UserEntityService as LegacyUserEntityService } from './UserEntityService.js';
import { UserEntityService } from '../../../../features/users/backend/serializers/UserEntityService.js';
import { UserListEntityService as LegacyUserListEntityService } from './UserListEntityService.js';
import { UserListEntityService } from '../../../../features/relationships/backend/serializers/UserListEntityService.js';

// Keep one constructor/DI token across the temporary compatibility bridges.
const cases = [
	[LegacyAbuseReportNotificationRecipientEntityService, AbuseReportNotificationRecipientEntityService, 3],
	[LegacyAbuseUserReportEntityService, AbuseUserReportEntityService, 3],
	[LegacyAnnouncementEntityService, AnnouncementEntityService, 3],
	[LegacyAntennaEntityService, AntennaEntityService, 2],
	[LegacyAppEntityService, AppEntityService, 2],
	[LegacyAuthSessionEntityService, AuthSessionEntityService, 2],
	[LegacyBlockingEntityService, BlockingEntityService, 3],
	[LegacyChannelEntityService, ChannelEntityService, 9],
	[LegacyChatEntityService, ChatEntityService, 7],
	[LegacyClipEntityService, ClipEntityService, 5],
	[LegacyDriveFileEntityService, DriveFileEntityService, 8],
	[LegacyDriveFolderEntityService, DriveFolderEntityService, 3],
	[LegacyEmojiEntityService, EmojiEntityService, 2],
	[LegacyFlashEntityService, FlashEntityService, 4],
	[LegacyFlashLikeEntityService, FlashLikeEntityService, 2],
	[LegacyFollowingEntityService, FollowingEntityService, 3],
	[LegacyFollowRequestEntityService, FollowRequestEntityService, 2],
	[LegacyGalleryLikeEntityService, GalleryLikeEntityService, 2],
	[LegacyGalleryPostEntityService, GalleryPostEntityService, 5],
	[LegacyHashtagEntityService, HashtagEntityService, 0],
	[LegacyInstanceEntityService, InstanceEntityService, 3],
	[LegacyInviteCodeEntityService, InviteCodeEntityService, 3],
	[LegacyMetaEntityService, MetaEntityService, 4],
	[LegacyModerationLogEntityService, ModerationLogEntityService, 3],
	[LegacyMutingEntityService, MutingEntityService, 3],
	[LegacyNoteDraftEntityService, NoteDraftEntityService, 3],
	[LegacyNoteEntityService, NoteEntityService, 9],
	[LegacyNoteFavoriteEntityService, NoteFavoriteEntityService, 3],
	[LegacyNoteReactionEntityService, NoteReactionEntityService, 2],
	[LegacyNotificationEntityService, NotificationEntityService, 5],
	[LegacyPageEntityService, PageEntityService, 6],
	[LegacyPageLikeEntityService, PageLikeEntityService, 2],
	[LegacyRenoteMutingEntityService, RenoteMutingEntityService, 3],
	[LegacyReversiGameEntityService, ReversiGameEntityService, 3],
	[LegacyRoleEntityService, RoleEntityService, 3],
	[LegacySigninEntityService, SigninEntityService, 1],
	[LegacySystemWebhookEntityService, SystemWebhookEntityService, 1],
	[LegacyUserEntityService, UserEntityService, 14],
	[LegacyUserListEntityService, UserListEntityService, 4],
] as const;

for (const [legacy, moved, parameterCount] of cases) {
	test(`${moved.name} retains its identity and constructor metadata`, () => {
		expect(legacy).toBe(moved);
		expect(Reflect.getMetadata('design:paramtypes', moved) ?? []).toHaveLength(parameterCount);
	});
}
