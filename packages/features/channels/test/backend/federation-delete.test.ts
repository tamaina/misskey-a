/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ChannelFederationService } from '../../backend/services/ChannelFederationService.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import type { ModuleRef } from '@nestjs/core';
import type * as Redis from 'ioredis';
import type { Config } from '@/config.js';
import type { MiChannel } from '../../backend/models/Channel.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import type { ApResolverService, Resolver } from '@features/federation/backend/services/ApResolverService.js';
import type { IAnnounce, IDelete } from '@features/federation/backend/protocol/type.js';
import type { ChannelsRepository, ChannelFollowingsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';

const origin = 'https://remote.test';
const groupUri = `${origin}/channels/group123`;
const authorUri = `${origin}/users/author123`;
const noteUri = `${origin}/notes/note123`;
const publicAudience = 'https://www.w3.org/ns/activitystreams#Public';

test.each([404, 410])('Group Delete retains a resolvable Note and retries until the author returns %i', async status => {
	const group = mockDeep<MiRemoteUser>({ id: 'group123', uri: groupUri, host: 'remote.test', isSuspended: false, isRemoteSuspended: false });
	const channel = mockDeep<MiChannel>({ id: 'channel123', uri: groupUri, host: group.host });
	const note = mockDeep<MiNote>({ id: 'note123', uri: noteUri, channelId: channel.id, userId: 'author123' });
	const author = mockDeep<MiRemoteUser>({ id: 'author123', uri: authorUri });
	const channels = mockDeep<ChannelsRepository>();
	channels.findOneBy.mockResolvedValue(channel);
	const notes = mockDeep<NotesRepository>();
	notes.findOneBy.mockResolvedValue(note);
	const users = mockDeep<UsersRepository>();
	users.findOneByOrFail.mockResolvedValue(author);

	const resolver = mockDeep<Resolver>();
	const resolverService = mockDeep<ApResolverService>();
	resolverService.createResolver.mockResolvedValue(resolver);
	let response = 200;
	resolver.resolve.mockImplementation(async value => {
		if (value === groupUri) return { type: 'Group', id: groupUri, _misskey_channel: true };
		expect(value).toBe(noteUri);
		if (response === 200) return { type: 'Note', id: noteUri, attributedTo: authorUri };
		throw new StatusError('Synthetic origin response', response);
	});

	const deleteNote = vi.fn(async () => { notes.findOneBy.mockResolvedValue(null); });
	const moduleRef = mockDeep<ModuleRef>();
	moduleRef.get.mockReturnValue({ delete: deleteNote });
	const redis = mockDeep<Redis.Redis>();
	redis.set.mockResolvedValue('OK');
	const service = new ChannelFederationService(mockDeep<Config>({ url: 'https://local.test' }), redis, channels, mockDeep<ChannelFollowingsRepository>(),
		users, notes, mockDeep<FollowingsRepository>(), mockDeep<IdService>(), mockDeep<GlobalEventService>(), mockDeep<QueueService>(), mockDeep<ApRendererService>(), resolverService, moduleRef);

	const deletion: IDelete = { type: 'Delete', actor: authorUri, audience: groupUri, object: noteUri };
	const announcement: IAnnounce = {
		type: 'Announce', id: `${groupUri}/activities/note123/delete`, actor: groupUri, audience: groupUri,
		to: [publicAudience], object: deletion,
	};
	const wrongAuthor: IDelete = { ...deletion, actor: `${origin}/users/other` };
	expect(await service.receiveAnnounce(group, { ...announcement, object: wrongAuthor })).toBe('skip: Group delete author mismatch');
	expect(resolver.resolve).not.toHaveBeenCalledWith(noteUri);

	await expect(service.receiveAnnounce(group, announcement)).rejects.toMatchObject({ message: 'Group deletion verification pending: author Note still resolves' });
	expect(deleteNote).not.toHaveBeenCalled();
	response = 403;
	await expect(service.receiveAnnounce(group, announcement)).rejects.toMatchObject({ statusCode: 403 });
	expect(deleteNote).not.toHaveBeenCalled();
	response = status;
	expect(await service.receiveAnnounce(group, announcement)).toBe('ok: Group note deleted');
	expect(deleteNote).toHaveBeenCalledWith(author, note);
	expect(await service.receiveAnnounce(group, announcement)).toBe('skip: unknown Group note');
	expect(deleteNote).toHaveBeenCalledOnce();
});
