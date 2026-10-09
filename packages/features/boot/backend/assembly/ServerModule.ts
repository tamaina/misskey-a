/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DiscoveryApplicationService } from '@features/discovery/backend/endpoints/discovery.application.js';
import { HashtagsListOperation } from '@features/discovery/backend/endpoints/hashtags/list.js';
import { HashtagsSearchOperation } from '@features/discovery/backend/endpoints/hashtags/search.js';
import { HashtagsShowOperation } from '@features/discovery/backend/endpoints/hashtags/show.js';
import { HashtagsTrendOperation } from '@features/discovery/backend/endpoints/hashtags/trend.js';
import { HashtagsUsersOperation } from '@features/discovery/backend/endpoints/hashtags/users.js';
import { NotesFeaturedOperation } from '@features/discovery/backend/endpoints/notes/featured.js';
import { NotesSearchByTagOperation } from '@features/discovery/backend/endpoints/notes/search-by-tag.js';
import { UsersFeaturedNotesOperation } from '@features/discovery/backend/endpoints/users/featured-notes.js';
import { UsersGetFrequentlyRepliedUsersOperation } from '@features/discovery/backend/endpoints/users/get-frequently-replied-users.js';
import { UsersRecommendationOperation } from '@features/discovery/backend/endpoints/users/recommendation.js';
import { UsersSearchOperation } from '@features/discovery/backend/endpoints/users/search.js';
import { UsersSearchByUsernameAndHostOperation } from '@features/discovery/backend/endpoints/users/search-by-username-and-host.js';
import { Module } from '@nestjs/common';
import { EndpointsModule } from './EndpointsModule.js';
import { CoreModule } from './CoreModule.js';
import { ApiCallService } from '@features/api/backend/transport/ApiCallService.js';
import { FileServerService } from '@features/drive/backend/http/FileServerService.js';
import { HealthServerService } from '@features/operations/backend/http/HealthServerService.js';
import { NodeinfoServerService } from '@features/instance/backend/http/NodeinfoServerService.js';
import { ServerService } from './ServerService.mjs';
import { WellKnownServerService } from '@features/federation/backend/http/WellKnownServerService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ActivityPubServerService } from '@features/federation/backend/http/ActivityPubServerService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { ApiServerService } from '@features/api/backend/transport/ApiServerService.js';
import { OrpcPilotService } from '@features/api/backend/transport/OrpcPilotService.js';
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
import { UrlPreviewService } from '@features/markup/backend/http/UrlPreviewService.js';
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
		OrpcPilotService,
		DiscoveryApplicationService,
		HashtagsListOperation,
		HashtagsSearchOperation,
		HashtagsShowOperation,
		HashtagsTrendOperation,
		HashtagsUsersOperation,
		NotesFeaturedOperation,
		NotesSearchByTagOperation,
		UsersFeaturedNotesOperation,
		UsersGetFrequentlyRepliedUsersOperation,
		UsersRecommendationOperation,
		UsersSearchOperation,
		UsersSearchByUsernameAndHostOperation,

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
