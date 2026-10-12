/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';
export const streamChannels = ['main', 'homeTimeline', 'localTimeline', 'hybridTimeline', 'globalTimeline', 'userList', 'hashtag', 'roleTimeline', 'antenna', 'channel', 'drive', 'admin', 'chatUser', 'chatRoom', 'reversi', 'reversiGame', 'serverStats', 'queueStats'] as const;
export type StreamChannel = typeof streamChannels[number];
export interface StreamSubscription { channel: StreamChannel | 'broadcast' | 'note'; params: JsonObject }
/** Publisher identity is shared by every observer. Message is reduced before queue storage. */
export interface StreamOccurrence { id: string; createdAt: number; channel: string; message: JsonValue }
