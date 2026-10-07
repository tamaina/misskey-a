/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { featureServiceProviders, featureServiceExports } from './feature-service-providers.js';
import { FanoutTimelineEndpointService } from '../../../features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { AbuseReportService } from '../../../features/moderation/backend/services/AbuseReportService.js';
import { SystemWebhookEntityService } from '../../../features/integrations/backend/serializers/SystemWebhookEntityService.js';
import {
	AbuseReportNotificationRecipientEntityService,
} from '../../../features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '../../../features/moderation/backend/services/AbuseReportNotificationService.js';
import { SystemWebhookService } from '../../../features/integrations/backend/services/SystemWebhookService.js';
import { UserSearchService } from '../../../features/discovery/backend/services/UserSearchService.js';
import { WebhookTestService } from '../../../features/integrations/backend/services/WebhookTestService.js';
import { ChannelMutingService } from '../../../features/channels/backend/services/ChannelMutingService.js';
import { AccountMoveService } from '../../../features/users/backend/services/AccountMoveService.js';
import { AccountUpdateService } from '../../../features/users/backend/services/AccountUpdateService.js';
import { SensitiveMediaDetectionService } from '../../../features/media/backend/services/SensitiveMediaDetectionService.js';
import { AntennaService } from '../../../features/timelines/backend/services/AntennaService.js';
import { AchievementService } from '../../../features/users/backend/services/AchievementService.js';
import { AvatarDecorationService } from '../../../features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { CaptchaService } from '../../../features/auth/backend/services/CaptchaService.js';
import { CustomEmojiService } from '../../../features/emojis/backend/services/CustomEmojiService.js';
import { DeleteAccountService } from '../../../features/users/backend/services/DeleteAccountService.js';
import { DownloadService } from '../../../features/runtime/backend/services/DownloadService.js';
import { DriveService } from '../../../features/drive/backend/services/DriveService.js';
import { EmailService } from './EmailService.js';
import { FederatedInstanceService } from '../../../features/federation/backend/services/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '../../../features/federation/backend/services/FetchInstanceMetadataService.js';
import { GlobalEventService } from '../../../features/runtime/backend/services/GlobalEventService.js';
import { HashtagService } from '../../../features/discovery/backend/services/HashtagService.js';
import { HttpRequestService } from '../../../features/runtime/backend/services/HttpRequestService.js';
import { IdService } from '../../../features/runtime/backend/services/IdService.js';
import { ImageProcessingService } from '../../../features/media/backend/services/ImageProcessingService.js';
import { SystemAccountService } from '../../../features/users/backend/services/SystemAccountService.js';
import { InternalStorageService } from '../../../features/runtime/backend/services/InternalStorageService.js';
import { MetaService } from '../../../features/instance/backend/services/MetaService.js';
import { MfmService } from '../../../features/markup/backend/services/MfmService.js';
import { ModerationLogService } from '../../../features/moderation/backend/services/ModerationLogService.js';
import { NoteCreateService } from '../../../features/notes/backend/services/NoteCreateService.js';
import { NoteDeleteService } from '../../../features/notes/backend/services/NoteDeleteService.js';
import { NotePiningService } from '../../../features/notes/backend/services/NotePiningService.js';
import { NoteDraftService } from '../../../features/notes/backend/services/NoteDraftService.js';
import { NotificationService } from '../../../features/notifications/backend/services/NotificationService.js';
import { PollService } from '../../../features/notes/backend/services/PollService.js';
import { PushNotificationService } from '../../../features/notifications/backend/services/PushNotificationService.js';
import { QueryService } from './QueryService.js';
import { ReactionService } from '../../../features/notes/backend/services/ReactionService.js';
import { ReactionsBufferingService } from '../../../features/notes/backend/services/ReactionsBufferingService.js';
import { RelayService } from '../../../features/federation/backend/services/RelayService.js';
import { RoleService } from '../../../features/roles/backend/services/RoleService.js';
import { S3Service } from '../../../features/runtime/backend/services/S3Service.js';
import { SignupService } from '../../../features/auth/backend/services/SignupService.js';
import { WebAuthnService } from '../../../features/auth/backend/services/WebAuthnService.js';
import { UserBlockingService } from '../../../features/relationships/backend/services/UserBlockingService.js';
import { CacheService } from './CacheService.js';
import { UserService } from '../../../features/users/backend/services/UserService.js';
import { UserFollowingService } from '../../../features/relationships/backend/services/UserFollowingService.js';
import { UserKeypairService } from '../../../features/federation/backend/services/UserKeypairService.js';
import { UserListService } from '../../../features/relationships/backend/services/UserListService.js';
import { UserMutingService } from '../../../features/relationships/backend/services/UserMutingService.js';
import { UserRenoteMutingService } from '../../../features/relationships/backend/services/UserRenoteMutingService.js';
import { UserSuspendService } from '../../../features/moderation/backend/services/UserSuspendService.js';
import { UserAuthService } from '../../../features/auth/backend/services/UserAuthService.js';
import { VideoProcessingService } from '../../../features/media/backend/services/VideoProcessingService.js';
import { UserWebhookService } from '../../../features/integrations/backend/services/UserWebhookService.js';
import { UtilityService } from './UtilityService.js';
import { FileInfoService } from '../../../features/media/backend/services/FileInfoService.js';
import { SearchService } from '../../../features/discovery/backend/services/SearchService.js';
import { FeaturedService } from '../../../features/discovery/backend/services/FeaturedService.js';
import { FanoutTimelineService } from '../../../features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelFollowingService } from '../../../features/channels/backend/services/ChannelFollowingService.js';
import { ChatService } from '../../../features/chat/backend/services/ChatService.js';
import { RegistryApiService } from '../../../features/preferences/backend/services/RegistryApiService.js';
import { ReversiService } from '../../../features/games/backend/services/ReversiService.js';

import { ChartLoggerService } from '../../../features/statistics/backend/services/ChartLoggerService.js';
import FederationChart from './chart/charts/federation.js';
import NotesChart from './chart/charts/notes.js';
import UsersChart from './chart/charts/users.js';
import ActiveUsersChart from './chart/charts/active-users.js';
import InstanceChart from './chart/charts/instance.js';
import PerUserNotesChart from './chart/charts/per-user-notes.js';
import PerUserPvChart from './chart/charts/per-user-pv.js';
import DriveChart from './chart/charts/drive.js';
import PerUserReactionsChart from './chart/charts/per-user-reactions.js';
import PerUserFollowingChart from './chart/charts/per-user-following.js';
import PerUserDriveChart from './chart/charts/per-user-drive.js';
import ApRequestChart from './chart/charts/ap-request.js';
import { ChartManagementService } from '../../../features/statistics/backend/services/ChartManagementService.js';

import { AbuseUserReportEntityService } from '../../../features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { AntennaEntityService } from '../../../features/timelines/backend/serializers/AntennaEntityService.js';
import { AppEntityService } from '../../../features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService } from '../../../features/auth/backend/serializers/AuthSessionEntityService.js';
import { BlockingEntityService } from '../../../features/relationships/backend/serializers/BlockingEntityService.js';
import { ChannelEntityService } from '../../../features/channels/backend/serializers/ChannelEntityService.js';
import { ChatEntityService } from '../../../features/chat/backend/serializers/ChatEntityService.js';
import { DriveFileEntityService } from '../../../features/drive/backend/serializers/DriveFileEntityService.js';
import { DriveFolderEntityService } from '../../../features/drive/backend/serializers/DriveFolderEntityService.js';
import { EmojiEntityService } from '../../../features/emojis/backend/serializers/EmojiEntityService.js';
import { FollowingEntityService } from '../../../features/relationships/backend/serializers/FollowingEntityService.js';
import { FollowRequestEntityService } from '../../../features/relationships/backend/serializers/FollowRequestEntityService.js';
import { HashtagEntityService } from '../../../features/discovery/backend/serializers/HashtagEntityService.js';
import { InstanceEntityService } from '../../../features/instance/backend/serializers/InstanceEntityService.js';
import { InviteCodeEntityService } from '../../../features/auth/backend/serializers/InviteCodeEntityService.js';
import { ModerationLogEntityService } from '../../../features/moderation/backend/serializers/ModerationLogEntityService.js';
import { MutingEntityService } from '../../../features/relationships/backend/serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from '../../../features/relationships/backend/serializers/RenoteMutingEntityService.js';
import { NoteEntityService } from '../../../features/notes/backend/serializers/NoteEntityService.js';
import { NoteReactionEntityService } from '../../../features/notes/backend/serializers/NoteReactionEntityService.js';
import { NoteDraftEntityService } from '../../../features/notes/backend/serializers/NoteDraftEntityService.js';
import { NotificationEntityService } from '../../../features/notifications/backend/serializers/NotificationEntityService.js';
import { SigninEntityService } from '../../../features/auth/backend/serializers/SigninEntityService.js';
import { UserEntityService } from '../../../features/users/backend/serializers/UserEntityService.js';
import { UserListEntityService } from '../../../features/relationships/backend/serializers/UserListEntityService.js';
import { RoleEntityService } from '../../../features/roles/backend/serializers/RoleEntityService.js';
import { ReversiGameEntityService } from '../../../features/games/backend/serializers/ReversiGameEntityService.js';
import { MetaEntityService } from '../../../features/instance/backend/serializers/MetaEntityService.js';

import { ApAudienceService } from '../../../features/federation/backend/services/ApAudienceService.js';
import { ApDbResolverService } from '../../../features/federation/backend/services/ApDbResolverService.js';
import { ApDeliverManagerService } from '../../../features/federation/backend/services/ApDeliverManagerService.js';
import { ApInboxService } from '../../../features/federation/backend/services/ApInboxService.js';
import { ApLoggerService } from '../../../features/federation/backend/services/ApLoggerService.js';
import { ApMfmService } from '../../../features/federation/backend/services/ApMfmService.js';
import { ApRendererService } from '../../../features/federation/backend/services/ApRendererService.js';
import { ApRequestService } from '../../../features/federation/backend/services/ApRequestService.js';
import { ApResolverService, Resolver } from '../../../features/federation/backend/services/ApResolverService.js';
import { JsonLdService } from '../../../features/federation/backend/services/JsonLdService.js';
import { RemoteLoggerService } from '../../../features/runtime/backend/services/RemoteLoggerService.js';
import { RemoteUserResolveService } from '../../../features/federation/backend/services/RemoteUserResolveService.js';
import { WebfingerService } from '../../../features/federation/backend/services/WebfingerService.js';
import { ApImageService } from '../../../features/federation/backend/services/ApImageService.js';
import { ApMentionService } from '../../../features/federation/backend/services/ApMentionService.js';
import { ApNoteService } from '../../../features/federation/backend/services/ApNoteService.js';
import { ApPersonService } from '../../../features/federation/backend/services/ApPersonService.js';
import { ApQuestionService } from '../../../features/federation/backend/services/ApQuestionService.js';
import { QueueModule } from './QueueModule.js';
import { QueueService } from '../../../features/runtime/backend/services/QueueService.js';
import { LoggerService } from '../../../features/runtime/backend/services/LoggerService.js';
import { TelemetryService } from '../../../features/statistics/backend/services/TelemetryService.js';
import type { ExistingProvider } from '@nestjs/common';

// Preserve the canonical provider order. Factory-owned features are composed
// separately; the remaining classes keep their original Nest construction.
const canonicalServices = {
	LoggerService,
	AbuseReportService,
	AbuseReportNotificationService,
	AccountMoveService,
	AccountUpdateService,
	SensitiveMediaDetectionService,
	AntennaService,
	AchievementService,
	AvatarDecorationService,
	CaptchaService,
	CustomEmojiService,
	DeleteAccountService,
	DownloadService,
	DriveService,
	EmailService,
	FederatedInstanceService,
	FetchInstanceMetadataService,
	GlobalEventService,
	HashtagService,
	HttpRequestService,
	IdService,
	ImageProcessingService,
	InternalStorageService,
	MetaService,
	MfmService,
	ModerationLogService,
	NoteCreateService,
	NoteDeleteService,
	NotePiningService,
	NoteDraftService,
	NotificationService,
	PollService,
	SystemAccountService,
	PushNotificationService,
	QueryService,
	ReactionService,
	ReactionsBufferingService,
	RelayService,
	RoleService,
	S3Service,
	SignupService,
	WebAuthnService,
	UserBlockingService,
	CacheService,
	UserService,
	UserFollowingService,
	UserKeypairService,
	UserListService,
	UserMutingService,
	UserRenoteMutingService,
	UserSearchService,
	UserSuspendService,
	UserAuthService,
	VideoProcessingService,
	UserWebhookService,
	SystemWebhookService,
	WebhookTestService,
	UtilityService,
	FileInfoService,
	SearchService,
	FeaturedService,
	FanoutTimelineService,
	FanoutTimelineEndpointService,
	ChannelFollowingService,
	ChannelMutingService,
	ChatService,
	RegistryApiService,
	ReversiService,
	ChartLoggerService,
	FederationChart,
	NotesChart,
	UsersChart,
	ActiveUsersChart,
	InstanceChart,
	PerUserNotesChart,
	PerUserPvChart,
	DriveChart,
	PerUserReactionsChart,
	PerUserFollowingChart,
	PerUserDriveChart,
	ApRequestChart,
	ChartManagementService,
	AbuseUserReportEntityService,
	AbuseReportNotificationRecipientEntityService,
	AntennaEntityService,
	AppEntityService,
	AuthSessionEntityService,
	BlockingEntityService,
	ChannelEntityService,
	ChatEntityService,
	DriveFileEntityService,
	DriveFolderEntityService,
	EmojiEntityService,
	FollowingEntityService,
	FollowRequestEntityService,
	HashtagEntityService,
	InstanceEntityService,
	InviteCodeEntityService,
	ModerationLogEntityService,
	MutingEntityService,
	RenoteMutingEntityService,
	NoteEntityService,
	NoteReactionEntityService,
	NoteDraftEntityService,
	NotificationEntityService,
	SigninEntityService,
	UserEntityService,
	UserListEntityService,
	RoleEntityService,
	ReversiGameEntityService,
	MetaEntityService,
	SystemWebhookEntityService,
	ApAudienceService,
	ApDbResolverService,
	ApDeliverManagerService,
	ApInboxService,
	ApLoggerService,
	ApMfmService,
	ApRendererService,
	ApRequestService,
	ApResolverService,
	Resolver,
	JsonLdService,
	RemoteLoggerService,
	RemoteUserResolveService,
	WebfingerService,
	ApImageService,
	ApMentionService,
	ApNoteService,
	ApPersonService,
	ApQuestionService,
	QueueService,
	TelemetryService,
};
const serviceProviders = Object.values(canonicalServices);

// QueueService is also exported through QueueModule; Resolver was never given a
// string alias here. ChartLoggerService remains private to CoreModule.
const serviceAliases: ExistingProvider[] = Object.entries(canonicalServices)
	.filter(([, service]) => service !== QueueService && service !== Resolver)
	.map(([provide, useExisting]) => ({ provide, useExisting }));
const serviceExports = serviceProviders.filter(service => service !== ChartLoggerService);
const aliasExports = serviceAliases.filter(alias => alias.useExisting !== ChartLoggerService);

@Module({
	imports: [QueueModule],
	providers: [...featureServiceProviders, ...serviceProviders, ...serviceAliases],
	exports: [...featureServiceExports, QueueModule, ...serviceExports, ...aliasExports],
})
export class CoreModule {}
