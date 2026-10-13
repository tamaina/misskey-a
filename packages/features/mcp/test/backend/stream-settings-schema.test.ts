/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it } from 'vitest';
import * as v from 'valibot';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv-provider.js';
import { streamChannelInputSchema, streamNoteInputSchema } from '../../backend/stream-parameters.js';
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

it('uses the mandatory MCP 2020-12 dialect for generated event schemas and nested resources', () => {
	const dialect = 'https://json-schema.org/draft/2020-12/schema';
	expect(streamChannelInputSchema.$schema).toBe(dialect);
	expect(streamNoteInputSchema.$schema).toBe(dialect);
	const inspect = (value: unknown) => {
		if (!value || typeof value !== 'object') return;
		if ('$schema' in value) expect(value.$schema).toBe(dialect);
		for (const child of Object.values(value)) inspect(child);
	};
	inspect(streamChannelInputSchema);
	inspect(streamNoteInputSchema);
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

it('advertises explicitly typed channel enums in all native branches', () => {
	const branches = streamChannelInputSchema.oneOf as { properties: { channel: Record<string, unknown> } }[];
	expect(branches).toHaveLength(streamChannels.length);
	for (const [index, branch] of branches.entries()) {
		expect(branch.properties.channel).toEqual({ type: 'string', enum: [streamChannels[index]] });
	}
});

it('advertises the finite parameter fields at the object root without weakening branch constraints', () => {
	const root = streamChannelInputSchema.properties as { params: { properties: Record<string, unknown>; additionalProperties: boolean } };
	expect(Object.keys(root.params.properties).sort()).toEqual([
		'antennaId', 'channelId', 'gameId', 'listId', 'otherId', 'q', 'roleId', 'roomId', 'withFiles', 'withRenotes', 'withReplies',
	]);
	expect(root.params.additionalProperties).toBe(false);
	expect(root.params.properties.withFiles).toMatchObject({ type: 'boolean' });
	expect(root.params.properties.antennaId).toMatchObject({ type: 'string', minLength: 1, maxLength: 32 });
	const validate = new AjvJsonSchemaValidator().getValidator(validationSchema);
	// Fields discoverable at the root remain usable only for the native channel that accepts them.
	expect(validate({ channel: 'main', params: { antennaId: 'antenna' } }).valid).toBe(false);
	expect(validate({ channel: 'antenna', params: {} }).valid).toBe(false);
	expect(validate({ channel: 'antenna', params: { antennaId: 'antenna' } }).valid).toBe(true);
});
