/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { channelInputs } from '../../contract/index.js';
import { packedEndpointDefinitions, packedChannelsShowDefinition as showDefinition, packedChannelsShowOutput as showOutput, packedChannelsCreateInput as createInput, packedChannelsUpdateInput as updateInput, packedChannelsTimelineInput as timelineInput } from '../../contract/packed-endpoint-definitions.js';
import { packedChannelSchema } from '../../contract/packed.js';
import { ChannelEntityService } from '../../backend/serializers/ChannelEntityService.js';
import { EndpointImplementation as ShowEndpoint } from '../../backend/endpoints/channels/show.js';
import { MiChannel } from '../../backend/models/Channel.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import type { Packed } from '@features/index/contract/packed.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { ChannelsRepository, ChannelFollowingsRepository, ChannelFavoritesRepository, ChannelMutingRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const date = new Date('2026-01-01T00:00:00.000Z');
const channel = Object.assign(new MiChannel(), { id: 'channel123', lastNotedAt: null, name: 'Channel', description: null, userId: null, bannerId: null, pinnedNoteIds: [], color: '#86b300', isArchived: false, usersCount: 0, notesCount: 0, isSensitive: false, allowRenoteToExternal: true });

function fixture() {
	const channels = mockDeep<ChannelsRepository>();
	const followings = mockDeep<ChannelFollowingsRepository>();
	const favorites = mockDeep<ChannelFavoritesRepository>();
	const muting = mockDeep<ChannelMutingRepository>();
	const notes = mockDeep<Pick<NoteEntityService, 'packMany'>>();
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	followings.exists.mockResolvedValue(true);
	favorites.exists.mockResolvedValue(false);
	muting.exists.mockResolvedValue(true);
	notes.packMany.mockResolvedValue([]);
	const serializer = new ChannelEntityService(channels, followings, favorites, muting, mockDeep(), mockDeep(), notes, mockDeep(), ids);
	return { channels, followings, favorites, muting, notes, serializer };
}

test('all channel input objects discard unknown native fields and retain defaults/optional nullable values', () => {
	expectTypeOf<string extends keyof v.InferOutput<typeof createInput> ? true : false>().toEqualTypeOf<false>();
	expectTypeOf<string extends keyof v.InferOutput<typeof packedChannelSchema> ? true : false>().toEqualTypeOf<false>();
	for (const [name, definition] of Object.entries(packedEndpointDefinitions)) {
		const params = name === 'channels/create' ? { name: 'Channel' } : name === 'channels/search' ? { query: '' } : ['channels/show', 'channels/update', 'channels/timeline'].includes(name) ? { channelId: 'channel123' } : {};
		const parsed = v.parse(definition.input, { ...params, i: 'transport', future: true });
		expect(parsed).not.toHaveProperty('i');
		expect(parsed).not.toHaveProperty('future');
		expect(parsed).toMatchObject(params);
		expect(projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition).input).not.toHaveProperty('additionalProperties');
	}
	for (const input of Object.values(channelInputs)) {
		expect(v.parse(input, { channelId: 'channel123', future: true })).toEqual({ channelId: 'channel123' });
		expect(v.safeParse(input, {}).success).toBe(false);
		expect(v.safeParse(input, { channelId: 'bad-id' }).success).toBe(false);
	}
	expect(v.parse(channelInputs['channels/mute/create'], { channelId: 'channel123', expiresAt: null })).toEqual({ channelId: 'channel123', expiresAt: null });
	expect(v.safeParse(channelInputs['channels/mute/create'], { channelId: 'channel123', expiresAt: 1.5 }).success).toBe(false);
	expect(v.parse(createInput, { name: 'Channel', description: null, bannerId: null, isSensitive: null, allowRenoteToExternal: null })).toMatchObject({ description: null, bannerId: null, isSensitive: null, allowRenoteToExternal: null });
	expect(v.parse(updateInput, { channelId: 'channel123', isArchived: null })).toEqual({ channelId: 'channel123', isArchived: null });
	expect(v.parse(timelineInput, { channelId: 'channel123' })).toEqual({ channelId: 'channel123', limit: 10, allowPartial: false });
	expect(v.parse(packedEndpointDefinitions['channels/search'].input, { query: '' })).toEqual({ query: '', type: 'nameAndDescription', limit: 5 });
	expect(v.parse(packedEndpointDefinitions['channels/followed'].input, {})).toEqual({ limit: 5 });
	expect(v.safeParse(createInput, { name: '' }).success).toBe(false);
	expect(v.safeParse(timelineInput, { channelId: 'channel123', limit: 101 }).success).toBe(false);
});

test.each([{ authenticated: false, detailed: false }, { authenticated: false, detailed: true }, { authenticated: true, detailed: false }, { authenticated: true, detailed: true }])('real Channel serializer validates finite top-level shape: %j', async ({ authenticated, detailed }) => {
	const { serializer } = fixture();
	const user = authenticated ? mockDeep<MiLocalUser>({ id: 'user123' }) : null;
	const result = await serializer.pack(channel, user, detailed);
	expect(v.parse(packedChannelSchema, result)).toEqual(result);
	if (authenticated) expect(result).toMatchObject({ isFollowing: true, isFavorited: false, isMuting: true, hasUnreadNote: false });
	else expect(result).not.toHaveProperty('hasUnreadNote');
	if (detailed) expect(result.pinnedNotes).toEqual([]);
	else expect(result).not.toHaveProperty('pinnedNotes');
	expect(result).toMatchObject({ lastNotedAt: null, description: null, userId: null, bannerUrl: null, bannerId: null });
	for (const invalid of [{ ...result, name: undefined }, { ...result, usersCount: '0' }, { ...result, hasUnreadNote: null }, { ...result, pinnedNotes: [7] }, { ...result, future: true }]) expect(v.safeParse(packedChannelSchema, invalid).success).toBe(false);
	for (const [name, definition] of Object.entries(packedEndpointDefinitions)) {
		if (name === 'channels/timeline') continue;
		const output = ['channels/create', 'channels/show', 'channels/update'].includes(name) ? result : [result];
		expect(v.safeParse(definition.output, output).success).toBe(true);
		const invalid = ['channels/create', 'channels/show', 'channels/update'].includes(name) ? { ...result, future: true } : [{ ...result, future: true }];
		expect(v.safeParse(definition.output, invalid).success).toBe(false);
	}
});

test('show handler runs actual detailed serializer, preserving missing-channel error', async () => {
	const { channels, serializer, notes } = fixture();
	channels.findOneBy.mockResolvedValue(channel);
	const endpoint = new ShowEndpoint(channels, serializer);
	const result = await endpoint.exec({ channelId: channel.id, future: true }, mockDeep<MiLocalUser>({ id: 'user123' }), null);
	expect(v.parse(showOutput, result)).toEqual(result);
	expect(result).toMatchObject({ hasUnreadNote: false, pinnedNotes: [] });
	expect(notes.packMany).toHaveBeenCalledWith([], expect.objectContaining({ id: 'user123' }));
	channels.findOneBy.mockResolvedValue(null);
	await expect(endpoint.exec({ channelId: channel.id }, null, null)).rejects.toMatchObject({ code: 'NO_SUCH_CHANNEL', id: '6f6c314b-7486-4897-8966-c04a66a02923' });
});

test('HTTP retains extra input/output keys and AJV errors while native strict output rejects extras', async () => {
	const { serializer } = fixture();
	const result = { ...await serializer.pack(channel), future: true };
	const params = { channelId: 'channel123', i: 'transport', future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(showDefinition), async ps => { expect(ps).toBe(params); return result; });
	expect(await endpoint.exec(params, null, null)).toBe(result);
	expect(v.safeParse(showOutput, result).success).toBe(false);
	expect(toLegacyJsonSchema(packedChannelSchema, { target: 'openapi-3.0', typeMode: 'output' })).toMatchObject({ additionalProperties: false, properties: { hasUnreadNote: { type: 'boolean' } } });
	await expect(endpoint.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532', info: { param: '#/required' } });
	await expect(endpoint.exec({ channelId: 'bad-id' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/properties/channelId/format' } });
	const timelineParams = { channelId: 'channel123', future: true };
	const timeline = new ContractEndpoint({}, projectEndpointContract(packedEndpointDefinitions['channels/timeline']), async () => []);
	expect(await timeline.exec(timelineParams, null, null)).toEqual([]);
	expect(timelineParams).toEqual({ channelId: 'channel123', future: true, limit: 10, allowPartial: false });
});

test('detailed Channel validates finite Notes/UserLite and dynamic reactions without parsing producer values', async () => {
	const { serializer, notes } = fixture();
	const baseUser: Packed<'Note'>['user'] = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example.test/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' };
	const extendedUser = { ...baseUser, producerExtension: true };
	const baseNote: Packed<'Note'> = {
		id: 'note123', createdAt: date.toISOString(), text: 'Pinned', userId: 'user123',
		user: baseUser,
		visibility: 'public', reactionAcceptance: null, reactionEmojis: { 'remote@host': 'https://host/emoji.png' }, reactions: { '🔥': 1 }, reactionCount: 1, renoteCount: 0, repliesCount: 0,
	};
	const note = { ...baseNote, producerExtension: true };
	notes.packMany.mockResolvedValue([baseNote]);
	const result = await serializer.pack(channel, null, true);
	expect(v.parse(packedChannelSchema, result)).toEqual(result);
	expect(result.pinnedNotes).toEqual([baseNote]);
	expect(v.safeParse(packedChannelSchema, { ...result, pinnedNotes: [note] }).success).toBe(false);
	const extendedUserNote = { ...baseNote, user: extendedUser };
	expect(v.safeParse(packedChannelSchema, { ...result, pinnedNotes: [extendedUserNote] }).success).toBe(false);
	notes.packMany.mockResolvedValue([extendedUserNote]);
	expect((await serializer.pack(channel, null, true)).pinnedNotes?.[0].user).toBe(extendedUser);
	notes.packMany.mockResolvedValue([note]);
	expect((await serializer.pack(channel, null, true)).pinnedNotes).toEqual([note]);
	expect(v.safeParse(packedChannelSchema, { ...result, pinnedNotes: [{ ...baseNote, reactions: { x: 'bad' } }] }).success).toBe(false);
	expect(v.safeParse(packedChannelSchema, { ...result, pinnedNotes: [{ ...baseNote, user: { ...baseNote.user, username: undefined } }] }).success).toBe(false);
});
