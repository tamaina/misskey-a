/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import type { MiLocalUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import baseline from './command-metadata.fixture.json' with { type: 'json' };

// Snapshotted from the original handlers before contract migration.
const loaders = {
	'chat/read-all': () => import('./endpoints/chat/read-all.js'),
	'chat/rooms/join': () => import('./endpoints/chat/rooms/join.js'),
	'chat/rooms/leave': () => import('./endpoints/chat/rooms/leave.js'),
	'chat/rooms/mute': () => import('./endpoints/chat/rooms/mute.js'),
	'chat/rooms/delete': () => import('./endpoints/chat/rooms/delete.js'),
	'chat/rooms/invitations/ignore': () => import('./endpoints/chat/rooms/invitations/ignore.js'),
	'chat/messages/react': () => import('./endpoints/chat/messages/react.js'),
	'chat/messages/unreact': () => import('./endpoints/chat/messages/unreact.js'),
	'chat/messages/delete': () => import('./endpoints/chat/messages/delete.js'),
	'admin/emoji/set-category-bulk': () => import('./endpoints/admin/emoji/set-category-bulk.js'),
	'admin/emoji/set-license-bulk': () => import('./endpoints/admin/emoji/set-license-bulk.js'),
	'admin/emoji/set-aliases-bulk': () => import('./endpoints/admin/emoji/set-aliases-bulk.js'),
	'admin/emoji/add-aliases-bulk': () => import('./endpoints/admin/emoji/add-aliases-bulk.js'),
	'admin/emoji/remove-aliases-bulk': () => import('./endpoints/admin/emoji/remove-aliases-bulk.js'),
	'notifications/create': () => import('./endpoints/notifications/create.js'),
	'notifications/flush': () => import('./endpoints/notifications/flush.js'),
	'notifications/mark-all-as-read': () => import('./endpoints/notifications/mark-all-as-read.js'),
	'notifications/test-notification': () => import('./endpoints/notifications/test-notification.js'),
	'clips/delete': () => import('./endpoints/clips/delete.js'),
	'clips/add-note': () => import('./endpoints/clips/add-note.js'),
	'clips/remove-note': () => import('./endpoints/clips/remove-note.js'),
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
			clipId: 'clip1', noteId: 'note1', roomId: 'room1', messageId: 'message1',
			mute: false, reaction: '👍', ids: ['emoji1'], aliases: ['alias'],
			category: null, license: null, body: 'hello', header: null, icon: null,
			actor: { id: 'forged' }, token: { id: 'forged' },
		}, actor, token);
		expect(calls).toHaveLength(1);
		expect(calls[0].command).toBe(route);
		if (!route.startsWith('admin/emoji/')) expect(calls[0].options?.context?.actor?.id).toBe(actor.id);
		if (route === 'notifications/create') expect(calls[0].options?.context?.token).toEqual({ id: token.id, name: token.name, iconUrl: null });
	});
}
