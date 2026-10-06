/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import { CoreModule } from '../CoreModule.js';

import { AbuseReportNotificationRecipientEntityService } from '../../../../features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';

import { AbuseUserReportEntityService } from '../../../../features/moderation/backend/serializers/AbuseUserReportEntityService.js';

import { AnnouncementEntityService } from '../../../../features/announcements/backend/serializers/AnnouncementEntityService.js';

import { AntennaEntityService } from '../../../../features/timelines/backend/serializers/AntennaEntityService.js';

import { AppEntityService } from '../../../../features/auth/backend/serializers/AppEntityService.js';

import { AuthSessionEntityService } from '../../../../features/auth/backend/serializers/AuthSessionEntityService.js';

import { BlockingEntityService } from '../../../../features/relationships/backend/serializers/BlockingEntityService.js';

import { ChannelEntityService } from '../../../../features/channels/backend/serializers/ChannelEntityService.js';

import { ChatEntityService } from '../../../../features/chat/backend/serializers/ChatEntityService.js';

import { ClipEntityService } from '../../../../features/collections/backend/serializers/ClipEntityService.js';

import { DriveFileEntityService } from '../../../../features/drive/backend/serializers/DriveFileEntityService.js';

import { DriveFolderEntityService } from '../../../../features/drive/backend/serializers/DriveFolderEntityService.js';

import { EmojiEntityService } from '../../../../features/emojis/backend/serializers/EmojiEntityService.js';

import { FlashEntityService } from '../../../../features/play/backend/serializers/FlashEntityService.js';

import { FlashLikeEntityService } from '../../../../features/play/backend/serializers/FlashLikeEntityService.js';

import { FollowingEntityService } from '../../../../features/relationships/backend/serializers/FollowingEntityService.js';

import { FollowRequestEntityService } from '../../../../features/relationships/backend/serializers/FollowRequestEntityService.js';

import { GalleryLikeEntityService } from '../../../../features/gallery/backend/serializers/GalleryLikeEntityService.js';

import { GalleryPostEntityService } from '../../../../features/gallery/backend/serializers/GalleryPostEntityService.js';

import { HashtagEntityService } from '../../../../features/discovery/backend/serializers/HashtagEntityService.js';

import { InstanceEntityService } from '../../../../features/instance/backend/serializers/InstanceEntityService.js';

import { InviteCodeEntityService } from '../../../../features/auth/backend/serializers/InviteCodeEntityService.js';

import { MetaEntityService } from '../../../../features/instance/backend/serializers/MetaEntityService.js';

import { ModerationLogEntityService } from '../../../../features/moderation/backend/serializers/ModerationLogEntityService.js';

import { MutingEntityService } from '../../../../features/relationships/backend/serializers/MutingEntityService.js';

import { NoteDraftEntityService } from '../../../../features/notes/backend/serializers/NoteDraftEntityService.js';

import { NoteEntityService } from '../../../../features/notes/backend/serializers/NoteEntityService.js';

import { NoteFavoriteEntityService } from '../../../../features/collections/backend/serializers/NoteFavoriteEntityService.js';

import { NoteReactionEntityService } from '../../../../features/notes/backend/serializers/NoteReactionEntityService.js';

import { NotificationEntityService } from '../../../../features/notifications/backend/serializers/NotificationEntityService.js';

import { PageEntityService } from '../../../../features/pages/backend/serializers/PageEntityService.js';

import { PageLikeEntityService } from '../../../../features/pages/backend/serializers/PageLikeEntityService.js';

import { RenoteMutingEntityService } from '../../../../features/relationships/backend/serializers/RenoteMutingEntityService.js';

import { ReversiGameEntityService } from '../../../../features/games/backend/serializers/ReversiGameEntityService.js';

import { RoleEntityService } from '../../../../features/roles/backend/serializers/RoleEntityService.js';

import { SigninEntityService } from '../../../../features/auth/backend/serializers/SigninEntityService.js';

import { SystemWebhookEntityService } from '../../../../features/integrations/backend/serializers/SystemWebhookEntityService.js';

import { UserEntityService } from '../../../../features/users/backend/serializers/UserEntityService.js';

import { UserListEntityService } from '../../../../features/relationships/backend/serializers/UserListEntityService.js';

// Keep one constructor/DI token across the temporary compatibility bridges.
const coreProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CoreModule) as unknown[];

const cases = [
	[AbuseReportNotificationRecipientEntityService, 3],
	[AbuseUserReportEntityService, 3],
	[AnnouncementEntityService, 3],
	[AntennaEntityService, 2],
	[AppEntityService, 2],
	[AuthSessionEntityService, 2],
	[BlockingEntityService, 3],
	[ChannelEntityService, 9],
	[ChatEntityService, 7],
	[ClipEntityService, 5],
	[DriveFileEntityService, 8],
	[DriveFolderEntityService, 3],
	[EmojiEntityService, 2],
	[FlashEntityService, 4],
	[FlashLikeEntityService, 2],
	[FollowingEntityService, 3],
	[FollowRequestEntityService, 2],
	[GalleryLikeEntityService, 2],
	[GalleryPostEntityService, 5],
	[HashtagEntityService, 0],
	[InstanceEntityService, 3],
	[InviteCodeEntityService, 3],
	[MetaEntityService, 4],
	[ModerationLogEntityService, 3],
	[MutingEntityService, 3],
	[NoteDraftEntityService, 3],
	[NoteEntityService, 9],
	[NoteFavoriteEntityService, 3],
	[NoteReactionEntityService, 2],
	[NotificationEntityService, 5],
	[PageEntityService, 6],
	[PageLikeEntityService, 2],
	[RenoteMutingEntityService, 3],
	[ReversiGameEntityService, 3],
	[RoleEntityService, 3],
	[SigninEntityService, 1],
	[SystemWebhookEntityService, 1],
	[UserEntityService, 14],
	[UserListEntityService, 4],
] as const;

for (const [moved, parameterCount] of cases) {
	test(`${moved.name} is registered from its canonical feature module`, () => {
		expect(coreProviders.filter(provider => provider === moved)).toHaveLength(1);
		expect(Reflect.getMetadata('design:paramtypes', moved) ?? []).toHaveLength(parameterCount);
	});
}
