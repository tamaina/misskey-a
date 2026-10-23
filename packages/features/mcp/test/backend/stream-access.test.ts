/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import { MainChannel } from '@features/api/backend/transport/stream/channels/main.js';
import { AdminChannel } from '@features/operations/backend/stream/admin.js';
import { HomeTimelineChannel } from '@features/timelines/backend/stream/home-timeline.js';
import { ChatRoomChannel } from '@features/chat/backend/stream/chat-room.js';
import { UserListChannel } from '@features/timelines/backend/stream/user-list.js';
import { McpEventsService } from '../../backend/McpEventsService.js';
import { McpStreamAccessService } from '../../backend/McpStreamAccessService.js';
import { reduceOccurrence } from '../../backend/stream-catalog.js';
import { canonicalStream, streamSubscription } from '../../backend/stream-parameters.js';
import type { ModuleRef } from '@nestjs/core';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import type { StreamOccurrence } from '../../backend/stream-types.js';
import type { CacheService } from '@features/users/backend/services/CacheService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { MiWebhook, NotesRepository, WebhooksRepository, AccessTokensRepository, AppsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

function fixture() {
	const actor = { id: 'owner', host: null, isSuspended: false } as MiLocalUser;
	const token = { id: 'grant', userId: actor.id, permission: ['access:mcp', 'read:account', 'read:chat', 'read:notifications'] } as MiAccessToken;
	const tokens = mockDeep<AccessTokensRepository>(); tokens.findOneBy.mockResolvedValue(token);
	const users = mockDeep<UsersRepository>(); users.findOneBy.mockResolvedValue(actor);
	const apps = mockDeep<AppsRepository>(); const rows = mockDeep<WebhooksRepository>(); const notesRepo = mockDeep<NotesRepository>();
	const noteEntity = mockDeep<NoteEntityService>(); noteEntity.isVisibleForMe.mockResolvedValue(true);
	const note = { id: 'note', userId: 'author', user: { id: 'author', host: null }, visibility: 'public', text: 'SYNTHETIC_CURRENT', fileIds: [], reactions: {} } as unknown as Packed<'Note'>;
	notesRepo.findOneBy.mockResolvedValue({ id: 'note' } as never); noteEntity.pack.mockResolvedValue(note);
	const cache = mockDeep<CacheService>(); cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: [] } as never);
	cache.userFollowingsCache.fetch.mockResolvedValue({ author: { withReplies: false } }); cache.userMutingsCache.fetch.mockResolvedValue(new Set()); cache.userBlockedCache.fetch.mockResolvedValue(new Set()); cache.renoteMutingsCache.fetch.mockResolvedValue(new Set());
	const rooms = mockDeep<import('@features/persistence/backend/repositories/models.js').ChatRoomsRepository>(); rooms.findOneBy.mockResolvedValue({ id: 'room' } as never);
	const messages = mockDeep<import('@features/persistence/backend/repositories/models.js').ChatMessagesRepository>(); messages.findOneBy.mockResolvedValue({ id: 'message', fromUserId: 'author', toUserId: null, toRoomId: 'room' } as never);
	const chat = mockDeep<import('@features/chat/backend/services/ChatService.js').ChatService>(); chat.hasPermissionToViewRoomTimeline.mockResolvedValue(true);
	const roles = mockDeep<import('@features/roles/backend/services/RoleService.js').RoleService>(); roles.isModerator.mockResolvedValue(true);
	const lists = mockDeep<import('@features/persistence/backend/repositories/models.js').UserListsRepository>(); lists.exists.mockResolvedValue(true);
	const members = mockDeep<import('@features/persistence/backend/repositories/models.js').UserListMembershipsRepository>(); members.find.mockResolvedValue([{ userId: 'author' }] as never);
	const hiding = mockDeep<import('@features/api/backend/transport/stream/NoteStreamingHidingService.js').NoteStreamingHidingService>(); hiding.filter.mockImplementation(async value => value);
	const moduleRef = mockDeep<ModuleRef>(); const requests = new Map<object, unknown>(); const connections: Connection[] = [];
	moduleRef.registerRequestByContextId.mockImplementation((request, context) => { requests.set(context, request); });
	moduleRef.create.mockImplementation(async (target, context) => {
		const request = requests.get(context!) as ChannelRequest;
		if (target === Connection) {
			const connection = new Connection(moduleRef, mockDeep(), cache,
				{ userFollowingChannelsCache: { fetch: async () => new Set() } } as never,
				{ mutingChannelsCache: { fetch: async () => new Set() } } as never, mockDeep(), request as unknown as ConnectionRequest);
			connections.push(connection); return connection as never;
		}
		if (target === MainChannel) return new MainChannel(request, noteEntity) as never;
		if (target === AdminChannel) return new AdminChannel(request) as never;
		if (target === HomeTimelineChannel) return new HomeTimelineChannel(request, noteEntity, hiding) as never;
		if (target === ChatRoomChannel) return new ChatRoomChannel(request, rooms, chat) as never;
		if (target === UserListChannel) return new UserListChannel(lists, members, request, noteEntity, hiding) as never;
		throw new Error('Unexpected test channel');
	});
	const events = new McpEventsService(rows, tokens, apps, users, notesRepo, mockDeep(), roles, noteEntity, mockDeep(), mockDeep(), moduleRef);
	const access = new McpStreamAccessService(moduleRef, events, rows, notesRepo, { enableServerMachineStats: true } as never, noteEntity, roles, messages, rooms, chat);
	moduleRef.get.mockReturnValue(access as never);
	const row = { id: 'subscription', userId: actor.id, mode: 'mcp', active: true, mcpTokenId: token.id, mcpGeneration: 'generation', mcpExpiresAt: new Date(Date.now() + 3600000), mcpStreamSince: new Date(Date.now() - 1000), mcpStream: { channel: 'main', params: {} } } as MiWebhook;
	rows.createQueryBuilder.mockReturnValue({ addSelect: () => ({ where: () => ({ getOne: async () => row }) }) } as never);
	const source = (channel: string, type: string, body: unknown): StreamOccurrence => reduceOccurrence({ id: 'occurrence', createdAt: Date.now(), channel, message: { type, body } as never })!;
	const authorize = (value: StreamOccurrence) => access.authorize(row.id, actor.id, row.mcpGeneration!, value);
	return { actor, token, tokens, users, rows, notesRepo, noteEntity, note, cache, rooms, messages, chat, roles, lists, members, access, row, source, authorize, connections };
}

it('uses real native main filtering and current DB grant/suspension/generation checks', async () => {
	const f = fixture(); const source = f.source('mainStream:owner', 'mention', { id: 'note', text: 'SYNTHETIC_OLD' });
	expect((await f.authorize(source))?.frames[0].body.body).toEqual({ noteId: 'note' });
	f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author'])); expect(await f.authorize(source)).toBeNull();
	f.cache.userMutingsCache.fetch.mockResolvedValue(new Set()); f.noteEntity.isVisibleForMe.mockResolvedValue(false); expect(await f.authorize(source)).toBeNull();
	f.noteEntity.isVisibleForMe.mockResolvedValue(true); f.tokens.findOneBy.mockResolvedValue(null); expect(await f.authorize(source)).toBeNull();
	f.tokens.findOneBy.mockResolvedValue(f.token); f.actor.isSuspended = true; expect(await f.authorize(source)).toBeNull();
	f.actor.isSuspended = false; expect(await f.access.authorize(f.row.id, f.actor.id, 'stale-generation', source)).toBeNull();
	expect(await f.authorize({ ...source, createdAt: f.row.mcpStreamSince!.getTime() - 1 })).toBeNull();
	expect(f.connections.every(connection => connection.subscriber.eventNames().length === 0)).toBe(true);
});

it('rechecks main room-message access and feature grants instead of trusting main scope', async () => {
	const f = fixture(); const source = f.source('mainStream:owner', 'newChatMessage', { id: 'message', toRoomId: 'room', text: 'PRIVATE_SYNTHETIC' });
	expect((await f.authorize(source))?.frames[0].body.body).toEqual({ messageId: 'message', userId: 'author', toRoomId: 'room' });
	f.chat.hasPermissionToViewRoomTimeline.mockResolvedValue(false); expect(await f.authorize(source)).toBeNull();
	f.chat.hasPermissionToViewRoomTimeline.mockResolvedValue(true); f.token.permission = ['access:mcp', 'read:account']; expect(await f.authorize(source)).toBeNull();
	f.token.permission.push('read:chat'); f.messages.findOneBy.mockResolvedValue(null); expect(await f.authorize(source)).toBeNull();
});

it('requests fresh native moderator authorization before replaying admin references', async () => {
	const f = fixture(); f.token.permission.push('read:admin:stream'); f.row.mcpStream = { channel: 'admin', params: {} };
	const source = f.source('adminStream:owner', 'newAbuseUserReport', { id: 'report', targetUserId: 'target', reporterId: 'reporter', comment: 'PRIVATE_SYNTHETIC' });
	expect((await f.authorize(source))?.frames[0].body.body).toEqual({ reportId: 'report' });
	expect(f.roles.isModerator).toHaveBeenCalledWith(f.actor, true);
	f.roles.isModerator.mockResolvedValue(false); expect(await f.authorize(source)).toBeNull();
});

it('recreates native chat-room permission and suppresses another room source', async () => {
	const f = fixture(); f.row.mcpStream = { channel: 'chatRoom', params: { roomId: 'room' } };
	const source = f.source('chatRoomStream:room', 'message', { id: 'message', text: 'PRIVATE_SYNTHETIC' });
	expect((await f.authorize(source))?.frames).toHaveLength(1);
	f.chat.hasPermissionToViewRoomTimeline.mockResolvedValue(false); expect(await f.authorize(source)).toBeNull();
	f.chat.hasPermissionToViewRoomTimeline.mockResolvedValue(true); expect(await f.authorize({ ...source, channel: 'chatRoomStream:other' })).toBeNull();
	expect(f.chat.readRoomChatMessage).not.toHaveBeenCalled();
});

it('replays fresh timeline notes and awaits native list membership before a single event', async () => {
	vi.useFakeTimers(); const f = fixture();
	try {
		f.row.mcpStream = { channel: 'homeTimeline', params: {} };
		const source = { id: 'occurrence', createdAt: Date.now(), channel: 'notesStream', message: { id: 'note' } };
		expect((await f.authorize(source))?.frames[0].body.body).toEqual({ noteId: 'note' });
		f.row.mcpStream = { channel: 'userList', params: { listId: 'list' } };
		expect((await f.authorize(source))?.frames).toHaveLength(1); expect(f.members.find).toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
		f.members.find.mockResolvedValue([]); expect(await f.authorize(source)).toBeNull();
		f.row.mcpStream = { channel: 'homeTimeline', params: { withFiles: true } }; expect(await f.authorize(source)).toBeNull();
	} finally { vi.useRealTimers(); }
});

it('uses current note-update visibility and native deleted-note follower checks', async () => {
	const f = fixture(); f.row.mcpStream = { channel: 'note', params: { noteId: 'note' } };
	const source = f.source('noteStream:note', 'reacted', { id: 'note', userId: 'author', visibility: 'public', visibleUserIds: [], body: { userId: 'reactor', reaction: 'PRIVATE_EMOJI' } });
	expect((await f.authorize(source))?.frames[0].type).toBe('noteUpdated');
	f.noteEntity.isVisibleForMe.mockResolvedValue(false); f.notesRepo.existsBy.mockResolvedValue(true); expect(await f.authorize(source)).toBeNull();
	f.notesRepo.findOneBy.mockResolvedValue(null); f.notesRepo.existsBy.mockResolvedValue(false);
	const deleted = f.source('noteStream:note', 'deleted', { id: 'note', userId: 'author', visibility: 'followers', visibleUserIds: [], body: { deletedAt: new Date().toISOString() } });
	expect((await f.authorize(deleted))?.frames).toHaveLength(1);
	f.cache.userFollowingsCache.fetch.mockResolvedValue({}); expect(await f.authorize(deleted)).toBeNull();
});

it('validates native parameter shapes and canonical option identities', () => {
	const implicit = canonicalStream(streamSubscription('stream.channel', { channel: 'homeTimeline' })!);
	const explicit = canonicalStream(streamSubscription('stream.channel', { channel: 'homeTimeline', params: { withRenotes: true, withFiles: false } })!);
	expect(implicit).toEqual(explicit);
	for (const args of [{ channel: 'invalid' }, { channel: 'antenna' }, { channel: 'main', params: { i: 'CREDENTIAL' } }, { channel: 'hashtag', params: { q: [] } }]) expect(() => streamSubscription('stream.channel', args)).toThrow();
});
