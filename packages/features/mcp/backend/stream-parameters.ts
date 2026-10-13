/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import { streamChannelArguments, streamChannels, streamNoteArguments } from './stream.schema.js';
import type { StreamSubscription } from './stream-types.js';
const empty = v.strictObject({});
export const streamChannelInputSchema: Record<string, unknown> = {
	...toJsonSchema(streamChannelArguments),
	// MCP settings discovery expects object properties at the root. Keep the
	// generated oneOf branches to enforce each native channel's parameters.
	type: 'object',
	properties: {
		channel: { type: 'string', enum: [...streamChannels] },
		params: { type: 'object' },
	},
	required: ['channel'],
	additionalProperties: false,
};
export const streamNoteInputSchema: Record<string, unknown> = { ...toJsonSchema(streamNoteArguments) };
export function streamSubscription(name: string, args: unknown): StreamSubscription | null {
	if (name === 'stream.channel') return v.parse(streamChannelArguments, args) as StreamSubscription;
	if (name === 'stream.broadcast') { v.parse(empty, args); return { channel: 'broadcast', params: {} }; }
	if (name === 'stream.note') return { channel: 'note', params: v.parse(streamNoteArguments, args) };
	return null;
}
/** Fixed order/default normalization yields one identity for equivalent native parameters. */
export function canonicalStream(value: StreamSubscription): StreamSubscription {
	const params = { ...value.params };
	if (['homeTimeline', 'localTimeline', 'hybridTimeline', 'globalTimeline', 'userList'].includes(value.channel)) { params.withRenotes ??= true; params.withFiles ??= false; }
	if (value.channel === 'localTimeline' || value.channel === 'hybridTimeline') params.withReplies ??= false;
	return { channel: value.channel, params: Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))) };
}
