/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient, createRouterClient, getRouter, isProcedure } from '@orpc/server';
import * as v from 'valibot';
import { pilotContract } from '@features/index/backend/api.contract.js';
import { createApiTestRouter } from '@features/index/backend/api.test-fixture.js';
import { createChatRouter } from '@features/chat/backend/api.router.js';
import { createNotificationsRouter } from '@features/notifications/backend/router.js';
import type { MiChatRoom } from '@features/chat/backend/models/ChatRoom.js';
import type { MiChatMessage } from '@features/chat/backend/models/ChatMessage.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiExecutionContext } from '@features/index/backend/api.context.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import { requestRoutes } from '@features/api/shared/api-routing.js';
import { apiError, normalizeError } from '@features/api/backend/transport/orpc-error.js';
import { clipCommandErrors, clipFavoriteErrors } from '@features/collections/backend/api.errors.js';
import { relationshipsErrors } from '@features/relationships/backend/endpoints/relationships.errors.js';
import { createAnnouncementsRouter } from '@features/announcements/backend/api.router.js';
import type { AnnouncementsDependencies } from '@features/announcements/backend/api.dependencies.js';
import type { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';
import baseline from './command-metadata.fixture.json' with { type: 'json' };

const errorSchema = v.object({ message: v.string(), code: v.string(), id: v.string() });
const metadataSchema = v.object({
	// The legacy list favorite/unfavorite handlers omitted tags; native contracts use an empty list.
	tags: v.optional(v.array(v.string()), []), requireCredential: v.boolean(), kind: v.string(),
	errors: v.optional(v.record(v.string(), errorSchema), {}),
	limit: v.exactOptional(v.object({ duration: v.number(), max: v.number(), key: v.exactOptional(v.string()), minInterval: v.exactOptional(v.number()) })),
	prohibitMoved: v.optional(v.boolean(), false), requireModerator: v.optional(v.boolean(), false),
	requiredRolePolicy: v.exactOptional(v.string()), description: v.exactOptional(v.string()),
});
const snapshots = v.parse(v.record(v.string(), metadataSchema), baseline);
const announcementDependencies = mockDeep<AnnouncementsDependencies<MiLocalUser>>();
const chatDependencies = mockDeep<Parameters<typeof createChatRouter>[0]>();
const notificationDependencies = mockDeep<Parameters<typeof createNotificationsRouter>[0]>();
const router = createApiTestRouter({
	announcements: createAnnouncementsRouter(announcementDependencies),
	chat: createChatRouter(chatDependencies),
	notifications: createNotificationsRouter(notificationDependencies),
});
const routes = requestRoutes(pilotContract);
const actor = mockDeep<MiLocalUser>({ id: 'trustedUser', isSuspended: false, movedToUri: null });
const errorLoaders: Record<string, () => Promise<object>> = {
	'channels/follow': () => import('@features/channels/backend/endpoints/channels/follow.contract.js'),
	'channels/unfollow': () => import('@features/channels/backend/endpoints/channels/unfollow.contract.js'),
	'channels/favorite': () => import('@features/channels/backend/endpoints/channels/favorite.contract.js'),
	'channels/unfavorite': () => import('@features/channels/backend/endpoints/channels/unfavorite.contract.js'),
	'channels/mute/create': () => import('@features/channels/backend/endpoints/channels/mute/create.contract.js'),
	'channels/mute/delete': () => import('@features/channels/backend/endpoints/channels/mute/delete.contract.js'),
	'i/webhooks/update': () => import('@features/integrations/backend/endpoints/i/webhooks/update.contract.js'),
	'i/webhooks/delete': () => import('@features/integrations/backend/endpoints/i/webhooks/delete.contract.js'),
	'chat/read-all': () => import('@features/chat/backend/endpoints/chat/read-all.contract.js'),
	'chat/rooms/join': () => import('@features/chat/backend/endpoints/chat/rooms/join.contract.js'),
	'chat/rooms/leave': () => import('@features/chat/backend/endpoints/chat/rooms/leave.contract.js'),
	'chat/rooms/mute': () => import('@features/chat/backend/endpoints/chat/rooms/mute.contract.js'),
	'chat/rooms/delete': () => import('@features/chat/backend/endpoints/chat/rooms/delete.contract.js'),
	'chat/rooms/invitations/ignore': () => import('@features/chat/backend/endpoints/chat/rooms/invitations/ignore.contract.js'),
	'chat/messages/react': () => import('@features/chat/backend/endpoints/chat/messages/react.contract.js'),
	'chat/messages/unreact': () => import('@features/chat/backend/endpoints/chat/messages/unreact.contract.js'),
	'chat/messages/delete': () => import('@features/chat/backend/endpoints/chat/messages/delete.contract.js'),
};

for (const [name, snapshot] of Object.entries(snapshots)) {
	test(`${name} retains native metadata and authorization gates before malformed input`, async () => {
		const route = routes.find(route => route.name === name);
		if (!route) throw new Error(`Missing native route ${name}`);
		const procedure = getRouter(router, [...route.path]);
		if (!isProcedure(procedure)) throw new Error(`Missing native procedure ${name}`);
		expect(procedure['~orpc'].route.tags).toEqual(snapshot.tags);
		expect(procedure['~orpc'].route.description).toEqual(snapshot.description);
		expect(procedure['~orpc'].meta.requestName).toBe(name);
		const context = mockDeep<ApiExecutionContext<MiLocalUser>>();
		context.credential = 'trusted'; context.ip = '127.0.0.1'; context.headers = {};
		// A deep mock would invent a truthy error mapper that returns undefined.
		context.mapError = normalizeError;
		const token: ApiToken = { id: 'trustedToken', name: 'App', iconUrl: null, permission: [snapshot.kind] };
		context.services.authenticate.mockResolvedValue([actor, token]);
		context.services.limitActor.mockReturnValue(actor.id);
		context.services.rateLimitFactor.mockResolvedValue(1);
		context.services.limit.mockResolvedValue(null);
		context.authorization?.rootUserId.mockReturnValue(actor.id);
		const operation = vi.fn(async (..._args: unknown[]) => undefined);
		if (name === 'admin/announcements/delete' || name === 'admin/announcements/update') {
			announcementDependencies.announcementsRepository.findOneBy.mockResolvedValue(mockDeep<MiAnnouncement>({ id: 'id1' }));
			announcementDependencies.announcementService.delete.mockImplementation((row, principal) => operation({ id: row.id }, principal));
			announcementDependencies.announcementService.update.mockImplementation((_row, values, principal) => operation(values, principal));
		} else if (name === 'i/read-announcement') {
			announcementDependencies.announcementService.read.mockImplementation((principal, id) => operation({ announcementId: id }, principal));
		}
		const hasProbe = attachNativeProbe(name, operation);
		const probesBusiness = hasProbe || name === 'admin/announcements/delete' || name === 'admin/announcements/update' || name === 'i/read-announcement';
		const call = createProcedureClient(procedure, { context });
		const input = {
			id: 'id1', listId: 'list1', userId: 'user1', announcementId: 'announcement1', webhookId: 'webhook1',
			channelId: 'channel1', clipId: 'clip1', noteId: 'note1', roomId: 'room1', messageId: 'message1',
			mute: false, reaction: '👍', ids: ['emoji1'], aliases: ['alias'],
			category: null, license: null, body: 'hello', header: null,
			...(name.startsWith('admin/announcements/') ? {} : { icon: null }),
			actor: { id: 'forged' }, token: { id: 'forged' },
		};
		if (probesBusiness) {
			await call(input);
			expect(operation).toHaveBeenCalledTimes(1);
			const args = operation.mock.calls[0];
			expect(args[1]).toBe(name === 'chat/rooms/delete' || name.includes('announcements/') || name === 'i/read-announcement' ? actor : actor.id);
			expect(args[0]).not.toHaveProperty('actor');
			expect(args[0]).not.toHaveProperty('token');
			if (name === 'notifications/create') expect(args[0]).toMatchObject({ appAccessTokenId: token.id, customHeader: token.name, customIcon: token.iconUrl });
		}
		operation.mockClear();
		context.services.authenticate.mockResolvedValue([null, null]);
		await expect(call(null)).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', status: 401 });
		context.services.authenticate.mockResolvedValue([{ ...actor, isSuspended: true }, token]);
		await expect(call(null)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED', status: 403 });
		context.services.authenticate.mockResolvedValue([actor, { ...token, permission: [] }]);
		await expect(call(null)).rejects.toMatchObject({ code: 'PERMISSION_DENIED', status: 403 });
		context.services.authenticate.mockResolvedValue([actor, token]);
		if (snapshot.prohibitMoved) {
			context.services.authenticate.mockResolvedValue([{ ...actor, movedToUri: 'https://example.com/user' }, token]);
			await expect(call(null)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED', status: 403 });
			context.services.authenticate.mockResolvedValue([actor, token]);
		}
		if (snapshot.requireModerator || snapshot.requiredRolePolicy) {
			context.authorization?.rootUserId.mockReturnValue(null);
			context.authorization?.roles.mockResolvedValue([]);
			context.authorization?.policyAllowed.mockResolvedValue(false);
			await expect(call(null)).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED', status: 403 });
			if (snapshot.requiredRolePolicy) expect(context.authorization?.policyAllowed).toHaveBeenCalledWith(actor, snapshot.requiredRolePolicy);
			context.authorization?.rootUserId.mockReturnValue(actor.id);
		}
		if (snapshot.limit) {
			context.services.limit.mockResolvedValue({ info: {} });
			await expect(call(null)).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', status: 429 });
			context.services.limit.mockResolvedValue(null);
		}
		if (probesBusiness) expect(operation).not.toHaveBeenCalled();
		if (snapshot.limit) expect(context.services.limit).toHaveBeenCalledWith({ ...snapshot.limit, key: snapshot.limit.key ?? name }, actor.id, 1);
		else expect(context.services.limit).not.toHaveBeenCalled();
		let definitions: unknown = {};
		const load = errorLoaders[name];
		if (load) {
			const module = await load();
			const entry = Object.entries(module).find(([key]) => key.endsWith('Errors'));
			if (!entry) throw new Error(`Missing native error definitions ${name}`);
			definitions = entry[1];
		} else if (name.startsWith('clips/')) definitions = Reflect.get({ ...clipCommandErrors, ...clipFavoriteErrors }, name);
		else if (name.startsWith('users/lists/')) definitions = Reflect.get(relationshipsErrors, name);
		// Announcement IDs are asserted against real application behavior below.
		if (!name.includes('announcements/')) expect(v.parse(v.record(v.string(), errorSchema), definitions)).toEqual(snapshot.errors);
		for (const definition of Object.values(snapshot.errors)) {
			expect(procedure['~orpc'].errorMap).toHaveProperty(definition.code);
			if (name.startsWith('chat/')) {
				const gate = chatGate(name);
				gate.mockRejectedValueOnce(apiError(definition));
				await expect(call(input)).rejects.toMatchObject({ code: definition.code, message: definition.message, data: { id: definition.id } });
			} else if (name.includes('announcements/')) {
				operation.mockRejectedValueOnce(apiError(definition));
				await expect(call(input)).rejects.toMatchObject({ code: definition.code, message: definition.message, data: { id: definition.id } });
			}
		}
	});
}

for (const method of ['delete', 'update'] as const) {
	test(`announcement ${method} retains the application missing-row error UUID`, async () => {
		const dependencies = mockDeep<AnnouncementsDependencies<MiLocalUser>>();
		dependencies.announcementsRepository.findOneBy.mockResolvedValue(null);
		const context = mockDeep<ApiExecutionContext<MiLocalUser>>();
		context.services.authenticate.mockResolvedValue([actor, null]);
		context.authorization?.rootUserId.mockReturnValue(actor.id);
		const client = createRouterClient(createAnnouncementsRouter(dependencies), { context });
		const definition = snapshots[`admin/announcements/${method}`].errors.noSuchAnnouncement;
		await expect(client[method]({ id: 'missing' })).rejects.toMatchObject({ code: definition.code, message: definition.message, data: { id: definition.id } });
	});
}

/** Observe actual native domain ports; command success coverage for other features stays in their closest tests. */
function attachNativeProbe(name: string, operation: (...args: unknown[]) => Promise<void>): boolean {
	switch (name) {
		case 'chat/read-all': chatDependencies.chatReadAll.chatService.readAllChatMessages.mockImplementation(id => operation({}, id)); break;
		case 'chat/rooms/join': chatDependencies.chatRoomsJoin.chatService.joinToRoom.mockImplementation((id, roomId) => operation({ roomId }, id)); break;
		case 'chat/rooms/leave': chatDependencies.chatRoomsLeave.chatService.leaveRoom.mockImplementation((id, roomId) => operation({ roomId }, id)); break;
		case 'chat/rooms/mute': chatDependencies.chatRoomsMute.chatService.muteRoom.mockImplementation((id, roomId, mute) => operation({ roomId, mute }, id)); break;
		case 'chat/rooms/invitations/ignore': chatDependencies.chatRoomsInvitationsIgnore.chatService.ignoreRoomInvitation.mockImplementation((id, roomId) => operation({ roomId }, id)); break;
		case 'chat/messages/react': chatDependencies.chatMessagesReact.chatService.react.mockImplementation((messageId, id, reaction) => operation({ messageId, reaction }, id)); break;
		case 'chat/messages/unreact': chatDependencies.chatMessagesUnreact.chatService.unreact.mockImplementation((messageId, id, reaction) => operation({ messageId, reaction }, id)); break;
		case 'chat/messages/delete':
			chatDependencies.chatMessagesDelete.chatService.findMyMessageById.mockImplementation(async (id, messageId) => { await operation({ messageId }, id); return mockDeep<MiChatMessage>({ id: messageId }); }); break;
		case 'chat/rooms/delete':
			chatDependencies.chatRoomsDelete.chatService.findRoomById.mockResolvedValue(mockDeep<MiChatRoom>({ id: 'room1' }));
			chatDependencies.chatRoomsDelete.chatService.hasPermissionToDeleteRoom.mockResolvedValue(true);
			chatDependencies.chatRoomsDelete.chatService.deleteRoom.mockImplementation((room, principal) => operation({ roomId: room.id }, principal)); break;
		case 'notifications/create': notificationDependencies.createAppNotification.mockImplementation((id, data) => operation(data, id)); break;
		case 'notifications/flush': notificationDependencies.flushAllNotifications.mockImplementation(id => operation({}, id)); break;
		case 'notifications/mark-all-as-read': notificationDependencies.readAllNotification.mockImplementation(id => operation({}, id)); break;
		case 'notifications/test-notification': notificationDependencies.createTestNotification.mockImplementation(id => operation({}, id)); break;
		default: return false;
	}
	return true;
}

function chatGate(name: string) {
	switch (name) {
		case 'chat/read-all': return chatDependencies.chatReadAll.chatService.checkChatAvailability;
		case 'chat/rooms/join': return chatDependencies.chatRoomsJoin.chatService.checkChatAvailability;
		case 'chat/rooms/leave': return chatDependencies.chatRoomsLeave.chatService.checkChatAvailability;
		case 'chat/rooms/mute': return chatDependencies.chatRoomsMute.chatService.checkChatAvailability;
		case 'chat/rooms/delete': return chatDependencies.chatRoomsDelete.chatService.checkChatAvailability;
		case 'chat/rooms/invitations/ignore': return chatDependencies.chatRoomsInvitationsIgnore.chatService.checkChatAvailability;
		case 'chat/messages/react': return chatDependencies.chatMessagesReact.chatService.checkChatAvailability;
		case 'chat/messages/unreact': return chatDependencies.chatMessagesUnreact.chatService.checkChatAvailability;
		case 'chat/messages/delete': return chatDependencies.chatMessagesDelete.chatService.checkChatAvailability;
		default: throw new Error(`Missing chat gate ${name}`);
	}
}
