/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as legacy_admin from './admin.js';
import * as moved_admin from '../../../../../../features/operations/backend/stream/admin.js';
import * as legacy_antenna from './antenna.js';
import * as moved_antenna from '../../../../../../features/timelines/backend/stream/antenna.js';
import * as legacy_channel from './channel.js';
import * as moved_channel from '../../../../../../features/channels/backend/stream/channel.js';
import * as legacy_chat_room from './chat-room.js';
import * as moved_chat_room from '../../../../../../features/chat/backend/stream/chat-room.js';
import * as legacy_chat_user from './chat-user.js';
import * as moved_chat_user from '../../../../../../features/chat/backend/stream/chat-user.js';
import * as legacy_drive from './drive.js';
import * as moved_drive from '../../../../../../features/drive/backend/stream/drive.js';
import * as legacy_global_timeline from './global-timeline.js';
import * as moved_global_timeline from '../../../../../../features/timelines/backend/stream/global-timeline.js';
import * as legacy_hashtag from './hashtag.js';
import * as moved_hashtag from '../../../../../../features/discovery/backend/stream/hashtag.js';
import * as legacy_home_timeline from './home-timeline.js';
import * as moved_home_timeline from '../../../../../../features/timelines/backend/stream/home-timeline.js';
import * as legacy_hybrid_timeline from './hybrid-timeline.js';
import * as moved_hybrid_timeline from '../../../../../../features/timelines/backend/stream/hybrid-timeline.js';
import * as legacy_local_timeline from './local-timeline.js';
import * as moved_local_timeline from '../../../../../../features/timelines/backend/stream/local-timeline.js';
import * as legacy_queue_stats from './queue-stats.js';
import * as moved_queue_stats from '../../../../../../features/operations/backend/stream/queue-stats.js';
import * as legacy_reversi from './reversi.js';
import * as moved_reversi from '../../../../../../features/games/backend/stream/reversi.js';
import * as legacy_reversi_game from './reversi-game.js';
import * as moved_reversi_game from '../../../../../../features/games/backend/stream/reversi-game.js';
import * as legacy_role_timeline from './role-timeline.js';
import * as moved_role_timeline from '../../../../../../features/timelines/backend/stream/role-timeline.js';
import * as legacy_server_stats from './server-stats.js';
import * as moved_server_stats from '../../../../../../features/statistics/backend/stream/server-stats.js';
import * as legacy_user_list from './user-list.js';
import * as moved_user_list from '../../../../../../features/timelines/backend/stream/user-list.js';

const cases = [
	['admin', legacy_admin, moved_admin],
	['antenna', legacy_antenna, moved_antenna],
	['channel', legacy_channel, moved_channel],
	['chat-room', legacy_chat_room, moved_chat_room],
	['chat-user', legacy_chat_user, moved_chat_user],
	['drive', legacy_drive, moved_drive],
	['global-timeline', legacy_global_timeline, moved_global_timeline],
	['hashtag', legacy_hashtag, moved_hashtag],
	['home-timeline', legacy_home_timeline, moved_home_timeline],
	['hybrid-timeline', legacy_hybrid_timeline, moved_hybrid_timeline],
	['local-timeline', legacy_local_timeline, moved_local_timeline],
	['queue-stats', legacy_queue_stats, moved_queue_stats],
	['reversi', legacy_reversi, moved_reversi],
	['reversi-game', legacy_reversi_game, moved_reversi_game],
	['role-timeline', legacy_role_timeline, moved_role_timeline],
	['server-stats', legacy_server_stats, moved_server_stats],
	['user-list', legacy_user_list, moved_user_list],
] as const;

for (const [moduleName, legacy, moved] of cases) {
	test(`${moduleName} stream exports retain identity`, () => {
		const legacyNames = Object.keys(legacy).sort();
		const movedNames = Object.keys(moved).sort();
		expect(movedNames).toEqual(legacyNames);
		for (const name of legacyNames) {
			expect(Reflect.get(moved, name)).toBe(Reflect.get(legacy, name));
		}
	});
}
