/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { EndpointsModule } from './EndpointsModule.js';
import { CoreModule } from './CoreModule.js';
import { ApiCallService } from '@features/api/backend/transport/ApiCallService.js';
import { FileServerService } from '@/server/FileServerService.js';
import { HealthServerService } from '@/server/HealthServerService.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { ServerService } from './ServerService.mjs';
import { WellKnownServerService } from '@/server/WellKnownServerService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ActivityPubServerService } from '@/server/ActivityPubServerService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { ApiServerService } from '@features/api/backend/transport/ApiServerService.js';
import { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import { SigninApiService } from '@features/auth/backend/transport/SigninApiService.js';
import { SigninService } from '@features/auth/backend/transport/SigninService.js';
import { SignupApiService } from '@features/auth/backend/transport/SignupApiService.js';
import { StreamingApiServerService } from '@features/api/backend/transport/StreamingApiServerService.js';
import { OpenApiServerService } from '@features/api/backend/transport/openapi/OpenApiServerService.js';
import { ClientServerService } from '@features/web/backend/http/ClientServerService.js';
import { HtmlTemplateService } from '@features/web/backend/http/HtmlTemplateService.js';
import { FeedService } from '@features/web/backend/http/FeedService.js';
import { UrlPreviewService } from '@/server/web/UrlPreviewService.js';
import { ClientLoggerService } from '@features/web/backend/http/ClientLoggerService.js';
import { OAuth2ProviderService } from '@features/auth/backend/oauth/OAuth2ProviderService.js';

import { Connection as MainStreamConnection } from '@features/api/backend/transport/stream/Connection.js';
import { MainChannel } from '@features/api/backend/transport/stream/channels/main.js';
import { AdminChannel } from '@features/operations/backend/stream/admin.js';
import { AntennaChannel } from '@features/timelines/backend/stream/antenna.js';
import { ChannelChannel } from '@features/channels/backend/stream/channel.js';
import { DriveChannel } from '@features/drive/backend/stream/drive.js';
import { GlobalTimelineChannel } from '@features/timelines/backend/stream/global-timeline.js';
import { HashtagChannel } from '@features/discovery/backend/stream/hashtag.js';
import { HomeTimelineChannel } from '@features/timelines/backend/stream/home-timeline.js';
import { HybridTimelineChannel } from '@features/timelines/backend/stream/hybrid-timeline.js';
import { LocalTimelineChannel } from '@features/timelines/backend/stream/local-timeline.js';
import { QueueStatsChannel } from '@features/operations/backend/stream/queue-stats.js';
import { ServerStatsChannel } from '@features/statistics/backend/stream/server-stats.js';
import { UserListChannel } from '@features/timelines/backend/stream/user-list.js';
import { RoleTimelineChannel } from '@features/timelines/backend/stream/role-timeline.js';
import { ChatUserChannel } from '@features/chat/backend/stream/chat-user.js';
import { ChatRoomChannel } from '@features/chat/backend/stream/chat-room.js';
import { ReversiChannel } from '@features/games/backend/stream/reversi.js';
import { ReversiGameChannel } from '@features/games/backend/stream/reversi-game.js';
import { NoteStreamingHidingService } from '@features/api/backend/transport/stream/NoteStreamingHidingService.js';
import { SigninWithPasskeyApiService } from '@features/auth/backend/transport/SigninWithPasskeyApiService.js';

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
