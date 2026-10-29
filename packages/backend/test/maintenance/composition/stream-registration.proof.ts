/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import { ServerModule } from '@features/boot/backend/assembly/ServerModule.js';

import * as moved_admin from '@features/operations/backend/stream/admin.js';

import * as moved_antenna from '@features/timelines/backend/stream/antenna.js';

import * as moved_channel from '@features/channels/backend/stream/channel.js';

import * as moved_chat_room from '@features/chat/backend/stream/chat-room.js';

import * as moved_chat_user from '@features/chat/backend/stream/chat-user.js';

import * as moved_drive from '@features/drive/backend/stream/drive.js';

import * as moved_global_timeline from '@features/timelines/backend/stream/global-timeline.js';

import * as moved_hashtag from '@features/discovery/backend/stream/hashtag.js';

import * as moved_home_timeline from '@features/timelines/backend/stream/home-timeline.js';

import * as moved_hybrid_timeline from '@features/timelines/backend/stream/hybrid-timeline.js';

import * as moved_local_timeline from '@features/timelines/backend/stream/local-timeline.js';

import * as moved_queue_stats from '@features/operations/backend/stream/queue-stats.js';

import * as moved_reversi from '@features/games/backend/stream/reversi.js';

import * as moved_reversi_game from '@features/games/backend/stream/reversi-game.js';

import * as moved_role_timeline from '@features/timelines/backend/stream/role-timeline.js';

import * as moved_server_stats from '@features/statistics/backend/stream/server-stats.js';

import * as moved_user_list from '@features/timelines/backend/stream/user-list.js';

const serverProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ServerModule) as unknown[];

const cases = [
	['admin', moved_admin],
	['antenna', moved_antenna],
	['channel', moved_channel],
	['chat-room', moved_chat_room],
	['chat-user', moved_chat_user],
	['drive', moved_drive],
	['global-timeline', moved_global_timeline],
	['hashtag', moved_hashtag],
	['home-timeline', moved_home_timeline],
	['hybrid-timeline', moved_hybrid_timeline],
	['local-timeline', moved_local_timeline],
	['queue-stats', moved_queue_stats],
	['reversi', moved_reversi],
	['reversi-game', moved_reversi_game],
	['role-timeline', moved_role_timeline],
	['server-stats', moved_server_stats],
	['user-list', moved_user_list],
] as const;

for (const [moduleName, featureModule] of cases) {
	test(`${moduleName} stream channel stays on the canonical per-request provider`, () => {
		const channelClasses = Object.values(featureModule).filter(value => typeof value === 'function');
		expect(channelClasses).toHaveLength(1);
		const [channelClass] = channelClasses;
		expect(serverProviders.filter(provider => provider === channelClass)).toHaveLength(1);
	});
}
