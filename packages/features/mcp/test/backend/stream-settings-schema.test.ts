/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it } from 'vitest';
import * as v from 'valibot';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv-provider.js';
import { streamChannelInputSchema } from '../../backend/stream-parameters.js';
import { streamChannelArguments, streamChannels } from '../../backend/stream.schema.js';

it('exposes discoverable object properties in the MCP channel settings schema', () => {
	expect(ToolSchema.shape.inputSchema.safeParse(streamChannelInputSchema).success).toBe(true);
	expect(streamChannelInputSchema).toMatchObject({
		type: 'object',
		properties: { channel: { type: 'string', enum: [...streamChannels] }, params: { type: 'object' } },
		required: ['channel'],
		additionalProperties: false,
	});
});

// These constraints use draft-07-compatible keywords; the SDK's bundled AJV uses draft-07.
const { $schema: _dialect, ...validationSchema } = streamChannelInputSchema;

const requiredParams: Record<string, Record<string, unknown>> = {
	userList: { listId: 'list' }, hashtag: { q: [['tag']] }, roleTimeline: { roleId: 'role' },
	antenna: { antennaId: 'antenna' }, channel: { channelId: 'channel' },
	chatUser: { otherId: 'user' }, chatRoom: { roomId: 'room' }, reversiGame: { gameId: 'game' },
};

it.each(streamChannels)('preserves native argument constraints for %s in JSON Schema', channel => {
	const validate = new AjvJsonSchemaValidator().getValidator(validationSchema);
	const params = requiredParams[channel] ?? {};
	const valid = { channel, params };
	expect(validate(valid).valid).toBe(true);
	for (const input of [
		{ channel }, valid, { ...valid, extra: true }, { channel, params: { ...params, extra: true } },
		{ channel, params: null }, { channel, params: { ...params, withFiles: 'yes' } },
		{ channel, params: Object.fromEntries(Object.keys(params).map(key => [key, ''])) },
	]) {
		expect(validate(input).valid, JSON.stringify(input)).toBe(v.safeParse(streamChannelArguments, input).success);
	}
});

it('rejects unknown channels and invalid hashtag dimensions', () => {
	const validate = new AjvJsonSchemaValidator().getValidator(validationSchema);
	for (const input of [null, [], {}, { channel: 'unknown' },
		{ channel: 'hashtag', params: { q: [] } }, { channel: 'hashtag', params: { q: [[]] } },
		{ channel: 'hashtag', params: { q: [['x'.repeat(101)]] } },
		{ channel: 'hashtag', params: { q: Array.from({ length: 11 }, () => ['tag']) } },
	]) expect(validate(input).valid).toBe(false);
});
