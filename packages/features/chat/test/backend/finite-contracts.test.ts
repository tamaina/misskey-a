/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { createProcedureClient } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedChatMessageSchema, packedChatMessageLiteSchema, packedChatMessageLiteFor1on1Schema, packedChatMessageLiteForRoomSchema, packedChatRoomSchema, packedChatRoomInvitationSchema, packedChatRoomMembershipSchema } from '../../backend/chat.schema.js';
import { chatHistoryContract } from '../../backend/endpoints/chat/history.contract.js';
import { chatMessagesCreateToUserContract } from '../../backend/endpoints/chat/messages/create-to-user.contract.js';
import { chatReadAllContract } from '../../backend/endpoints/chat/read-all.contract.js';
import { chatRoomsMuteContract } from '../../backend/endpoints/chat/rooms/mute.contract.js';
import { chatRoomsJoinErrors } from '../../backend/endpoints/chat/rooms/join.contract.js';
import { ChatEntityService } from '../../backend/serializers/ChatEntityService.js';
import { createChatHistoryProcedure } from '../../backend/endpoints/chat/history.js';
import type { MiChatMessage } from '../../backend/models/ChatMessage.js';
import type { MiChatRoom } from '../../backend/models/ChatRoom.js';
import type { MiChatRoomInvitation } from '../../backend/models/ChatRoomInvitation.js';
import type { MiChatRoomMembership } from '../../backend/models/ChatRoomMembership.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const date = new Date('2026-01-01T00:00:00Z');
const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

function fixture() {
	const users = mockDeep<ConstructorParameters<typeof ChatEntityService>[4]>();
	users.pack.mockImplementation(async src => {
		if (src === 'deleted123') throw new Error('deleted user');
		return user;
	});
	users.packMany.mockResolvedValue([user]);
	const ids = mockDeep<ConstructorParameters<typeof ChatEntityService>[6]>();
	ids.parse.mockReturnValue({ date });
	const invitations = mockDeep<ConstructorParameters<typeof ChatEntityService>[2]>();
	const memberships = mockDeep<ConstructorParameters<typeof ChatEntityService>[3]>();
	invitations.findOneBy.mockResolvedValue(null);
	memberships.findOneBy.mockResolvedValue(null);
	const service = new ChatEntityService(mockDeep(), mockDeep(), invitations, memberships, users, mockDeep(), ids);
	const room = mockDeep<MiChatRoom>({ id: 'room123', ownerId: user.id, owner: null, name: 'room', description: '' });
	const message = mockDeep<MiChatMessage>({ id: 'message123', fromUserId: user.id, fromUser: null, toUserId: 'other123', toUser: null, toRoomId: null, toRoom: null, text: null, fileId: null, file: null, reactions: ['user123/like', 'deleted123/like'] });
	return { service, message, room, memberships, invitations };
}

test('actual chat serializers retain direct/room nullable fields and deleted reaction filtering', async () => {
	const { service, message, room } = fixture();
	const direct = await service.packMessageDetailed(message);
	checkClosed(packedChatMessageSchema, direct, 'fromUser', { text: 7 });
	expect(direct.toRoom).toBeUndefined();
	expect(Object.hasOwn(direct, 'toRoom')).toBe(true);
	expect(direct.file).toBeNull();
	expect(direct.reactions).toHaveLength(1);
	const lite = await service.packMessageLiteFor1on1(message);
	checkClosed(packedChatMessageLiteFor1on1Schema, lite, 'toUserId', { reactions: [{ reaction: 7 }] });
	expect(v.safeParse(packedChatMessageLiteSchema, lite).success).toBe(true);
	expect(lite.reactions).toHaveLength(2);
	message.toUserId = null;
	message.toRoomId = room.id;
	message.toRoom = room;
	const detailedRoom = await service.packMessageDetailed(message);
	checkClosed(packedChatMessageSchema, detailedRoom, 'id', { toRoomId: 7 });
	expect(detailedRoom.toUser).toBeUndefined();
	const roomLite = await service.packMessageLiteForRoom(message);
	checkClosed(packedChatMessageLiteForRoomSchema, roomLite, 'toRoomId', { reactions: [{ reaction: 'like', user: 7 }] });
	for (const schema of [packedChatMessageSchema, packedChatMessageLiteForRoomSchema]) {
		const value = schema === packedChatMessageSchema ? detailedRoom : roomLite;
		expect(v.safeParse(schema, { ...value, reactions: [{ reaction: 'like', user, future: true }] }).success).toBe(false);
	}
	expect(v.safeParse(packedChatMessageLiteFor1on1Schema, { ...lite, reactions: [{ reaction: 'like', future: true }] }).success).toBe(false);
});

test('actual room, invitation and all membership population variants satisfy strict envelopes', async () => {
	const { service, room, memberships, invitations } = fixture();
	const output = await service.packRoom(room);
	checkClosed(packedChatRoomSchema, output, 'description', { isMuted: 7 });
	expect(output.isMuted).toBe(false);
	expect(output.invitationExists).toBe(false);
	memberships.findOneBy.mockResolvedValue(mockDeep<MiChatRoomMembership>({ isMuted: true }));
	invitations.findOneBy.mockResolvedValue(mockDeep<MiChatRoomInvitation>());
	const viewed = await service.packRoom(room, { id: 'other123' });
	expect(v.parse(packedChatRoomSchema, viewed).isMuted).toBe(true);
	expect(viewed.invitationExists).toBe(true);
	const invitation = await service.packRoomInvitation(mockDeep<MiChatRoomInvitation>({ id: 'invite123', roomId: room.id, room, userId: user.id, user: null }), user);
	checkClosed(packedChatRoomInvitationSchema, invitation, 'room', { userId: 7 });
	for (const populateUser of [false, true]) for (const populateRoom of [false, true]) {
		const membership = await service.packRoomMembership(mockDeep<MiChatRoomMembership>({ id: 'member123', userId: user.id, user: null, roomId: room.id, room }), user, { populateUser, populateRoom });
		checkClosed(packedChatRoomMembershipSchema, membership, 'roomId', { userId: 7 });
		expect(membership.user !== undefined).toBe(populateUser);
		expect(membership.room !== undefined).toBe(populateRoom);
	}
});

test.each([false, true])('actual history handler adds its read state for room=%s', async roomHistory => {
	const { service, message, room } = fixture();
	if (roomHistory) { message.toUserId = null; message.toRoomId = room.id; message.toRoom = room; }
	const packed = await service.packMessageDetailed(message);
	const entities = mockDeep<Parameters<typeof createChatHistoryProcedure>[0]['chatEntityService']>();
	entities.packMessagesDetailed.mockResolvedValue([packed]);
	const chats = mockDeep<Parameters<typeof createChatHistoryProcedure>[0]['chatService']>();
	chats.userHistory.mockResolvedValue([message]);
	chats.roomHistory.mockResolvedValue([message]);
	chats.getRoomReadStateMap.mockResolvedValue({ [room.id]: true });
	chats.getUserReadStateMap.mockResolvedValue({ other123: true });
	const context = mockDeep<ApiContext<MiLocalUser>>({ credential: 'fixture', ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([mockDeep<MiLocalUser>({ id: user.id, isSuspended: false, movedToUri: null }), null]);
	const endpoint = createProcedureClient(createChatHistoryProcedure({ chatEntityService: entities, chatService: chats }), { context });
	const result = await endpoint({ room: roomHistory });
	expect(v.parse(requiredSchema(chatHistoryContract['~orpc'].outputSchema), result)[0].isRead).toBe(true);
});

test('native chat inputs strip transport fields, keep defaults and validate closed producer responses', async () => {
	expect(v.parse(requiredSchema(chatHistoryContract['~orpc'].inputSchema), { future: true })).toEqual({ limit: 10, room: false });
	expect(v.parse(requiredSchema(chatMessagesCreateToUserContract['~orpc'].inputSchema), { toUserId: 'user123', text: null, future: true })).toEqual({ toUserId: 'user123', text: null });
	for (const input of [{}, { toUserId: 7 }, { toUserId: 'user123', text: 7 }]) expect(v.safeParse(requiredSchema(chatMessagesCreateToUserContract['~orpc'].inputSchema), input).success).toBe(false);
	for (const input of [[], null, 7]) expect(v.safeParse(requiredSchema(chatReadAllContract['~orpc'].inputSchema), input).success).toBe(false);
	expect(v.parse(requiredSchema(chatRoomsMuteContract['~orpc'].inputSchema), { roomId: 'room123', mute: true, future: true })).toEqual({ roomId: 'room123', mute: true });
	expect(chatRoomsJoinErrors.noSuchRoom.id).toBe('84416476-5ce8-4a2c-b568-9569f1b10733');
	const { service, message } = fixture();
	const response = [{ ...await service.packMessageDetailed(message), future: true }];
	expect(v.safeParse(requiredSchema(chatHistoryContract['~orpc'].outputSchema), response).success).toBe(false);
	expect(v.safeParse(requiredSchema(chatHistoryContract['~orpc'].inputSchema), { limit: 0 }).success).toBe(false);
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
