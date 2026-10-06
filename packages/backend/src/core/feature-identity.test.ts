/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, test } from 'vitest';
import { AbuseReportNotificationService as LegacyAbuseReportNotificationService } from './AbuseReportNotificationService.js';
import { AbuseReportNotificationService } from '../../../features/moderation/backend/services/AbuseReportNotificationService.js';
import { AbuseReportService as LegacyAbuseReportService } from './AbuseReportService.js';
import { AbuseReportService } from '../../../features/moderation/backend/services/AbuseReportService.js';
import { AccountMoveService as LegacyAccountMoveService } from './AccountMoveService.js';
import { AccountMoveService } from '../../../features/users/backend/services/AccountMoveService.js';
import { AccountUpdateService as LegacyAccountUpdateService } from './AccountUpdateService.js';
import { AccountUpdateService } from '../../../features/users/backend/services/AccountUpdateService.js';
import { AchievementService as LegacyAchievementService } from './AchievementService.js';
import { AchievementService } from '../../../features/users/backend/services/AchievementService.js';
import { ApAudienceService as LegacyApAudienceService } from './activitypub/ApAudienceService.js';
import { ApAudienceService } from '../../../features/federation/backend/services/ApAudienceService.js';
import { ApDbResolverService as LegacyApDbResolverService } from './activitypub/ApDbResolverService.js';
import { ApDbResolverService } from '../../../features/federation/backend/services/ApDbResolverService.js';
import { ApDeliverManagerService as LegacyApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';
import { ApDeliverManagerService } from '../../../features/federation/backend/services/ApDeliverManagerService.js';
import { ApInboxService as LegacyApInboxService } from './activitypub/ApInboxService.js';
import { ApInboxService } from '../../../features/federation/backend/services/ApInboxService.js';
import { ApLoggerService as LegacyApLoggerService } from './activitypub/ApLoggerService.js';
import { ApLoggerService } from '../../../features/federation/backend/services/ApLoggerService.js';
import { ApMfmService as LegacyApMfmService } from './activitypub/ApMfmService.js';
import { ApMfmService } from '../../../features/federation/backend/services/ApMfmService.js';
import { ApRendererService as LegacyApRendererService } from './activitypub/ApRendererService.js';
import { ApRendererService } from '../../../features/federation/backend/services/ApRendererService.js';
import { ApRequestService as LegacyApRequestService } from './activitypub/ApRequestService.js';
import { ApRequestService } from '../../../features/federation/backend/services/ApRequestService.js';
import { ApResolverService as LegacyApResolverService } from './activitypub/ApResolverService.js';
import { ApResolverService } from '../../../features/federation/backend/services/ApResolverService.js';
import { JsonLdService as LegacyJsonLdService } from './activitypub/JsonLdService.js';
import { JsonLdService } from '../../../features/federation/backend/services/JsonLdService.js';
import { ApImageService as LegacyApImageService } from './activitypub/models/ApImageService.js';
import { ApImageService } from '../../../features/federation/backend/services/ApImageService.js';
import { ApMentionService as LegacyApMentionService } from './activitypub/models/ApMentionService.js';
import { ApMentionService } from '../../../features/federation/backend/services/ApMentionService.js';
import { ApNoteService as LegacyApNoteService } from './activitypub/models/ApNoteService.js';
import { ApNoteService } from '../../../features/federation/backend/services/ApNoteService.js';
import { ApPersonService as LegacyApPersonService } from './activitypub/models/ApPersonService.js';
import { ApPersonService } from '../../../features/federation/backend/services/ApPersonService.js';
import { ApQuestionService as LegacyApQuestionService } from './activitypub/models/ApQuestionService.js';
import { ApQuestionService } from '../../../features/federation/backend/services/ApQuestionService.js';
import { AnnouncementService as LegacyAnnouncementService } from './AnnouncementService.js';
import { AnnouncementService } from '../../../features/announcements/backend/services/AnnouncementService.js';
import { AntennaService as LegacyAntennaService } from './AntennaService.js';
import { AntennaService } from '../../../features/timelines/backend/services/AntennaService.js';
import { AvatarDecorationService as LegacyAvatarDecorationService } from './AvatarDecorationService.js';
import { AvatarDecorationService } from '../../../features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { CaptchaService as LegacyCaptchaService } from './CaptchaService.js';
import { CaptchaService } from '../../../features/auth/backend/services/CaptchaService.js';
import { ChannelFollowingService as LegacyChannelFollowingService } from './ChannelFollowingService.js';
import { ChannelFollowingService } from '../../../features/channels/backend/services/ChannelFollowingService.js';
import { ChannelMutingService as LegacyChannelMutingService } from './ChannelMutingService.js';
import { ChannelMutingService } from '../../../features/channels/backend/services/ChannelMutingService.js';
import { ChartLoggerService as LegacyChartLoggerService } from './chart/ChartLoggerService.js';
import { ChartLoggerService } from '../../../features/statistics/backend/services/ChartLoggerService.js';
import { ChartManagementService as LegacyChartManagementService } from './chart/ChartManagementService.js';
import { ChartManagementService } from '../../../features/statistics/backend/services/ChartManagementService.js';
import { ChatService as LegacyChatService } from './ChatService.js';
import { ChatService } from '../../../features/chat/backend/services/ChatService.js';
import { ClipService as LegacyClipService } from './ClipService.js';
import { ClipService } from '../../../features/collections/backend/services/ClipService.js';
import { CustomEmojiService as LegacyCustomEmojiService } from './CustomEmojiService.js';
import { CustomEmojiService } from '../../../features/emojis/backend/services/CustomEmojiService.js';
import { DeleteAccountService as LegacyDeleteAccountService } from './DeleteAccountService.js';
import { DeleteAccountService } from '../../../features/users/backend/services/DeleteAccountService.js';
import { DownloadService as LegacyDownloadService } from './DownloadService.js';
import { DownloadService } from '../../../features/runtime/backend/services/DownloadService.js';
import { DriveService as LegacyDriveService } from './DriveService.js';
import { DriveService } from '../../../features/drive/backend/services/DriveService.js';
import { FanoutTimelineEndpointService as LegacyFanoutTimelineEndpointService } from './FanoutTimelineEndpointService.js';
import { FanoutTimelineEndpointService } from '../../../features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { FanoutTimelineService as LegacyFanoutTimelineService } from './FanoutTimelineService.js';
import { FanoutTimelineService } from '../../../features/timelines/backend/services/FanoutTimelineService.js';
import { FeaturedService as LegacyFeaturedService } from './FeaturedService.js';
import { FeaturedService } from '../../../features/discovery/backend/services/FeaturedService.js';
import { FederatedInstanceService as LegacyFederatedInstanceService } from './FederatedInstanceService.js';
import { FederatedInstanceService } from '../../../features/federation/backend/services/FederatedInstanceService.js';
import { FetchInstanceMetadataService as LegacyFetchInstanceMetadataService } from './FetchInstanceMetadataService.js';
import { FetchInstanceMetadataService } from '../../../features/federation/backend/services/FetchInstanceMetadataService.js';
import { FileInfoService as LegacyFileInfoService } from './FileInfoService.js';
import { FileInfoService } from '../../../features/media/backend/services/FileInfoService.js';
import { FlashService as LegacyFlashService } from './FlashService.js';
import { FlashService } from '../../../features/play/backend/services/FlashService.js';
import { GlobalEventService as LegacyGlobalEventService } from './GlobalEventService.js';
import { GlobalEventService } from '../../../features/runtime/backend/services/GlobalEventService.js';
import { HashtagService as LegacyHashtagService } from './HashtagService.js';
import { HashtagService } from '../../../features/discovery/backend/services/HashtagService.js';
import { HttpRequestService as LegacyHttpRequestService } from './HttpRequestService.js';
import { HttpRequestService } from '../../../features/runtime/backend/services/HttpRequestService.js';
import { IdService as LegacyIdService } from './IdService.js';
import { IdService } from '../../../features/runtime/backend/services/IdService.js';
import { ImageProcessingService as LegacyImageProcessingService } from './ImageProcessingService.js';
import { ImageProcessingService } from '../../../features/media/backend/services/ImageProcessingService.js';
import { InternalStorageService as LegacyInternalStorageService } from './InternalStorageService.js';
import { InternalStorageService } from '../../../features/runtime/backend/services/InternalStorageService.js';
import { LoggerService as LegacyLoggerService } from './LoggerService.js';
import { LoggerService } from '../../../features/runtime/backend/services/LoggerService.js';
import { MetaService as LegacyMetaService } from './MetaService.js';
import { MetaService } from '../../../features/instance/backend/services/MetaService.js';
import { MfmService as LegacyMfmService } from './MfmService.js';
import { MfmService } from '../../../features/markup/backend/services/MfmService.js';
import { ModerationLogService as LegacyModerationLogService } from './ModerationLogService.js';
import { ModerationLogService } from '../../../features/moderation/backend/services/ModerationLogService.js';
import { NoteCreateService as LegacyNoteCreateService } from './NoteCreateService.js';
import { NoteCreateService } from '../../../features/notes/backend/services/NoteCreateService.js';
import { NoteDeleteService as LegacyNoteDeleteService } from './NoteDeleteService.js';
import { NoteDeleteService } from '../../../features/notes/backend/services/NoteDeleteService.js';
import { NoteDraftService as LegacyNoteDraftService } from './NoteDraftService.js';
import { NoteDraftService } from '../../../features/notes/backend/services/NoteDraftService.js';
import { NotePiningService as LegacyNotePiningService } from './NotePiningService.js';
import { NotePiningService } from '../../../features/notes/backend/services/NotePiningService.js';
import { NotificationService as LegacyNotificationService } from './NotificationService.js';
import { NotificationService } from '../../../features/notifications/backend/services/NotificationService.js';
import { PageService as LegacyPageService } from './PageService.js';
import { PageService } from '../../../features/pages/backend/services/PageService.js';
import { PollService as LegacyPollService } from './PollService.js';
import { PollService } from '../../../features/notes/backend/services/PollService.js';
import { PushNotificationService as LegacyPushNotificationService } from './PushNotificationService.js';
import { PushNotificationService } from '../../../features/notifications/backend/services/PushNotificationService.js';
import { QueueService as LegacyQueueService } from './QueueService.js';
import { QueueService } from '../../../features/runtime/backend/services/QueueService.js';
import { ReactionsBufferingService as LegacyReactionsBufferingService } from './ReactionsBufferingService.js';
import { ReactionsBufferingService } from '../../../features/notes/backend/services/ReactionsBufferingService.js';
import { ReactionService as LegacyReactionService } from './ReactionService.js';
import { ReactionService } from '../../../features/notes/backend/services/ReactionService.js';
import { RegistryApiService as LegacyRegistryApiService } from './RegistryApiService.js';
import { RegistryApiService } from '../../../features/preferences/backend/services/RegistryApiService.js';
import { RelayService as LegacyRelayService } from './RelayService.js';
import { RelayService } from '../../../features/federation/backend/services/RelayService.js';
import { RemoteLoggerService as LegacyRemoteLoggerService } from './RemoteLoggerService.js';
import { RemoteLoggerService } from '../../../features/runtime/backend/services/RemoteLoggerService.js';
import { RemoteUserResolveService as LegacyRemoteUserResolveService } from './RemoteUserResolveService.js';
import { RemoteUserResolveService } from '../../../features/federation/backend/services/RemoteUserResolveService.js';
import { ReversiService as LegacyReversiService } from './ReversiService.js';
import { ReversiService } from '../../../features/games/backend/services/ReversiService.js';
import { RoleService as LegacyRoleService } from './RoleService.js';
import { RoleService } from '../../../features/roles/backend/services/RoleService.js';
import { S3Service as LegacyS3Service } from './S3Service.js';
import { S3Service } from '../../../features/runtime/backend/services/S3Service.js';
import { SearchService as LegacySearchService } from './SearchService.js';
import { SearchService } from '../../../features/discovery/backend/services/SearchService.js';
import { SensitiveMediaDetectionService as LegacySensitiveMediaDetectionService } from './SensitiveMediaDetectionService.js';
import { SensitiveMediaDetectionService } from '../../../features/media/backend/services/SensitiveMediaDetectionService.js';
import { SignupService as LegacySignupService } from './SignupService.js';
import { SignupService } from '../../../features/auth/backend/services/SignupService.js';
import { SystemAccountService as LegacySystemAccountService } from './SystemAccountService.js';
import { SystemAccountService } from '../../../features/users/backend/services/SystemAccountService.js';
import { SystemWebhookService as LegacySystemWebhookService } from './SystemWebhookService.js';
import { SystemWebhookService } from '../../../features/integrations/backend/services/SystemWebhookService.js';
import { TelemetryService as LegacyTelemetryService } from './telemetry/TelemetryService.js';
import { TelemetryService } from '../../../features/statistics/backend/services/TelemetryService.js';
import { UserAuthService as LegacyUserAuthService } from './UserAuthService.js';
import { UserAuthService } from '../../../features/auth/backend/services/UserAuthService.js';
import { UserBlockingService as LegacyUserBlockingService } from './UserBlockingService.js';
import { UserBlockingService } from '../../../features/relationships/backend/services/UserBlockingService.js';
import { UserFollowingService as LegacyUserFollowingService } from './UserFollowingService.js';
import { UserFollowingService } from '../../../features/relationships/backend/services/UserFollowingService.js';
import { UserKeypairService as LegacyUserKeypairService } from './UserKeypairService.js';
import { UserKeypairService } from '../../../features/federation/backend/services/UserKeypairService.js';
import { UserListService as LegacyUserListService } from './UserListService.js';
import { UserListService } from '../../../features/relationships/backend/services/UserListService.js';
import { UserMutingService as LegacyUserMutingService } from './UserMutingService.js';
import { UserMutingService } from '../../../features/relationships/backend/services/UserMutingService.js';
import { UserRenoteMutingService as LegacyUserRenoteMutingService } from './UserRenoteMutingService.js';
import { UserRenoteMutingService } from '../../../features/relationships/backend/services/UserRenoteMutingService.js';
import { UserSearchService as LegacyUserSearchService } from './UserSearchService.js';
import { UserSearchService } from '../../../features/discovery/backend/services/UserSearchService.js';
import { UserService as LegacyUserService } from './UserService.js';
import { UserService } from '../../../features/users/backend/services/UserService.js';
import { UserSuspendService as LegacyUserSuspendService } from './UserSuspendService.js';
import { UserSuspendService } from '../../../features/moderation/backend/services/UserSuspendService.js';
import { UserWebhookService as LegacyUserWebhookService } from './UserWebhookService.js';
import { UserWebhookService } from '../../../features/integrations/backend/services/UserWebhookService.js';
import { VideoProcessingService as LegacyVideoProcessingService } from './VideoProcessingService.js';
import { VideoProcessingService } from '../../../features/media/backend/services/VideoProcessingService.js';
import { WebAuthnService as LegacyWebAuthnService } from './WebAuthnService.js';
import { WebAuthnService } from '../../../features/auth/backend/services/WebAuthnService.js';
import { WebfingerService as LegacyWebfingerService } from './WebfingerService.js';
import { WebfingerService } from '../../../features/federation/backend/services/WebfingerService.js';
import { WebhookTestService as LegacyWebhookTestService } from './WebhookTestService.js';
import { WebhookTestService } from '../../../features/integrations/backend/services/WebhookTestService.js';

const services = [
	['AbuseReportNotificationService', LegacyAbuseReportNotificationService, AbuseReportNotificationService, 10],
	['AbuseReportService', LegacyAbuseReportService, AbuseReportService, 8],
	['AccountMoveService', LegacyAccountMoveService, AccountMoveService, 21],
	['AccountUpdateService', LegacyAccountUpdateService, AccountUpdateService, 5],
	['AchievementService', LegacyAchievementService, AchievementService, 2],
	['ApAudienceService', LegacyApAudienceService, ApAudienceService, 1],
	['ApDbResolverService', LegacyApDbResolverService, ApDbResolverService, 7],
	['ApDeliverManagerService', LegacyApDeliverManagerService, ApDeliverManagerService, 3],
	['ApInboxService', LegacyApInboxService, ApInboxService, 27],
	['ApLoggerService', LegacyApLoggerService, ApLoggerService, 1],
	['ApMfmService', LegacyApMfmService, ApMfmService, 1],
	['ApRendererService', LegacyApRendererService, ApRendererService, 16],
	['ApRequestService', LegacyApRequestService, ApRequestService, 5],
	['ApResolverService', LegacyApResolverService, ApResolverService, 1],
	['JsonLdService', LegacyJsonLdService, JsonLdService, 1],
	['ApImageService', LegacyApImageService, ApImageService, 5],
	['ApMentionService', LegacyApMentionService, ApMentionService, 1],
	['ApNoteService', LegacyApNoteService, ApNoteService, 18],
	['ApPersonService', LegacyApPersonService, ApPersonService, 10],
	['ApQuestionService', LegacyApQuestionService, ApQuestionService, 7],
	['AnnouncementService', LegacyAnnouncementService, AnnouncementService, 7],
	['AntennaService', LegacyAntennaService, AntennaService, 8],
	['AvatarDecorationService', LegacyAvatarDecorationService, AvatarDecorationService, 5],
	['CaptchaService', LegacyCaptchaService, CaptchaService, 3],
	['ChannelFollowingService', LegacyChannelFollowingService, ChannelFollowingService, 6],
	['ChannelMutingService', LegacyChannelMutingService, ChannelMutingService, 6],
	['ChartLoggerService', LegacyChartLoggerService, ChartLoggerService, 1],
	['ChartManagementService', LegacyChartManagementService, ChartManagementService, 13],
	['ChatService', LegacyChatService, ChatService, 23],
	['ClipService', LegacyClipService, ClipService, 5],
	['CustomEmojiService', LegacyCustomEmojiService, CustomEmojiService, 7],
	['DeleteAccountService', LegacyDeleteAccountService, DeleteAccountService, 9],
	['DownloadService', LegacyDownloadService, DownloadService, 3],
	['DriveService', LegacyDriveService, DriveService, 23],
	['FanoutTimelineEndpointService', LegacyFanoutTimelineEndpointService, FanoutTimelineEndpointService, 7],
	['FanoutTimelineService', LegacyFanoutTimelineService, FanoutTimelineService, 2],
	['FeaturedService', LegacyFeaturedService, FeaturedService, 1],
	['FederatedInstanceService', LegacyFederatedInstanceService, FederatedInstanceService, 4],
	['FetchInstanceMetadataService', LegacyFetchInstanceMetadataService, FetchInstanceMetadataService, 4],
	['FileInfoService', LegacyFileInfoService, FileInfoService, 2],
	['FlashService', LegacyFlashService, FlashService, 3],
	['GlobalEventService', LegacyGlobalEventService, GlobalEventService, 2],
	['HashtagService', LegacyHashtagService, HashtagService, 8],
	['HttpRequestService', LegacyHttpRequestService, HttpRequestService, 1],
	['IdService', LegacyIdService, IdService, 1],
	['ImageProcessingService', LegacyImageProcessingService, ImageProcessingService, 0],
	['InternalStorageService', LegacyInternalStorageService, InternalStorageService, 1],
	['LoggerService', LegacyLoggerService, LoggerService, 0],
	['MetaService', LegacyMetaService, MetaService, 4],
	['MfmService', LegacyMfmService, MfmService, 1],
	['ModerationLogService', LegacyModerationLogService, ModerationLogService, 2],
	['NoteCreateService', LegacyNoteCreateService, NoteCreateService, 41],
	['NoteDeleteService', LegacyNoteDeleteService, NoteDeleteService, 16],
	['NoteDraftService', LegacyNoteDraftService, NoteDraftService, 10],
	['NotePiningService', LegacyNotePiningService, NotePiningService, 10],
	['NotificationService', LegacyNotificationService, NotificationService, 9],
	['PageService', LegacyPageService, PageService, 7],
	['PollService', LegacyPollService, PollService, 11],
	['PushNotificationService', LegacyPushNotificationService, PushNotificationService, 5],
	['QueueService', LegacyQueueService, QueueService, 11],
	['ReactionsBufferingService', LegacyReactionsBufferingService, ReactionsBufferingService, 4],
	['ReactionService', LegacyReactionService, ReactionService, 19],
	['RegistryApiService', LegacyRegistryApiService, RegistryApiService, 3],
	['RelayService', LegacyRelayService, RelayService, 5],
	['RemoteLoggerService', LegacyRemoteLoggerService, RemoteLoggerService, 1],
	['RemoteUserResolveService', LegacyRemoteUserResolveService, RemoteUserResolveService, 7],
	['ReversiService', LegacyReversiService, ReversiService, 8],
	['RoleService', LegacyRoleService, RoleService, 14],
	['S3Service', LegacyS3Service, S3Service, 1],
	['SearchService', LegacySearchService, SearchService, 8],
	['SensitiveMediaDetectionService', LegacySensitiveMediaDetectionService, SensitiveMediaDetectionService, 3],
	['SignupService', LegacySignupService, SignupService, 11],
	['SystemAccountService', LegacySystemAccountService, SystemAccountService, 7],
	['SystemWebhookService', LegacySystemWebhookService, SystemWebhookService, 6],
	['TelemetryService', LegacyTelemetryService, TelemetryService, 0],
	['UserAuthService', LegacyUserAuthService, UserAuthService, 3],
	['UserBlockingService', LegacyUserBlockingService, UserBlockingService, 13],
	['UserFollowingService', LegacyUserFollowingService, UserFollowingService, 21],
	['UserKeypairService', LegacyUserKeypairService, UserKeypairService, 2],
	['UserListService', LegacyUserListService, UserListService, 9],
	['UserMutingService', LegacyUserMutingService, UserMutingService, 3],
	['UserRenoteMutingService', LegacyUserRenoteMutingService, UserRenoteMutingService, 3],
	['UserSearchService', LegacyUserSearchService, UserSearchService, 6],
	['UserService', LegacyUserService, UserService, 4],
	['UserSuspendService', LegacyUserSuspendService, UserSuspendService, 8],
	['UserWebhookService', LegacyUserWebhookService, UserWebhookService, 3],
	['VideoProcessingService', LegacyVideoProcessingService, VideoProcessingService, 2],
	['WebAuthnService', LegacyWebAuthnService, WebAuthnService, 4],
	['WebfingerService', LegacyWebfingerService, WebfingerService, 1],
	['WebhookTestService', LegacyWebhookTestService, WebhookTestService, 4],
] as const;

for (const [name, legacy, feature, parameterCount] of services) {
	test(`${name} preserves provider identity and constructor metadata`, () => {
		expect(legacy).toBe(feature);
		expect(Reflect.getMetadata('design:paramtypes', feature) ?? []).toHaveLength(parameterCount);
	});
}
