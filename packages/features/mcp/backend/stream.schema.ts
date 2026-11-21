/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
export const streamChannels = ['main', 'homeTimeline', 'localTimeline', 'hybridTimeline', 'globalTimeline', 'userList', 'hashtag', 'roleTimeline', 'antenna', 'channel', 'drive', 'admin', 'chatUser', 'chatRoom', 'reversi', 'reversiGame', 'serverStats', 'queueStats'] as const;
export type StreamChannel = typeof streamChannels[number];
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(32));
const options = { withRenotes: v.optional(v.boolean()), withFiles: v.optional(v.boolean()) };
const empty = v.strictObject({});
const params = {
	main: empty, drive: empty, admin: empty, reversi: empty, serverStats: empty, queueStats: empty,
	homeTimeline: v.strictObject(options), globalTimeline: v.strictObject(options),
	localTimeline: v.strictObject({ ...options, withReplies: v.optional(v.boolean()) }),
	hybridTimeline: v.strictObject({ ...options, withReplies: v.optional(v.boolean()) }),
	userList: v.strictObject({ ...options, listId: id }), antenna: v.strictObject({ antennaId: id }),
	roleTimeline: v.strictObject({ roleId: id }), channel: v.strictObject({ channelId: id }),
	chatUser: v.strictObject({ otherId: id }), chatRoom: v.strictObject({ roomId: id }), reversiGame: v.strictObject({ gameId: id }),
	hashtag: v.strictObject({ q: v.pipe(v.array(v.pipe(v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(100))), v.minLength(1), v.maxLength(10))), v.minLength(1), v.maxLength(10)) }),
};
const requiredParams = new Set(['userList', 'hashtag', 'roleTimeline', 'antenna', 'channel', 'chatUser', 'chatRoom', 'reversiGame']);
export const streamChannelArguments = v.variant('channel', streamChannels.map(channel => v.strictObject({ channel: v.literal(channel), params: requiredParams.has(channel) ? params[channel] : v.optional(params[channel], {}) })));
export const streamNoteArguments = v.strictObject({ noteId: id });
