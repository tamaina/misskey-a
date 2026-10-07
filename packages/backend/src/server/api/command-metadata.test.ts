/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import baseline from './command-metadata.fixture.json' with { type: 'json' };

// Snapshotted from the original handlers before contract migration.
const loaders = {
	'channels/follow': () => import('@features/channels/backend/endpoints/channels/follow.js'),
	'channels/unfollow': () => import('@features/channels/backend/endpoints/channels/unfollow.js'),
	'channels/favorite': () => import('@features/channels/backend/endpoints/channels/favorite.js'),
	'channels/unfavorite': () => import('@features/channels/backend/endpoints/channels/unfavorite.js'),
	'channels/mute/create': () => import('@features/channels/backend/endpoints/channels/mute/create.js'),
	'channels/mute/delete': () => import('@features/channels/backend/endpoints/channels/mute/delete.js'),
	'clips/favorite': () => import('@features/collections/backend/endpoints/clips/favorite.js'),
	'clips/unfavorite': () => import('@features/collections/backend/endpoints/clips/unfavorite.js'),
	'admin/avatar-decorations/update': () => import('@features/avatar-decorations/backend/endpoints/admin/avatar-decorations/update.js'),
	'admin/avatar-decorations/delete': () => import('@features/avatar-decorations/backend/endpoints/admin/avatar-decorations/delete.js'),
	'admin/announcements/update': () => import('@features/announcements/backend/endpoints/admin/announcements/update.js'),
	'admin/announcements/delete': () => import('@features/announcements/backend/endpoints/admin/announcements/delete.js'),
	'i/read-announcement': () => import('@features/announcements/backend/endpoints/i/read-announcement.js'),
	'i/webhooks/update': () => import('@features/integrations/backend/endpoints/i/webhooks/update.js'),
	'i/webhooks/delete': () => import('@features/integrations/backend/endpoints/i/webhooks/delete.js'),
	'users/lists/delete': () => import('@features/relationships/backend/endpoints/users/lists/delete.js'),
	'users/lists/favorite': () => import('@features/relationships/backend/endpoints/users/lists/favorite.js'),
	'users/lists/pull': () => import('@features/relationships/backend/endpoints/users/lists/pull.js'),
	'users/lists/push': () => import('@features/relationships/backend/endpoints/users/lists/push.js'),
	'users/lists/unfavorite': () => import('@features/relationships/backend/endpoints/users/lists/unfavorite.js'),
	'users/lists/update-membership': () => import('@features/relationships/backend/endpoints/users/lists/update-membership.js'),
	'chat/read-all': () => import('@features/chat/backend/endpoints/chat/read-all.js'),
	'chat/rooms/join': () => import('@features/chat/backend/endpoints/chat/rooms/join.js'),
	'chat/rooms/leave': () => import('@features/chat/backend/endpoints/chat/rooms/leave.js'),
	'chat/rooms/mute': () => import('@features/chat/backend/endpoints/chat/rooms/mute.js'),
	'chat/rooms/delete': () => import('@features/chat/backend/endpoints/chat/rooms/delete.js'),
	'chat/rooms/invitations/ignore': () => import('@features/chat/backend/endpoints/chat/rooms/invitations/ignore.js'),
	'chat/messages/react': () => import('@features/chat/backend/endpoints/chat/messages/react.js'),
	'chat/messages/unreact': () => import('@features/chat/backend/endpoints/chat/messages/unreact.js'),
	'chat/messages/delete': () => import('@features/chat/backend/endpoints/chat/messages/delete.js'),
	'admin/emoji/set-category-bulk': () => import('@features/emojis/backend/endpoints/admin/emoji/set-category-bulk.js'),
	'admin/emoji/set-license-bulk': () => import('@features/emojis/backend/endpoints/admin/emoji/set-license-bulk.js'),
	'admin/emoji/set-aliases-bulk': () => import('@features/emojis/backend/endpoints/admin/emoji/set-aliases-bulk.js'),
	'admin/emoji/add-aliases-bulk': () => import('@features/emojis/backend/endpoints/admin/emoji/add-aliases-bulk.js'),
	'admin/emoji/remove-aliases-bulk': () => import('@features/emojis/backend/endpoints/admin/emoji/remove-aliases-bulk.js'),
	'notifications/create': () => import('@features/notifications/backend/endpoints/notifications/create.js'),
	'notifications/flush': () => import('@features/notifications/backend/endpoints/notifications/flush.js'),
	'notifications/mark-all-as-read': () => import('@features/notifications/backend/endpoints/notifications/mark-all-as-read.js'),
	'notifications/test-notification': () => import('@features/notifications/backend/endpoints/notifications/test-notification.js'),
	'clips/delete': () => import('@features/collections/backend/endpoints/clips/delete.js'),
	'clips/add-note': () => import('@features/collections/backend/endpoints/clips/add-note.js'),
	'clips/remove-note': () => import('@features/collections/backend/endpoints/clips/remove-note.js'),
};

for (const [route, load] of Object.entries(loaders)) {
	test(`${route} preserves its authorization, rate limits and error definitions`, async () => {
		const module = await load();
		expect(module.meta).toEqual(baseline[route as keyof typeof baseline]);
		const calls: { command: PropertyKey; input: unknown; options?: { context?: { actor?: { id: string }; token?: unknown } } }[] = [];
		const feature = new Proxy({}, {
			get: (_target, command) => async (input: unknown, options: typeof calls[number]['options']) => {
				calls.push({ command, input, options });
			},
		});
		// Construct every legacy validator and dispatch once without executing domain I/O.
		const endpoint = module.createEndpoint(feature as never);
		const actor = { id: 'trustedUser' } as MiLocalUser;
		const token = { id: 'trustedToken', name: 'App', iconUrl: null } as MiAccessToken;
		await endpoint.exec({
			id: 'id1', listId: 'list1', userId: 'user1', announcementId: 'announcement1', webhookId: 'webhook1',
			channelId: 'channel1', clipId: 'clip1', noteId: 'note1', roomId: 'room1', messageId: 'message1',
			mute: false, reaction: '👍', ids: ['emoji1'], aliases: ['alias'],
			category: null, license: null, body: 'hello', header: null, ...(route.startsWith('admin/announcements/') ? {} : { icon: null }),
			actor: { id: 'forged' }, token: { id: 'forged' },
		}, actor, token);
		expect(calls).toHaveLength(1);
		expect(calls[0].command).toBe(route);
		if (!route.startsWith('admin/emoji/')) expect(calls[0].options?.context?.actor?.id).toBe(actor.id);
		if (route === 'notifications/create') expect(calls[0].options?.context?.token).toEqual({ id: token.id, name: token.name, iconUrl: null });
	});
}
