/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const eventNames = ['note.mentioned', 'note.replied', 'antenna.note', 'stream.channel', 'stream.broadcast', 'stream.note'] as const;
export type McpEventName = typeof eventNames[number];
