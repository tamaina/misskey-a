/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
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
import { FlashService } from '../../../features/play/backend/services/FlashService.js';
import { ChannelMutingService } from '../../../features/channels/backend/services/ChannelMutingService.js';
import { AccountMoveService } from '../../../features/users/backend/services/AccountMoveService.js';
import { AccountUpdateService } from '../../../features/users/backend/services/AccountUpdateService.js';
import { SensitiveMediaDetectionService } from '../../../features/media/backend/services/SensitiveMediaDetectionService.js';
import { AnnouncementService } from '../../../features/announcements/backend/services/AnnouncementService.js';
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
import { ClipService } from '../../../features/collections/backend/services/ClipService.js';
import { FeaturedService } from '../../../features/discovery/backend/services/FeaturedService.js';
import { FanoutTimelineService } from '../../../features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelFollowingService } from '../../../features/channels/backend/services/ChannelFollowingService.js';
import { ChatService } from '../../../features/chat/backend/services/ChatService.js';
import { RegistryApiService } from '../../../features/preferences/backend/services/RegistryApiService.js';
import { ReversiService } from '../../../features/games/backend/services/ReversiService.js';
import { PageService } from '../../../features/pages/backend/services/PageService.js';

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
import { AnnouncementEntityService } from '../../../features/announcements/backend/serializers/AnnouncementEntityService.js';
import { AntennaEntityService } from '../../../features/timelines/backend/serializers/AntennaEntityService.js';
import { AppEntityService } from '../../../features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService } from '../../../features/auth/backend/serializers/AuthSessionEntityService.js';
import { BlockingEntityService } from '../../../features/relationships/backend/serializers/BlockingEntityService.js';
import { ChannelEntityService } from '../../../features/channels/backend/serializers/ChannelEntityService.js';
import { ChatEntityService } from '../../../features/chat/backend/serializers/ChatEntityService.js';
import { ClipEntityService } from '../../../features/collections/backend/serializers/ClipEntityService.js';
import { DriveFileEntityService } from '../../../features/drive/backend/serializers/DriveFileEntityService.js';
import { DriveFolderEntityService } from '../../../features/drive/backend/serializers/DriveFolderEntityService.js';
import { EmojiEntityService } from '../../../features/emojis/backend/serializers/EmojiEntityService.js';
import { FollowingEntityService } from '../../../features/relationships/backend/serializers/FollowingEntityService.js';
import { FollowRequestEntityService } from '../../../features/relationships/backend/serializers/FollowRequestEntityService.js';
import { GalleryLikeEntityService } from '../../../features/gallery/backend/serializers/GalleryLikeEntityService.js';
import { GalleryPostEntityService } from '../../../features/gallery/backend/serializers/GalleryPostEntityService.js';
import { HashtagEntityService } from '../../../features/discovery/backend/serializers/HashtagEntityService.js';
import { InstanceEntityService } from '../../../features/instance/backend/serializers/InstanceEntityService.js';
import { InviteCodeEntityService } from '../../../features/auth/backend/serializers/InviteCodeEntityService.js';
import { ModerationLogEntityService } from '../../../features/moderation/backend/serializers/ModerationLogEntityService.js';
import { MutingEntityService } from '../../../features/relationships/backend/serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from '../../../features/relationships/backend/serializers/RenoteMutingEntityService.js';
import { NoteEntityService } from '../../../features/notes/backend/serializers/NoteEntityService.js';
import { NoteFavoriteEntityService } from '../../../features/collections/backend/serializers/NoteFavoriteEntityService.js';
import { NoteReactionEntityService } from '../../../features/notes/backend/serializers/NoteReactionEntityService.js';
import { NoteDraftEntityService } from '../../../features/notes/backend/serializers/NoteDraftEntityService.js';
import { NotificationEntityService } from '../../../features/notifications/backend/serializers/NotificationEntityService.js';
import { PageEntityService } from '../../../features/pages/backend/serializers/PageEntityService.js';
import { PageLikeEntityService } from '../../../features/pages/backend/serializers/PageLikeEntityService.js';
import { SigninEntityService } from '../../../features/auth/backend/serializers/SigninEntityService.js';
import { UserEntityService } from '../../../features/users/backend/serializers/UserEntityService.js';
import { UserListEntityService } from '../../../features/relationships/backend/serializers/UserListEntityService.js';
import { FlashEntityService } from '../../../features/play/backend/serializers/FlashEntityService.js';
import { FlashLikeEntityService } from '../../../features/play/backend/serializers/FlashLikeEntityService.js';
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
import type { Provider } from '@nestjs/common';

//#region 文字列ベースでのinjection用(循環参照対応のため)
const $LoggerService: Provider = { provide: 'LoggerService', useExisting: LoggerService };
const $TelemetryService: Provider = { provide: 'TelemetryService', useExisting: TelemetryService };
const $AbuseReportService: Provider = { provide: 'AbuseReportService', useExisting: AbuseReportService };
const $AbuseReportNotificationService: Provider = { provide: 'AbuseReportNotificationService', useExisting: AbuseReportNotificationService };
const $AccountMoveService: Provider = { provide: 'AccountMoveService', useExisting: AccountMoveService };
const $AccountUpdateService: Provider = { provide: 'AccountUpdateService', useExisting: AccountUpdateService };
const $SensitiveMediaDetectionService: Provider = { provide: 'SensitiveMediaDetectionService', useExisting: SensitiveMediaDetectionService };
const $AnnouncementService: Provider = { provide: 'AnnouncementService', useExisting: AnnouncementService };
const $AntennaService: Provider = { provide: 'AntennaService', useExisting: AntennaService };
const $AchievementService: Provider = { provide: 'AchievementService', useExisting: AchievementService };
const $AvatarDecorationService: Provider = { provide: 'AvatarDecorationService', useExisting: AvatarDecorationService };
const $CaptchaService: Provider = { provide: 'CaptchaService', useExisting: CaptchaService };
const $CustomEmojiService: Provider = { provide: 'CustomEmojiService', useExisting: CustomEmojiService };
const $DeleteAccountService: Provider = { provide: 'DeleteAccountService', useExisting: DeleteAccountService };
const $DownloadService: Provider = { provide: 'DownloadService', useExisting: DownloadService };
const $DriveService: Provider = { provide: 'DriveService', useExisting: DriveService };
const $EmailService: Provider = { provide: 'EmailService', useExisting: EmailService };
const $FederatedInstanceService: Provider = { provide: 'FederatedInstanceService', useExisting: FederatedInstanceService };
const $FetchInstanceMetadataService: Provider = { provide: 'FetchInstanceMetadataService', useExisting: FetchInstanceMetadataService };
const $GlobalEventService: Provider = { provide: 'GlobalEventService', useExisting: GlobalEventService };
const $HashtagService: Provider = { provide: 'HashtagService', useExisting: HashtagService };
const $HttpRequestService: Provider = { provide: 'HttpRequestService', useExisting: HttpRequestService };
const $IdService: Provider = { provide: 'IdService', useExisting: IdService };
const $ImageProcessingService: Provider = { provide: 'ImageProcessingService', useExisting: ImageProcessingService };
const $InternalStorageService: Provider = { provide: 'InternalStorageService', useExisting: InternalStorageService };
const $MetaService: Provider = { provide: 'MetaService', useExisting: MetaService };
const $MfmService: Provider = { provide: 'MfmService', useExisting: MfmService };
const $ModerationLogService: Provider = { provide: 'ModerationLogService', useExisting: ModerationLogService };
const $NoteCreateService: Provider = { provide: 'NoteCreateService', useExisting: NoteCreateService };
const $NoteDeleteService: Provider = { provide: 'NoteDeleteService', useExisting: NoteDeleteService };
const $NotePiningService: Provider = { provide: 'NotePiningService', useExisting: NotePiningService };
const $NoteDraftService: Provider = { provide: 'NoteDraftService', useExisting: NoteDraftService };
const $NotificationService: Provider = { provide: 'NotificationService', useExisting: NotificationService };
const $PollService: Provider = { provide: 'PollService', useExisting: PollService };
const $SystemAccountService: Provider = { provide: 'SystemAccountService', useExisting: SystemAccountService };
const $PushNotificationService: Provider = { provide: 'PushNotificationService', useExisting: PushNotificationService };
const $QueryService: Provider = { provide: 'QueryService', useExisting: QueryService };
const $ReactionService: Provider = { provide: 'ReactionService', useExisting: ReactionService };
const $ReactionsBufferingService: Provider = { provide: 'ReactionsBufferingService', useExisting: ReactionsBufferingService };
const $RelayService: Provider = { provide: 'RelayService', useExisting: RelayService };
const $RoleService: Provider = { provide: 'RoleService', useExisting: RoleService };
const $S3Service: Provider = { provide: 'S3Service', useExisting: S3Service };
const $SignupService: Provider = { provide: 'SignupService', useExisting: SignupService };
const $WebAuthnService: Provider = { provide: 'WebAuthnService', useExisting: WebAuthnService };
const $UserBlockingService: Provider = { provide: 'UserBlockingService', useExisting: UserBlockingService };
const $CacheService: Provider = { provide: 'CacheService', useExisting: CacheService };
const $UserService: Provider = { provide: 'UserService', useExisting: UserService };
const $UserFollowingService: Provider = { provide: 'UserFollowingService', useExisting: UserFollowingService };
const $UserKeypairService: Provider = { provide: 'UserKeypairService', useExisting: UserKeypairService };
const $UserListService: Provider = { provide: 'UserListService', useExisting: UserListService };
const $UserMutingService: Provider = { provide: 'UserMutingService', useExisting: UserMutingService };
const $UserRenoteMutingService: Provider = { provide: 'UserRenoteMutingService', useExisting: UserRenoteMutingService };
const $UserSearchService: Provider = { provide: 'UserSearchService', useExisting: UserSearchService };
const $UserSuspendService: Provider = { provide: 'UserSuspendService', useExisting: UserSuspendService };
const $UserAuthService: Provider = { provide: 'UserAuthService', useExisting: UserAuthService };
const $VideoProcessingService: Provider = { provide: 'VideoProcessingService', useExisting: VideoProcessingService };
const $UserWebhookService: Provider = { provide: 'UserWebhookService', useExisting: UserWebhookService };
const $SystemWebhookService: Provider = { provide: 'SystemWebhookService', useExisting: SystemWebhookService };
const $WebhookTestService: Provider = { provide: 'WebhookTestService', useExisting: WebhookTestService };
const $UtilityService: Provider = { provide: 'UtilityService', useExisting: UtilityService };
const $FileInfoService: Provider = { provide: 'FileInfoService', useExisting: FileInfoService };
const $FlashService: Provider = { provide: 'FlashService', useExisting: FlashService };
const $SearchService: Provider = { provide: 'SearchService', useExisting: SearchService };
const $ClipService: Provider = { provide: 'ClipService', useExisting: ClipService };
const $FeaturedService: Provider = { provide: 'FeaturedService', useExisting: FeaturedService };
const $FanoutTimelineService: Provider = { provide: 'FanoutTimelineService', useExisting: FanoutTimelineService };
const $FanoutTimelineEndpointService: Provider = { provide: 'FanoutTimelineEndpointService', useExisting: FanoutTimelineEndpointService };
const $ChannelFollowingService: Provider = { provide: 'ChannelFollowingService', useExisting: ChannelFollowingService };
const $ChannelMutingService: Provider = { provide: 'ChannelMutingService', useExisting: ChannelMutingService };
const $ChatService: Provider = { provide: 'ChatService', useExisting: ChatService };
const $RegistryApiService: Provider = { provide: 'RegistryApiService', useExisting: RegistryApiService };
const $ReversiService: Provider = { provide: 'ReversiService', useExisting: ReversiService };
const $PageService: Provider = { provide: 'PageService', useExisting: PageService };

const $ChartLoggerService: Provider = { provide: 'ChartLoggerService', useExisting: ChartLoggerService };
const $FederationChart: Provider = { provide: 'FederationChart', useExisting: FederationChart };
const $NotesChart: Provider = { provide: 'NotesChart', useExisting: NotesChart };
const $UsersChart: Provider = { provide: 'UsersChart', useExisting: UsersChart };
const $ActiveUsersChart: Provider = { provide: 'ActiveUsersChart', useExisting: ActiveUsersChart };
const $InstanceChart: Provider = { provide: 'InstanceChart', useExisting: InstanceChart };
const $PerUserNotesChart: Provider = { provide: 'PerUserNotesChart', useExisting: PerUserNotesChart };
const $PerUserPvChart: Provider = { provide: 'PerUserPvChart', useExisting: PerUserPvChart };
const $DriveChart: Provider = { provide: 'DriveChart', useExisting: DriveChart };
const $PerUserReactionsChart: Provider = { provide: 'PerUserReactionsChart', useExisting: PerUserReactionsChart };
const $PerUserFollowingChart: Provider = { provide: 'PerUserFollowingChart', useExisting: PerUserFollowingChart };
const $PerUserDriveChart: Provider = { provide: 'PerUserDriveChart', useExisting: PerUserDriveChart };
const $ApRequestChart: Provider = { provide: 'ApRequestChart', useExisting: ApRequestChart };
const $ChartManagementService: Provider = { provide: 'ChartManagementService', useExisting: ChartManagementService };

const $AbuseUserReportEntityService: Provider = { provide: 'AbuseUserReportEntityService', useExisting: AbuseUserReportEntityService };
const $AnnouncementEntityService: Provider = { provide: 'AnnouncementEntityService', useExisting: AnnouncementEntityService };
const $AbuseReportNotificationRecipientEntityService: Provider = { provide: 'AbuseReportNotificationRecipientEntityService', useExisting: AbuseReportNotificationRecipientEntityService };
const $AntennaEntityService: Provider = { provide: 'AntennaEntityService', useExisting: AntennaEntityService };
const $AppEntityService: Provider = { provide: 'AppEntityService', useExisting: AppEntityService };
const $AuthSessionEntityService: Provider = { provide: 'AuthSessionEntityService', useExisting: AuthSessionEntityService };
const $BlockingEntityService: Provider = { provide: 'BlockingEntityService', useExisting: BlockingEntityService };
const $ChannelEntityService: Provider = { provide: 'ChannelEntityService', useExisting: ChannelEntityService };
const $ChatEntityService: Provider = { provide: 'ChatEntityService', useExisting: ChatEntityService };
const $ClipEntityService: Provider = { provide: 'ClipEntityService', useExisting: ClipEntityService };
const $DriveFileEntityService: Provider = { provide: 'DriveFileEntityService', useExisting: DriveFileEntityService };
const $DriveFolderEntityService: Provider = { provide: 'DriveFolderEntityService', useExisting: DriveFolderEntityService };
const $EmojiEntityService: Provider = { provide: 'EmojiEntityService', useExisting: EmojiEntityService };
const $FollowingEntityService: Provider = { provide: 'FollowingEntityService', useExisting: FollowingEntityService };
const $FollowRequestEntityService: Provider = { provide: 'FollowRequestEntityService', useExisting: FollowRequestEntityService };
const $GalleryLikeEntityService: Provider = { provide: 'GalleryLikeEntityService', useExisting: GalleryLikeEntityService };
const $GalleryPostEntityService: Provider = { provide: 'GalleryPostEntityService', useExisting: GalleryPostEntityService };
const $HashtagEntityService: Provider = { provide: 'HashtagEntityService', useExisting: HashtagEntityService };
const $InstanceEntityService: Provider = { provide: 'InstanceEntityService', useExisting: InstanceEntityService };
const $InviteCodeEntityService: Provider = { provide: 'InviteCodeEntityService', useExisting: InviteCodeEntityService };
const $ModerationLogEntityService: Provider = { provide: 'ModerationLogEntityService', useExisting: ModerationLogEntityService };
const $MutingEntityService: Provider = { provide: 'MutingEntityService', useExisting: MutingEntityService };
const $RenoteMutingEntityService: Provider = { provide: 'RenoteMutingEntityService', useExisting: RenoteMutingEntityService };
const $NoteEntityService: Provider = { provide: 'NoteEntityService', useExisting: NoteEntityService };
const $NoteFavoriteEntityService: Provider = { provide: 'NoteFavoriteEntityService', useExisting: NoteFavoriteEntityService };
const $NoteReactionEntityService: Provider = { provide: 'NoteReactionEntityService', useExisting: NoteReactionEntityService };
const $NoteDraftEntityService: Provider = { provide: 'NoteDraftEntityService', useExisting: NoteDraftEntityService };
const $NotificationEntityService: Provider = { provide: 'NotificationEntityService', useExisting: NotificationEntityService };
const $PageEntityService: Provider = { provide: 'PageEntityService', useExisting: PageEntityService };
const $PageLikeEntityService: Provider = { provide: 'PageLikeEntityService', useExisting: PageLikeEntityService };
const $SigninEntityService: Provider = { provide: 'SigninEntityService', useExisting: SigninEntityService };
const $UserEntityService: Provider = { provide: 'UserEntityService', useExisting: UserEntityService };
const $UserListEntityService: Provider = { provide: 'UserListEntityService', useExisting: UserListEntityService };
const $FlashEntityService: Provider = { provide: 'FlashEntityService', useExisting: FlashEntityService };
const $FlashLikeEntityService: Provider = { provide: 'FlashLikeEntityService', useExisting: FlashLikeEntityService };
const $RoleEntityService: Provider = { provide: 'RoleEntityService', useExisting: RoleEntityService };
const $ReversiGameEntityService: Provider = { provide: 'ReversiGameEntityService', useExisting: ReversiGameEntityService };
const $MetaEntityService: Provider = { provide: 'MetaEntityService', useExisting: MetaEntityService };
const $SystemWebhookEntityService: Provider = { provide: 'SystemWebhookEntityService', useExisting: SystemWebhookEntityService };

const $ApAudienceService: Provider = { provide: 'ApAudienceService', useExisting: ApAudienceService };
const $ApDbResolverService: Provider = { provide: 'ApDbResolverService', useExisting: ApDbResolverService };
const $ApDeliverManagerService: Provider = { provide: 'ApDeliverManagerService', useExisting: ApDeliverManagerService };
const $ApInboxService: Provider = { provide: 'ApInboxService', useExisting: ApInboxService };
const $ApLoggerService: Provider = { provide: 'ApLoggerService', useExisting: ApLoggerService };
const $ApMfmService: Provider = { provide: 'ApMfmService', useExisting: ApMfmService };
const $ApRendererService: Provider = { provide: 'ApRendererService', useExisting: ApRendererService };
const $ApRequestService: Provider = { provide: 'ApRequestService', useExisting: ApRequestService };
const $ApResolverService: Provider = { provide: 'ApResolverService', useExisting: ApResolverService };
const $JsonLdService: Provider = { provide: 'JsonLdService', useExisting: JsonLdService };
const $RemoteLoggerService: Provider = { provide: 'RemoteLoggerService', useExisting: RemoteLoggerService };
const $RemoteUserResolveService: Provider = { provide: 'RemoteUserResolveService', useExisting: RemoteUserResolveService };
const $WebfingerService: Provider = { provide: 'WebfingerService', useExisting: WebfingerService };
const $ApImageService: Provider = { provide: 'ApImageService', useExisting: ApImageService };
const $ApMentionService: Provider = { provide: 'ApMentionService', useExisting: ApMentionService };
const $ApNoteService: Provider = { provide: 'ApNoteService', useExisting: ApNoteService };
const $ApPersonService: Provider = { provide: 'ApPersonService', useExisting: ApPersonService };
const $ApQuestionService: Provider = { provide: 'ApQuestionService', useExisting: ApQuestionService };
//#endregion

@Module({
	imports: [
		QueueModule,
	],
	providers: [
		LoggerService,
		AbuseReportService,
		AbuseReportNotificationService,
		AccountMoveService,
		AccountUpdateService,
		SensitiveMediaDetectionService,
		AnnouncementService,
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
		FlashService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		ChannelMutingService,
		ChatService,
		RegistryApiService,
		ReversiService,
		PageService,

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
		AnnouncementEntityService,
		AbuseReportNotificationRecipientEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ChatEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NoteDraftEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
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

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AbuseReportService,
		$AbuseReportNotificationService,
		$AccountMoveService,
		$AccountUpdateService,
		$SensitiveMediaDetectionService,
		$AnnouncementService,
		$AntennaService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteDraftService,
		$NotificationService,
		$PollService,
		$SystemAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$ReactionsBufferingService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserRenoteMutingService,
		$UserSearchService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$UserWebhookService,
		$SystemWebhookService,
		$WebhookTestService,
		$UtilityService,
		$FileInfoService,
		$FlashService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$ChannelMutingService,
		$ChatService,
		$RegistryApiService,
		$ReversiService,
		$PageService,

		$ChartLoggerService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,

		$AbuseUserReportEntityService,
		$AnnouncementEntityService,
		$AbuseReportNotificationRecipientEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ChatEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NoteDraftEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ReversiGameEntityService,
		$MetaEntityService,
		$SystemWebhookEntityService,

		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$JsonLdService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		$TelemetryService,
		//#endregion
	],
	exports: [
		QueueModule,
		LoggerService,
		AbuseReportService,
		AbuseReportNotificationService,
		AccountMoveService,
		AccountUpdateService,
		SensitiveMediaDetectionService,
		AnnouncementService,
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
		FlashService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		ChannelMutingService,
		ChatService,
		RegistryApiService,
		ReversiService,
		PageService,

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
		AnnouncementEntityService,
		AbuseReportNotificationRecipientEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ChatEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NoteDraftEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
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

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AbuseReportService,
		$AbuseReportNotificationService,
		$AccountMoveService,
		$AccountUpdateService,
		$SensitiveMediaDetectionService,
		$AnnouncementService,
		$AntennaService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteDraftService,
		$NotificationService,
		$PollService,
		$SystemAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$ReactionsBufferingService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserRenoteMutingService,
		$UserSearchService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$UserWebhookService,
		$SystemWebhookService,
		$WebhookTestService,
		$UtilityService,
		$FileInfoService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$ChannelMutingService,
		$ChatService,
		$RegistryApiService,
		$ReversiService,
		$PageService,

		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,

		$AbuseUserReportEntityService,
		$AnnouncementEntityService,
		$AbuseReportNotificationRecipientEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ChatEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NoteDraftEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ReversiGameEntityService,
		$MetaEntityService,
		$SystemWebhookEntityService,

		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$JsonLdService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		$TelemetryService,
		//#endregion
	],
})
export class CoreModule { }
