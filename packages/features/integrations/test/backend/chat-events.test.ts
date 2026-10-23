/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import type { ChatApprovalsRepository } from '@features/persistence/backend/repositories/models.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function fixture() {
	const pipeline = { set: vi.fn(), sadd: vi.fn(), exec: vi.fn() };
	const packed = { id: 'message', fromUserId: 'sender' };
	const approvals = mockDeep<ChatApprovalsRepository>();
	const query = mockDeep<ReturnType<ChatApprovalsRepository['createQueryBuilder']>>();
	query.where.mockReturnValue(query); query.orWhere.mockReturnValue(query); query.take.mockReturnValue(query);
	query.getMany.mockResolvedValue([{ userId: 'recipient' }, { userId: 'sender' }] as never);
	approvals.createQueryBuilder.mockReturnValue(query);
	const deps = {
		chatApprovalsRepository: approvals,
		chatMessagesRepository: { insertOne: vi.fn(async (message: unknown) => message), findOneBy: vi.fn() },
		chatRoomMembershipsRepository: { findBy: vi.fn(), findOneBy: vi.fn() },
		chatRoomsRepository: { findOneBy: vi.fn() },
		userBlockingService: { checkBlocked: vi.fn(async () => false) },
		idService: { gen: () => 'message' },
		chatEntityService: { packMessageLiteFor1on1: vi.fn(async () => packed), packMessageLiteForRoom: vi.fn(async () => packed) },
		userEntityService: { isLocalUser: (user: { host: string | null }) => user.host === null },
		globalEventService: { publishChatUserStream: vi.fn(), publishChatRoomStream: vi.fn(), publishMainStream: vi.fn() },
		webhookService: { enqueueUserWebhook: vi.fn() },
		redisClient: { pipeline: () => pipeline },
		roleService: { getUserPolicies: vi.fn(async () => ({ chatAvailability: 'available' })) },
	};
	const service = Object.assign(Object.create(ChatService.prototype), deps) as ChatService;
	return { service, ...deps, packed };
}

it('emits a received 1:1 message immediately, excluding the sender', async () => {
	const f = fixture();
	await f.service.createMessageToUser({ id: 'sender', host: null }, { id: 'recipient', host: null } as never, { text: 'hello' });
	expect(f.webhookService.enqueueUserWebhook.mock.calls).toEqual([['recipient', 'chatMessage', { message: f.packed }]]);
	expect(f.globalEventService.publishChatUserStream).toHaveBeenCalledWith('recipient', 'sender', 'message', f.packed);
	expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled();
	expect(vi.getTimerCount()).toBe(1);
});

it('keeps blocked and self messages out of storage and events', async () => {
	const f = fixture(); f.userBlockingService.checkBlocked.mockResolvedValue(true);
	await expect(f.service.createMessageToUser({ id: 'sender', host: null }, { id: 'recipient', host: null } as never, {})).rejects.toThrow('blocked');
	await expect(f.service.createMessageToUser({ id: 'sender', host: null }, { id: 'sender', host: null } as never, {})).rejects.toThrow('yourself');
	expect(f.chatMessagesRepository.insertOne).not.toHaveBeenCalled(); expect(f.webhookService.enqueueUserWebhook).not.toHaveBeenCalled();
});

it.each(['sender', 'owner'])('emits a room message per unmuted recipient with %s sending', async senderId => {
	const f = fixture();
	f.chatRoomMembershipsRepository.findBy.mockResolvedValue([{ userId: 'sender', isMuted: false }, { userId: 'recipient', isMuted: false }, { userId: 'muted', isMuted: true }]);
	await f.service.createMessageToRoom({ id: senderId, host: null }, { id: 'room', ownerId: 'owner' } as never, { text: 'hello' });
	const expected = senderId === 'sender' ? ['recipient', 'owner'] : ['sender', 'recipient'];
	expect(f.webhookService.enqueueUserWebhook.mock.calls).toEqual(expected.map(id => [id, 'chatMessage', { message: f.packed }]));
	expect(f.globalEventService.publishChatRoomStream).toHaveBeenCalledWith('room', 'message', f.packed);
	expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(1);
});

it('rejects room senders outside membership before events', async () => {
	const f = fixture(); f.chatRoomMembershipsRepository.findBy.mockResolvedValue([]);
	await expect(f.service.createMessageToRoom({ id: 'sender', host: null }, { id: 'room', ownerId: 'owner' } as never, {})).rejects.toThrow('you are not a member');
	expect(f.webhookService.enqueueUserWebhook).not.toHaveBeenCalled();
});

it('rechecks deletion, sender exclusion, blocking, room membership and room mutes for MCP delivery', async () => {
	const f = fixture();
	f.chatMessagesRepository.findOneBy.mockResolvedValue(null);
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(false);
	f.chatMessagesRepository.findOneBy.mockResolvedValue({ fromUserId: 'sender', toUserId: 'recipient' });
	expect(await f.service.canReceiveMessageEvent('sender', 'message')).toBe(false);
	expect(await f.service.canReceiveMessageEvent('stranger', 'message')).toBe(false);
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(true);
	f.userBlockingService.checkBlocked.mockResolvedValue(true);
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(false);
	f.chatMessagesRepository.findOneBy.mockResolvedValue({ fromUserId: 'sender', toRoomId: 'room' });
	f.chatRoomsRepository.findOneBy.mockResolvedValue({ id: 'room', ownerId: 'owner' });
	f.chatRoomMembershipsRepository.findOneBy.mockResolvedValue(null);
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(false);
	f.chatRoomMembershipsRepository.findOneBy.mockResolvedValue({ isMuted: true });
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(false);
	expect(await f.service.canReceiveMessageEvent('owner', 'message')).toBe(false);
	f.chatRoomMembershipsRepository.findOneBy.mockResolvedValue({ isMuted: false });
	expect(await f.service.canReceiveMessageEvent('recipient', 'message')).toBe(true);
	expect(await f.service.canReceiveMessageEvent('owner', 'message')).toBe(true);
	f.chatRoomMembershipsRepository.findOneBy.mockResolvedValue(null);
	expect(await f.service.canReceiveMessageEvent('owner', 'message')).toBe(true);
	f.roleService.getUserPolicies.mockResolvedValue({ chatAvailability: 'unavailable' });
	expect(await f.service.canReceiveMessageEvent('owner', 'message')).toBe(false);
});
