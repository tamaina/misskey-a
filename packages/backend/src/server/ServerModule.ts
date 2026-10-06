/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { EndpointsModule } from '@/server/api/EndpointsModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { ApiCallService } from './api/ApiCallService.js';
import { FileServerService } from './FileServerService.js';
import { HealthServerService } from './HealthServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ServerService } from './ServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { GetterService } from './api/GetterService.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { ApiLoggerService } from './api/ApiLoggerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { AuthenticateService } from './api/AuthenticateService.js';
import { RateLimiterService } from './api/RateLimiterService.js';
import { SigninApiService } from './api/SigninApiService.js';
import { SigninService } from './api/SigninService.js';
import { SignupApiService } from './api/SignupApiService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { OpenApiServerService } from './api/openapi/OpenApiServerService.js';
import { ClientServerService } from './web/ClientServerService.js';
import { HtmlTemplateService } from './web/HtmlTemplateService.js';
import { FeedService } from './web/FeedService.js';
import { UrlPreviewService } from './web/UrlPreviewService.js';
import { ClientLoggerService } from './web/ClientLoggerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';

import MainStreamConnection from '@/server/api/stream/Connection.js';
import { MainChannel } from './api/stream/channels/main.js';
import { AdminChannel } from '../../../features/operations/backend/stream/admin.js';
import { AntennaChannel } from '../../../features/timelines/backend/stream/antenna.js';
import { ChannelChannel } from '../../../features/channels/backend/stream/channel.js';
import { DriveChannel } from '../../../features/drive/backend/stream/drive.js';
import { GlobalTimelineChannel } from '../../../features/timelines/backend/stream/global-timeline.js';
import { HashtagChannel } from '../../../features/discovery/backend/stream/hashtag.js';
import { HomeTimelineChannel } from '../../../features/timelines/backend/stream/home-timeline.js';
import { HybridTimelineChannel } from '../../../features/timelines/backend/stream/hybrid-timeline.js';
import { LocalTimelineChannel } from '../../../features/timelines/backend/stream/local-timeline.js';
import { QueueStatsChannel } from '../../../features/operations/backend/stream/queue-stats.js';
import { ServerStatsChannel } from '../../../features/statistics/backend/stream/server-stats.js';
import { UserListChannel } from '../../../features/timelines/backend/stream/user-list.js';
import { RoleTimelineChannel } from '../../../features/timelines/backend/stream/role-timeline.js';
import { ChatUserChannel } from '../../../features/chat/backend/stream/chat-user.js';
import { ChatRoomChannel } from '../../../features/chat/backend/stream/chat-room.js';
import { ReversiChannel } from '../../../features/games/backend/stream/reversi.js';
import { ReversiGameChannel } from '../../../features/games/backend/stream/reversi-game.js';
import { NoteStreamingHidingService } from './api/stream/NoteStreamingHidingService.js';
import { SigninWithPasskeyApiService } from './api/SigninWithPasskeyApiService.js';

@Module({
	imports: [
		EndpointsModule,
		CoreModule,
	],
	providers: [
		ClientServerService,
		ClientLoggerService,
		HtmlTemplateService,
		FeedService,
		HealthServerService,
		UrlPreviewService,
		ActivityPubServerService,
		FileServerService,
		NodeinfoServerService,
		ServerService,
		WellKnownServerService,
		GetterService,
		MainStreamConnection,
		ApiCallService,
		ApiLoggerService,
		ApiServerService,
		AuthenticateService,
		RateLimiterService,
		SigninApiService,
		SigninWithPasskeyApiService,
		SigninService,
		SignupApiService,
		StreamingApiServerService,
		MainChannel,
		AdminChannel,
		AntennaChannel,
		ChannelChannel,
		DriveChannel,
		GlobalTimelineChannel,
		HashtagChannel,
		RoleTimelineChannel,
		ChatUserChannel,
		ChatRoomChannel,
		ReversiChannel,
		ReversiGameChannel,
		HomeTimelineChannel,
		HybridTimelineChannel,
		LocalTimelineChannel,
		QueueStatsChannel,
		ServerStatsChannel,
		UserListChannel,
		NoteStreamingHidingService,
		OpenApiServerService,
		OAuth2ProviderService,
	],
	exports: [
		ServerService,
	],
})
export class ServerModule {}
