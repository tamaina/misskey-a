/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { assertFederatedChannelNote } from '../../backend/utility/federation-policy.js';
import { ChannelFederationService } from '../../backend/services/ChannelFederationService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import { NoteCreateService } from '@features/notes/backend/services/NoteCreateService.js';
import Connection from '@features/api/backend/transport/stream/Connection.js';
import type { MiChannel } from '../../backend/models/Channel.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiLocalUser, MiRemoteUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository, ChannelFollowingsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { IAnnounce, ICreate, IObject } from '@features/federation/backend/protocol/type.js';
import type { ApResolverService, Resolver } from '@features/federation/backend/services/ApResolverService.js';
import type { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { ModuleRef } from '@nestjs/core';
import type * as Redis from 'ioredis';

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
const groupUri = 'https://remote.test/channels/group123';
const authorUri = 'https://remote.test/users/author123';
const noteUri = 'https://remote.test/notes/note123';
const remote = mockDeep<MiRemoteUser>({ id: 'remote123', uri: groupUri, host: 'remote.test', isSuspended: false, isRemoteSuspended: false });

function fixture() {
	const channels = mockDeep<ChannelsRepository>();
	const channelFollowings = mockDeep<ChannelFollowingsRepository>();
	const users = mockDeep<UsersRepository>();
	const notes = mockDeep<NotesRepository>();
	const followings = mockDeep<FollowingsRepository>();
	const redis = mockDeep<Redis.Redis>();
	redis.set.mockResolvedValue('OK');
	const resolver = mockDeep<Resolver>();
	const resolverService = mockDeep<ApResolverService>();
	resolverService.createResolver.mockResolvedValue(resolver);
	const moduleRef = mockDeep<ModuleRef>();
	const renderer = mockDeep<ApRendererService>();
	renderer.addContext.mockImplementation(<T extends IObject>(object: T) => ({ ...object, id: object.id ?? 'fixture-activity', '@context': 'https://www.w3.org/ns/activitystreams' }));
	const queue = mockDeep<QueueService>();
	const ids = mockDeep<IdService>();
	ids.gen.mockReturnValue('created123');
	const events = mockDeep<GlobalEventService>();
	const service = new ChannelFederationService({ url: 'https://local.test' } as never, redis, channels, channelFollowings, users, notes, followings, ids, events, queue, renderer, resolverService, moduleRef);
	return { service, channels, channelFollowings, users, notes, followings, redis, resolver, moduleRef, queue, events };
}

function announcement(): IAnnounce {
	return {
		type: 'Announce', id: `${groupUri}/activities/note123`, actor: groupUri,
		audience: groupUri, to: [PUBLIC], object: {
			type: 'Create', id: `${noteUri}/activity`, actor: authorUri, audience: groupUri, to: [PUBLIC],
			object: { type: 'Note', id: noteUri, attributedTo: authorUri, audience: groupUri, to: [PUBLIC], content: 'approved' },
		} as ICreate,
	};
}

describe('federated channel restrictions', () => {
	test.each([
		{ localOnly: true },
		{ visibility: 'home' },
		{ reply: { localOnly: true, visibility: 'public' } },
		{ renote: { localOnly: true, visibility: 'public' } },
		{ reply: { localOnly: false, visibility: 'followers' } },
		{ renote: { localOnly: false, visibility: 'home' } },
	])('rejects without widening the original restriction: %j', data => {
		const before = structuredClone(data);
		expect(() => assertFederatedChannelNote(data, true)).toThrow(/require public federation/);
		expect(data).toEqual(before);
	});
	test('rejects public-policy/sensitive-word restriction', () => {
		expect(() => assertFederatedChannelNote({ visibility: 'public' }, false)).toThrow();
		expect(() => assertFederatedChannelNote({ visibility: 'public', localOnly: false }, true)).not.toThrow();
	});
	test('real create refuses a remote channel inferred from replyId without explicit channel', async () => {
		const channel = mockDeep<MiChannel>({ id: 'channel123', isFederated: true, host: 'remote.test' });
		const channels = mockDeep<ChannelsRepository>();
		channels.findOneBy.mockResolvedValue(channel);
		const service = Object.assign(Object.create(NoteCreateService.prototype), { channelsRepository: channels }) as NoteCreateService;
		const reply = mockDeep<MiNote>({ channelId: channel.id, visibility: 'public', localOnly: false });
		await expect(service.create({ id: 'local123', username: 'local', host: null, isBot: false, isCat: false }, { reply, text: 'new', visibility: 'public', localOnly: false })).rejects.toThrow(/Remote channel posting/);
	});
});

test('disabled Group refuses Follow; enabled Follow and Undo use channel relationships and no user key', async () => {
	const f = fixture();
	const channel = mockDeep<MiChannel>({ id: 'channel123', isFederated: false, isArchived: false, host: null, uri: null, federationPublicKey: 'public-key' });
	f.channels.findOneBy.mockResolvedValue(channel);
	f.channels.findOneByOrFail.mockResolvedValue(channel);
	const follow = { type: 'Follow' as const, actor: remote.uri, object: 'https://local.test/channels/channel123', id: 'https://remote.test/follow123' };
	expect(await f.service.follow(remote, follow)).toBe('skip: Group disabled');
	expect(f.channelFollowings.upsert).not.toHaveBeenCalled();
	channel.isFederated = true;
	expect(await f.service.follow(remote, follow)).toBe('ok: Group followed');
	expect(f.queue.deliver.mock.calls[0][0]).toEqual({ id: channel.id, channelId: channel.id });
	expect(f.queue.deliver.mock.calls[0][1]).toMatchObject({ type: 'Accept', actor: follow.object, object: follow });
	expect(await f.service.follow(remote, follow, true)).toBe('ok: Group unfollowed');
	expect(f.channelFollowings.delete).toHaveBeenCalledWith({ followeeId: channel.id, followerId: remote.id });
});

test.each(['audience', 'tampered-author-content', 'remote-submission', 'nonpublic'])('refuses unverified Group membership: %s', async reason => {
	const f = fixture();
	const activity = announcement();
	const canonical = structuredClone(activity.object);
	const channel = mockDeep<MiChannel>({ id: 'channel123', uri: groupUri, host: remote.host, isFederated: true });
	f.channels.findOneBy.mockResolvedValue(channel);
	f.followings.findBy.mockResolvedValue([]);
	f.resolver.resolve.mockImplementation(async value => value === groupUri ? { type: 'Group', id: groupUri, _misskey_channel: true } : canonical as IObject);
	if (reason === 'audience') activity.audience = 'https://remote.test/channels/other';
	if (reason === 'tampered-author-content') ((activity.object as IObject & { object: IObject }).object).content = 'forged';
	if (reason === 'remote-submission') (activity.object as IObject & { actor: string }).actor = 'https://other.test/users/author';
	if (reason === 'nonpublic') activity.to = [groupUri];
	expect(await f.service.receiveAnnounce(remote, activity)).toMatch(/^skip:/);
	expect(f.moduleRef.get).not.toHaveBeenCalled();
});

test('verified Create stores the channel through the author importer', async () => {
	const f = fixture();
	const activity = announcement();
	const channel = mockDeep<MiChannel>({ id: 'channel123', uri: groupUri, host: remote.host, isFederated: true });
	f.channels.findOneBy.mockResolvedValue(channel);
	f.followings.findBy.mockResolvedValue([]);
	f.resolver.resolve.mockImplementation(async value => value === groupUri ? { type: 'Group', id: groupUri, _misskey_channel: true } : activity.object as IObject);
	const author = mockDeep<MiRemoteUser>({ id: 'author123', host: remote.host, uri: authorUri });
	const resolvePerson = vi.fn().mockResolvedValue(author);
	const createNote = vi.fn().mockResolvedValue({ id: 'note123', channelId: channel.id });
	f.moduleRef.get.mockImplementation(token => (token === 'ApPersonService' ? { resolvePerson } : { createNote }) as never);
	expect(await f.service.receiveAnnounce(remote, activity)).toBe('ok: Group note created');
	expect(createNote).toHaveBeenCalledWith((activity.object as IObject & { object: IObject }).object, author, f.resolver, false, channel);
});

test('open streams update channel follow membership immediately and release internal listeners', () => {
	const connection = new Connection(mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), { user: { id: 'user123' } as never, token: null });
	const subscriber = new EventEmitter();
	connection.attachNativeOutput(subscriber as never, { isOpen: () => true, send: () => {}, failed: () => {} }, { channels: ['homeTimeline'] });
	subscriber.emit('internal', { type: 'followChannel', body: { userId: 'user123', channelId: 'channel123' } });
	expect(connection.followingChannels.has('channel123')).toBe(true);
	subscriber.emit('internal', { type: 'unfollowChannel', body: { userId: 'user123', channelId: 'channel123' } });
	expect(connection.followingChannels.has('channel123')).toBe(false);
	connection.dispose();
	expect(subscriber.listenerCount('internal')).toBe(0);
});

test('a standalone public quote resolves as an ordinary author Note, without a fictitious Group approval URL', async () => {
	const f = fixture();
	const activity = announcement();
	const parentUri = 'https://remote.test/notes/standalone123';
	const parent = { type: 'Note', id: parentUri, attributedTo: authorUri, to: [PUBLIC], content: 'standalone' };
	((activity.object as IObject & { object: IObject }).object as IObject & { _misskey_quote: string })._misskey_quote = parentUri;
	f.channels.findOneBy.mockResolvedValue(mockDeep<MiChannel>({ id: 'channel123', uri: groupUri, host: remote.host, isFederated: true }));
	f.resolver.resolve.mockImplementation(async value => value === groupUri ? { type: 'Group', id: groupUri, _misskey_channel: true } : value === parentUri ? parent : activity.object as IObject);
	const resolvePerson = vi.fn().mockResolvedValue(mockDeep<MiRemoteUser>({ host: remote.host, uri: authorUri }));
	const resolveNote = vi.fn(async (value: IObject, options: { resolver: Resolver; sentFrom: URL }) => {
		// Exercise the real resolver handoff: an already fetched URI must not be fetched again.
		const importer = Object.setPrototypeOf({
			utilityService: { isFederationAllowedUri: () => true, isUriLocal: () => false }, redisClient: f.redis,
			fetchNote: vi.fn().mockResolvedValue(null),
			createNote: vi.fn(async input => { expect(input).toBe(parent); return { id: 'parent123' }; }),
		}, ApNoteService.prototype) as ApNoteService;
		return await importer.resolveNote(value, options);
	});
	const createNote = vi.fn().mockResolvedValue({ id: 'note123' });
	f.moduleRef.get.mockImplementation(token => (token === 'ApPersonService' ? { resolvePerson } : { createNote, resolveNote }) as never);
	expect(await f.service.receiveAnnounce(remote, activity)).toBe('ok: Group note created');
	expect(resolveNote).toHaveBeenCalledWith(parent, { resolver: f.resolver, sentFrom: new URL(parentUri) });
	expect(f.resolver.resolve).not.toHaveBeenCalledWith(`${groupUri}/activities/standalone123`);
	expect(f.channelFollowings.upsert).not.toHaveBeenCalled();
});

test('a cancelled Follow cannot be recreated by late Accept bridge synchronization', async () => {
	const f = fixture();
	f.channels.findOneBy.mockResolvedValue(mockDeep<MiChannel>({ id: 'channel123', uri: groupUri }));
	f.resolver.resolve.mockResolvedValue({ type: 'Group', id: groupUri, _misskey_channel: true });
	f.followings.existsBy.mockResolvedValue(false);
	await f.service.acceptRemoteFollow(remote, 'follower123');
	expect(f.channelFollowings.upsert).not.toHaveBeenCalled();
});

test('an overlapping Undo waits for Accept bridge write, then removes the relationship', async () => {
	const f = fixture();
	const locks = new Map<string, string>();
	f.redis.set.mockImplementation(async (key, value) => {
		if (locks.has(String(key))) return null;
		locks.set(String(key), String(value));
		return 'OK';
	});
	f.redis.get.mockImplementation(async key => locks.get(String(key)) ?? null);
	f.redis.del.mockImplementation(async key => Number(locks.delete(String(key))));
	f.channels.findOneBy.mockResolvedValue(mockDeep<MiChannel>({ id: 'channel123', uri: groupUri }));
	f.resolver.resolve.mockResolvedValue({ type: 'Group', id: groupUri, _misskey_channel: true });
	let releaseRead!: (value: boolean) => void;
	f.followings.existsBy.mockImplementation(() => new Promise(resolve => { releaseRead = resolve; }));
	const accept = f.service.acceptRemoteFollow(remote, 'follower123');
	await vi.waitFor(() => expect(releaseRead).toBeTypeOf('function'));
	const undo = f.service.unfollowRemote('follower123', groupUri);
	releaseRead(true);
	await Promise.all([accept, undo]);
	expect(f.channelFollowings.upsert).toHaveBeenCalledOnce();
	expect(f.channelFollowings.delete).toHaveBeenCalledOnce();
	expect(f.channelFollowings.delete.mock.invocationCallOrder[0]).toBeGreaterThan(f.channelFollowings.upsert.mock.invocationCallOrder[0]);
	expect(locks.size).toBe(0);
});

test('native Accept consumption and channel cancellation are serialized before choosing pending or accepted state', async () => {
	const f = fixture();
	const locks = new Map<string, string>();
	f.redis.set.mockImplementation(async (key, value) => {
		if (locks.has(String(key))) return null;
		locks.set(String(key), String(value));
		return 'OK';
	});
	f.redis.get.mockImplementation(async key => locks.get(String(key)) ?? null);
	f.redis.del.mockImplementation(async key => Number(locks.delete(String(key))));
	let pending = true;
	let nativeFollowing = false;
	let releaseRead!: () => void;
	const requests = {
		findOneBy: vi.fn(async () => { await new Promise<void>(resolve => { releaseRead = resolve; }); return { withReplies: false }; }),
		existsBy: vi.fn(async () => pending),
	};
	const unfollow = vi.fn(async () => { nativeFollowing = false; });
	const userFollowing = Object.setPrototypeOf({
		moduleRef: { get: () => f.service },
		followRequestsRepository: requests,
		insertFollowingDoc: vi.fn(async () => { nativeFollowing = true; pending = false; }),
		userEntityService: { isRemoteUser: () => false, packSelf: async () => ({}) },
		globalEventService: { publishMainStream: vi.fn() }, unfollowUnlocked: unfollow,
	}, UserFollowingService.prototype) as UserFollowingService;
	const local = mockDeep<MiLocalUser>({ id: 'local123', host: null });
	const accept = userFollowing.acceptFollowRequest(remote, local);
	await vi.waitFor(() => expect(releaseRead).toBeTypeOf('function'));
	const cancel = userFollowing.cancelOrUnfollowChannel(local, remote);
	expect(requests.existsBy).not.toHaveBeenCalled();
	releaseRead();
	await Promise.all([accept, cancel]);
	expect(unfollow).toHaveBeenCalledOnce();
	expect(nativeFollowing).toBe(false);
	expect(locks.size).toBe(0);
});
