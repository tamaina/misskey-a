/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ChannelFederationService } from '../../backend/services/ChannelFederationService.js';
import type { ModuleRef } from '@nestjs/core';
import type * as Redis from 'ioredis';
import type { Config } from '@/config.js';
import type { MiChannel } from '../../backend/models/Channel.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import type { ApResolverService, Resolver } from '@features/federation/backend/services/ApResolverService.js';
import type { ChannelsRepository, ChannelFollowingsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';

test('remote channel updates use bounded canonical metadata and distinguish null, false and omission', async () => {
	const uri = 'https://remote.test/channels/group123';
	const actor = mockDeep<MiRemoteUser>({ id: 'group123', host: 'remote.test', uri });
	const channel = mockDeep<MiChannel>({ id: 'channel123', uri, name: 'old name', description: 'old description', isSensitive: false, isFederationFrozen: false });
	const channels = mockDeep<ChannelsRepository>();
	channels.findOneBy.mockResolvedValue(channel);
	const resolver = mockDeep<Resolver>();
	const resolverService = mockDeep<ApResolverService>();
	resolverService.createResolver.mockResolvedValue(resolver);
	const service = new ChannelFederationService(mockDeep<Config>({ url: 'https://local.test' }), mockDeep<Redis.Redis>(), channels, mockDeep<ChannelFollowingsRepository>(),
		mockDeep<UsersRepository>(), mockDeep<NotesRepository>(), mockDeep<FollowingsRepository>(), mockDeep<IdService>(), mockDeep<GlobalEventService>(),
		mockDeep<QueueService>(), mockDeep<ApRendererService>(), resolverService, mockDeep<ModuleRef>());

	const group = { type: 'Group', id: uri, _misskey_channel: true };
	const incoming = { ...group, name: 'old name', _misskey_summary: null, sensitive: false };
	resolver.resolve.mockResolvedValue({ ...group, name: 'x'.repeat(129), _misskey_summary: 'y'.repeat(2049), sensitive: true });
	await service.receiveUpdate(actor, incoming);
	const updated = { name: 'x'.repeat(128), description: 'y'.repeat(2048), isSensitive: true };
	expect(resolver.resolve).toHaveBeenCalledWith(uri);
	expect(channels.update).toHaveBeenCalledWith(channel.id, updated);
	Object.assign(channel, updated);
	channels.update.mockClear();

	resolver.resolve.mockResolvedValue({ ...group, name: null });
	await service.receiveUpdate(actor, incoming);
	expect(channels.update).not.toHaveBeenCalled();

	resolver.resolve.mockResolvedValue({ ...group, _misskey_summary: null, sensitive: false });
	await service.receiveUpdate(actor, incoming);
	expect(channels.update).toHaveBeenCalledExactlyOnceWith(channel.id, { description: null, isSensitive: false });
});
