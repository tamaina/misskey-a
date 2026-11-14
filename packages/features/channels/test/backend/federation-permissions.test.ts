/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { MiChannel } from '../../backend/models/Channel.js';
import { createChannelsCreateProcedure, type ChannelsCreateDependencies } from '../../backend/endpoints/channels/create.js';
import { createChannelsUpdateProcedure, type ChannelsUpdateDependencies } from '../../backend/endpoints/channels/update.js';

const packed: Packed<'Channel'> = {
	id: 'channel123', createdAt: new Date(0).toISOString(), lastNotedAt: null,
	name: 'channel', description: null, userId: 'owner123', bannerUrl: null, bannerId: null,
	pinnedNoteIds: [], color: '#000', isArchived: false, usersCount: 0, notesCount: 0,
	isSensitive: false, isFederated: false, isFederationFrozen: false, uri: null, host: null,
	allowRenoteToExternal: true,
};

function fixture(userId = 'owner123', moderator = false, eligible = true) {
	const deps = mockDeep<ChannelsUpdateDependencies & ChannelsCreateDependencies>();
	const channel = mockDeep<MiChannel>({ ...packed, lastNotedAt: null });
	deps.channelsRepository.findOneBy.mockResolvedValue(channel);
	deps.channelsRepository.findOneByOrFail.mockResolvedValue(channel);
	deps.channelEntityService.pack.mockResolvedValue(packed);
	deps.channelFederationService.refreshEligibility.mockImplementation(async value => value);
	deps.roleService.isModerator.mockResolvedValue(moderator);
	deps.roleService.getUserPolicies.mockResolvedValue({ canFederateChannel: eligible } as never);
	const context = testContext(mockDeep<MiLocalUser>({ id: userId, isSuspended: false, movedToUri: null }));
	return { deps, channel, context };
}

test('federation creation requires owner eligibility, ordinary creation remains available', async () => {
	const f = fixture('owner123', false, false);
	await expect(call(createChannelsCreateProcedure(f.deps), { name: 'channel', isFederated: true }, { context: f.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(f.deps.channelsRepository.insertOne).not.toHaveBeenCalled();
	await call(createChannelsCreateProcedure(f.deps), { name: 'channel' }, { context: f.context });
	expect(f.deps.channelsRepository.insertOne).toHaveBeenCalledWith(expect.objectContaining({ isFederated: false }));
});

test('owner cannot lift moderator freeze', async () => {
	const f = fixture();
	f.channel.isFederationFrozen = true;
	await expect(call(createChannelsUpdateProcedure(f.deps), { channelId: 'channel123', isFederationFrozen: false }, { context: f.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(f.deps.channelsRepository.update).not.toHaveBeenCalled();
});

test('moderator freezes without changing the owner preference', async () => {
	const f = fixture('moderator123', true);
	f.channel.isFederated = true;
	await call(createChannelsUpdateProcedure(f.deps), { channelId: 'channel123', isFederationFrozen: true }, { context: f.context });
	expect(f.deps.channelsRepository.update).toHaveBeenCalledWith('channel123', expect.objectContaining({ isFederationFrozen: true }));
	expect(f.deps.channelsRepository.update.mock.calls[0][1]).not.toHaveProperty('isFederated');
	expect(f.deps.channelFederationService.deliverUpdate).toHaveBeenCalled();
});

test('moderator cannot overwrite owner preference', async () => {
	const f = fixture('moderator123', true);
	await expect(call(createChannelsUpdateProcedure(f.deps), { channelId: 'channel123', isFederated: true }, { context: f.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
});

test('unfreezing requires the owner current eligibility, not moderator eligibility', async () => {
	const f = fixture('moderator123', true, false);
	f.channel.isFederationFrozen = true;
	await expect(call(createChannelsUpdateProcedure(f.deps), { channelId: 'channel123', isFederationFrozen: false }, { context: f.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(f.deps.roleService.getUserPolicies).toHaveBeenCalledWith('owner123', true);
});

test('eligible owner enable does not clear sticky freeze', async () => {
	const f = fixture();
	f.channel.isFederationFrozen = true;
	await call(createChannelsUpdateProcedure(f.deps), { channelId: 'channel123', isFederated: true }, { context: f.context });
	expect(f.deps.channelsRepository.update.mock.calls[0][1]).not.toHaveProperty('isFederationFrozen');
});
