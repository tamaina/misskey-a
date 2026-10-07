/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import { CoreModule } from '@features/boot/backend/assembly/CoreModule.js';

import { AbuseReportNotificationService } from '@features/moderation/backend/services/AbuseReportNotificationService.js';

import { AbuseReportService } from '@features/moderation/backend/services/AbuseReportService.js';

import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';

import { AccountUpdateService } from '@features/users/backend/services/AccountUpdateService.js';

import { AchievementService } from '@features/users/backend/services/AchievementService.js';

import { ApAudienceService } from '@features/federation/backend/services/ApAudienceService.js';

import { ApDbResolverService } from '@features/federation/backend/services/ApDbResolverService.js';

import { ApDeliverManagerService } from '@features/federation/backend/services/ApDeliverManagerService.js';

import { ApInboxService } from '@features/federation/backend/services/ApInboxService.js';

import { ApLoggerService } from '@features/federation/backend/services/ApLoggerService.js';

import { ApMfmService } from '@features/federation/backend/services/ApMfmService.js';

import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';

import { ApRequestService } from '@features/federation/backend/services/ApRequestService.js';

import { ApResolverService } from '@features/federation/backend/services/ApResolverService.js';

import { JsonLdService } from '@features/federation/backend/services/JsonLdService.js';

import { ApImageService } from '@features/federation/backend/services/ApImageService.js';

import { ApMentionService } from '@features/federation/backend/services/ApMentionService.js';

import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';

import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';

import { ApQuestionService } from '@features/federation/backend/services/ApQuestionService.js';

import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';

import { AntennaService } from '@features/timelines/backend/services/AntennaService.js';

import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';

import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';

import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';

import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';

import { ChartLoggerService } from '@features/statistics/backend/services/ChartLoggerService.js';

import { ChartManagementService } from '@features/statistics/backend/services/ChartManagementService.js';

import { ChatService } from '@features/chat/backend/services/ChatService.js';

import { ClipService } from '@features/collections/backend/services/ClipService.js';

import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';

import { DeleteAccountService } from '@features/users/backend/services/DeleteAccountService.js';

import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';

import { DriveService } from '@features/drive/backend/services/DriveService.js';

import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';

import { FanoutTimelineService } from '@features/timelines/backend/services/FanoutTimelineService.js';

import { FeaturedService } from '@features/discovery/backend/services/FeaturedService.js';

import { FederatedInstanceService } from '@features/federation/backend/services/FederatedInstanceService.js';

import { FetchInstanceMetadataService } from '@features/federation/backend/services/FetchInstanceMetadataService.js';

import { FileInfoService } from '@features/drive/backend/services/FileInfoService.js';

import { FlashService } from '@features/play/backend/services/FlashService.js';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';

import { HashtagService } from '@features/discovery/backend/services/HashtagService.js';

import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

import { IdService } from '@features/runtime/backend/services/IdService.js';

import { ImageProcessingService } from '@features/drive/backend/services/ImageProcessingService.js';

import { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';

import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';

import { MetaService } from '@features/instance/backend/services/MetaService.js';

import { MfmService } from '@features/markup/backend/services/MfmService.js';

import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

import { NoteCreateService } from '@features/notes/backend/services/NoteCreateService.js';

import { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';

import { NoteDraftService } from '@features/notes/backend/services/NoteDraftService.js';

import { NotePiningService } from '@features/notes/backend/services/NotePiningService.js';

import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';

import { PageService } from '@features/pages/backend/services/PageService.js';

import { PollService } from '@features/notes/backend/services/PollService.js';

import { PushNotificationService } from '@features/notifications/backend/services/PushNotificationService.js';

import { QueueService } from '@features/runtime/backend/services/QueueService.js';

import { ReactionsBufferingService } from '@features/notes/backend/services/ReactionsBufferingService.js';

import { ReactionService } from '@features/notes/backend/services/ReactionService.js';

import { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';

import { RelayService } from '@features/federation/backend/services/RelayService.js';

import { RemoteLoggerService } from '@features/runtime/backend/services/RemoteLoggerService.js';

import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';

import { ReversiService } from '@features/games/backend/services/ReversiService.js';

import { RoleService } from '@features/roles/backend/services/RoleService.js';

import { S3Service } from '@features/runtime/backend/services/S3Service.js';

import { SearchService } from '@features/note-search/backend/services/SearchService.js';

import { SensitiveMediaDetectionService } from '@features/drive/backend/services/SensitiveMediaDetectionService.js';

import { SignupService } from '@features/auth/backend/services/SignupService.js';

import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';

import { SystemWebhookService } from '@features/integrations/backend/services/SystemWebhookService.js';

import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';

import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';

import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';

import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';

import { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';

import { UserListService } from '@features/relationships/backend/services/UserListService.js';

import { UserMutingService } from '@features/relationships/backend/services/UserMutingService.js';

import { UserRenoteMutingService } from '@features/relationships/backend/services/UserRenoteMutingService.js';

import { UserSearchService } from '@features/discovery/backend/services/UserSearchService.js';

import { UserService } from '@features/users/backend/services/UserService.js';

import { UserSuspendService } from '@features/moderation/backend/services/UserSuspendService.js';

import { UserWebhookService } from '@features/integrations/backend/services/UserWebhookService.js';

import { VideoProcessingService } from '@features/drive/backend/services/VideoProcessingService.js';

import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';

import { WebfingerService } from '@features/federation/backend/services/WebfingerService.js';

import { WebhookTestService } from '@features/integrations/backend/services/WebhookTestService.js';

const coreProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CoreModule) as unknown[];

const services = [
	['AbuseReportNotificationService', AbuseReportNotificationService, 10],
	['AbuseReportService', AbuseReportService, 8],
	['AccountMoveService', AccountMoveService, 21],
	['AccountUpdateService', AccountUpdateService, 5],
	['AchievementService', AchievementService, 2],
	['ApAudienceService', ApAudienceService, 1],
	['ApDbResolverService', ApDbResolverService, 7],
	['ApDeliverManagerService', ApDeliverManagerService, 3],
	['ApInboxService', ApInboxService, 27],
	['ApLoggerService', ApLoggerService, 1],
	['ApMfmService', ApMfmService, 1],
	['ApRendererService', ApRendererService, 16],
	['ApRequestService', ApRequestService, 5],
	['ApResolverService', ApResolverService, 1],
	['JsonLdService', JsonLdService, 1],
	['ApImageService', ApImageService, 5],
	['ApMentionService', ApMentionService, 1],
	['ApNoteService', ApNoteService, 18],
	['ApPersonService', ApPersonService, 10],
	['ApQuestionService', ApQuestionService, 7],
	['AnnouncementService', AnnouncementService, 7],
	['AntennaService', AntennaService, 8],
	['AvatarDecorationService', AvatarDecorationService, 5],
	['CaptchaService', CaptchaService, 3],
	['ChannelFollowingService', ChannelFollowingService, 6],
	['ChannelMutingService', ChannelMutingService, 6],
	['ChartLoggerService', ChartLoggerService, 1],
	['ChartManagementService', ChartManagementService, 13],
	['ChatService', ChatService, 23],
	['ClipService', ClipService, 5],
	['CustomEmojiService', CustomEmojiService, 7],
	['DeleteAccountService', DeleteAccountService, 9],
	['DownloadService', DownloadService, 3],
	['DriveService', DriveService, 23],
	['FanoutTimelineEndpointService', FanoutTimelineEndpointService, 7],
	['FanoutTimelineService', FanoutTimelineService, 2],
	['FeaturedService', FeaturedService, 1],
	['FederatedInstanceService', FederatedInstanceService, 4],
	['FetchInstanceMetadataService', FetchInstanceMetadataService, 4],
	['FileInfoService', FileInfoService, 2],
	['FlashService', FlashService, 3],
	['GlobalEventService', GlobalEventService, 2],
	['HashtagService', HashtagService, 8],
	['HttpRequestService', HttpRequestService, 1],
	['IdService', IdService, 1],
	['ImageProcessingService', ImageProcessingService, 0],
	['InternalStorageService', InternalStorageService, 1],
	['LoggerService', LoggerService, 0],
	['MetaService', MetaService, 4],
	['MfmService', MfmService, 1],
	['ModerationLogService', ModerationLogService, 2],
	['NoteCreateService', NoteCreateService, 41],
	['NoteDeleteService', NoteDeleteService, 16],
	['NoteDraftService', NoteDraftService, 10],
	['NotePiningService', NotePiningService, 10],
	['NotificationService', NotificationService, 9],
	['PageService', PageService, 7],
	['PollService', PollService, 11],
	['PushNotificationService', PushNotificationService, 5],
	['QueueService', QueueService, 11],
	['ReactionsBufferingService', ReactionsBufferingService, 4],
	['ReactionService', ReactionService, 19],
	['RegistryApiService', RegistryApiService, 3],
	['RelayService', RelayService, 5],
	['RemoteLoggerService', RemoteLoggerService, 1],
	['RemoteUserResolveService', RemoteUserResolveService, 7],
	['ReversiService', ReversiService, 8],
	['RoleService', RoleService, 14],
	['S3Service', S3Service, 1],
	['SearchService', SearchService, 8],
	['SensitiveMediaDetectionService', SensitiveMediaDetectionService, 3],
	['SignupService', SignupService, 11],
	['SystemAccountService', SystemAccountService, 7],
	['SystemWebhookService', SystemWebhookService, 6],
	['TelemetryService', TelemetryService, 0],
	['UserAuthService', UserAuthService, 3],
	['UserBlockingService', UserBlockingService, 13],
	['UserFollowingService', UserFollowingService, 21],
	['UserKeypairService', UserKeypairService, 2],
	['UserListService', UserListService, 9],
	['UserMutingService', UserMutingService, 3],
	['UserRenoteMutingService', UserRenoteMutingService, 3],
	['UserSearchService', UserSearchService, 6],
	['UserService', UserService, 4],
	['UserSuspendService', UserSuspendService, 8],
	['UserWebhookService', UserWebhookService, 3],
	['VideoProcessingService', VideoProcessingService, 2],
	['WebAuthnService', WebAuthnService, 4],
	['WebfingerService', WebfingerService, 1],
	['WebhookTestService', WebhookTestService, 4],
] as const;

for (const [name, feature, parameterCount] of services) {
	test(`${name} is registered as the canonical feature provider`, () => {
		const registrations = coreProviders.filter(provider => provider === feature || (typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === feature));
		expect(registrations).toHaveLength(1);
		if (registrations[0] === feature) {
			expect(Reflect.getMetadata('design:paramtypes', feature) ?? []).toHaveLength(parameterCount);
		} else {
			expect(registrations[0]).toHaveProperty('useFactory');
			expect(feature.length).toBe(parameterCount);
		}
	});
}
