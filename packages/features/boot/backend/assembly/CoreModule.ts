/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { AbuseReportService } from '@features/moderation/backend/services/AbuseReportService.js';
import { AbuseReportNotificationService } from '@features/moderation/backend/services/AbuseReportNotificationService.js';
import { SystemWebhookService } from '@features/integrations/backend/services/SystemWebhookService.js';
import { WebhookTestService } from '@features/integrations/backend/services/WebhookTestService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { AccountUpdateService } from '@features/users/backend/services/AccountUpdateService.js';
import { AntennaService } from '@features/timelines/backend/services/AntennaService.js';
import { AchievementService } from '@features/users/backend/services/AchievementService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { DeleteAccountService } from '@features/users/backend/services/DeleteAccountService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { FederatedInstanceService } from '@features/federation/backend/services/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@features/federation/backend/services/FetchInstanceMetadataService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { NoteCreateService } from '@features/notes/backend/services/NoteCreateService.js';
import { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';
import { NotePiningService } from '@features/notes/backend/services/NotePiningService.js';
import { NoteDraftService } from '@features/notes/backend/services/NoteDraftService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { PollService } from '@features/notes/backend/services/PollService.js';
import { PushNotificationService } from '@features/notifications/backend/services/PushNotificationService.js';
import { ReactionService } from '@features/notes/backend/services/ReactionService.js';
import { ReactionsBufferingService } from '@features/notes/backend/services/ReactionsBufferingService.js';
import { RelayService } from '@features/federation/backend/services/RelayService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { S3Service } from '@features/runtime/backend/services/S3Service.js';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { UserBlockingService } from '@features/relationships/backend/services/UserBlockingService.js';
import { UserService } from '@features/users/backend/services/UserService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';
import { UserListService } from '@features/relationships/backend/services/UserListService.js';
import { UserMutingService } from '@features/relationships/backend/services/UserMutingService.js';
import { UserRenoteMutingService } from '@features/relationships/backend/services/UserRenoteMutingService.js';
import { UserSuspendService } from '@features/moderation/backend/services/UserSuspendService.js';
import { UserWebhookService } from '@features/integrations/backend/services/UserWebhookService.js';
import { SearchService } from '@features/discovery/backend/services/SearchService.js';
import { FanoutTimelineService } from '@features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { ReversiService } from '@features/games/backend/services/ReversiService.js';

import { ChartLoggerService } from '@features/statistics/backend/services/ChartLoggerService.js';
import { ChartManagementService } from '@features/statistics/backend/services/ChartManagementService.js';

import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { NoteReactionEntityService } from '@features/notes/backend/serializers/NoteReactionEntityService.js';
import { NoteDraftEntityService } from '@features/notes/backend/serializers/NoteDraftEntityService.js';
import { NotificationEntityService } from '@features/notifications/backend/serializers/NotificationEntityService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

import { ApAudienceService } from '@features/federation/backend/services/ApAudienceService.js';
import { ApDbResolverService } from '@features/federation/backend/services/ApDbResolverService.js';
import { ApDeliverManagerService } from '@features/federation/backend/services/ApDeliverManagerService.js';
import { ApInboxService } from '@features/federation/backend/services/ApInboxService.js';
import { ApLoggerService } from '@features/federation/backend/services/ApLoggerService.js';
import { ApMfmService } from '@features/federation/backend/services/ApMfmService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { ApRequestService } from '@features/federation/backend/services/ApRequestService.js';
import { ApResolverService, Resolver } from '@features/federation/backend/services/ApResolverService.js';
import { JsonLdService } from '@features/federation/backend/services/JsonLdService.js';
import { RemoteLoggerService } from '@features/runtime/backend/services/RemoteLoggerService.js';
import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { WebfingerService } from '@features/federation/backend/services/WebfingerService.js';
import { ApImageService } from '@features/federation/backend/services/ApImageService.js';
import { ApMentionService } from '@features/federation/backend/services/ApMentionService.js';
import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import { ApQuestionService } from '@features/federation/backend/services/ApQuestionService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { QueueModule } from './QueueModule.js';
import { ApRequestChart } from '@features/statistics/backend/charts/ap-request.js';
import { PerUserDriveChart } from '@features/statistics/backend/charts/per-user-drive.js';
import { PerUserFollowingChart } from '@features/statistics/backend/charts/per-user-following.js';
import { PerUserReactionsChart } from '@features/statistics/backend/charts/per-user-reactions.js';
import { DriveChart } from '@features/statistics/backend/charts/drive.js';
import { PerUserPvChart } from '@features/statistics/backend/charts/per-user-pv.js';
import { PerUserNotesChart } from '@features/statistics/backend/charts/per-user-notes.js';
import { InstanceChart } from '@features/statistics/backend/charts/instance.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { UsersChart } from '@features/statistics/backend/charts/users.js';
import { NotesChart } from '@features/statistics/backend/charts/notes.js';
import { FederationChart } from '@features/statistics/backend/charts/federation.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { featureServiceProviders, featureServiceExports } from '@features/index/backend/feature-service-providers.js';
import type { ExistingProvider } from '@nestjs/common';

// Preserve the canonical provider order. Factory-owned features are composed
// separately; the remaining classes keep their original Nest construction.
const canonicalServices = {
	LoggerService,
	AbuseReportService,
	AbuseReportNotificationService,
	AccountMoveService,
	AccountUpdateService,
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
	HttpRequestService,
	IdService,
	InternalStorageService,
	MetaService,
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
	UserBlockingService,
	CacheService,
	UserService,
	UserFollowingService,
	UserKeypairService,
	UserListService,
	UserMutingService,
	UserRenoteMutingService,
	UserSuspendService,
	UserWebhookService,
	SystemWebhookService,
	WebhookTestService,
	UtilityService,
	SearchService,
	FanoutTimelineService,
	FanoutTimelineEndpointService,
	ChannelFollowingService,
	ChannelMutingService,
	ChatService,
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
	DriveFileEntityService,
	NoteEntityService,
	NoteReactionEntityService,
	NoteDraftEntityService,
	NotificationEntityService,
	UserEntityService,
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
