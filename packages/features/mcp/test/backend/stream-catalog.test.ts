/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, it } from 'vitest';
import { acceptsSource, projectFrame, reduceOccurrence, requiredEventScope, streamEventCatalog } from '../../backend/stream-catalog.js';
import { streamChannels } from '../../backend/stream-types.js';
import type { StreamOccurrence, StreamSubscription } from '../../backend/stream-types.js';
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';

const sensitive = { text: 'PRIVATE_TEXT', url: 'https://secret.invalid', ip: 'PRIVATE_IP', headers: { authorization: 'PRIVATE_TOKEN' }, value: 'PRIVATE_VALUE', email: 'PRIVATE_EMAIL', var: { secret: 'PRIVATE_VAR' } };
const occurrence = (channel: string, type: string, body: JsonValue): StreamOccurrence => ({ id: 'occurrence-1', createdAt: 1000, channel, message: { type, body } });
const projected = (channel: StreamSubscription['channel'], type: string, body: JsonValue, params: StreamSubscription['params'] = {}) => projectFrame({ channel, params }, { type: 'channel', body: { id: 'subscription', type, body } });

function bodyFor(type: string): JsonObject {
	return { ...sensitive, id: 'entity', userId: 'author', toUserId: 'recipient', toRoomId: 'room', visibility: 'public', visibleUserIds: [], type: 'mention', user: { id: 'author', host: 'example.invalid', ...sensitive }, note: { id: 'note', ...sensitive }, emoji: { id: 'emoji', ...sensitive }, emojis: [{ id: 'emoji', ...sensitive }], game: { id: 'game', ...sensitive }, announcement: { id: 'announcement', ...sensitive }, file: { id: 'file', ...sensitive }, pageId: 'page', event: 'changed', key: 'key', scope: ['scope'], createdAt: '2026-10-12T06:00:00.000Z', success: true, choice: 1, deletedAt: '2026-10-12T06:00:00.000Z', index: 2, pos: 4, body: { ...sensitive, userId: 'voter', choice: 1, deletedAt: '2026-10-12T06:00:00.000Z' } };
}

function noSensitive(value: unknown) {
	const encoded = JSON.stringify(value);
	for (const secret of ['PRIVATE_', 'https://secret.invalid', 'authorization']) expect(encoded).not.toContain(secret);
}

describe('explicit outbound catalog', () => {
	it('covers every native channel plus broadcast and note updates', () => {
		expect(Object.keys(streamEventCatalog).sort()).toEqual([...streamChannels, 'broadcast', 'note'].sort());
		expect(streamEventCatalog.userList).toContain('userRemoved');
	});
	for (const [family, types] of Object.entries(streamEventCatalog)) {
		for (const type of types) it(`${family}.${type} projects only its safe contract`, () => {
			const body = family === 'serverStats' ? { ...sensitive, cpu: 0.2, mem: { used: 2, active: 1, ...sensitive } }
				: family === 'queueStats' ? { ...sensitive, deliver: { active: 2, waiting: 1, ...sensitive } } : bodyFor(type);
			const params = { noteId: 'note', gameId: 'game' };
			const frame = family === 'broadcast' ? projectFrame({ channel: 'broadcast', params: {} }, { type, body })
				: family === 'note' ? projectFrame({ channel: 'note', params }, { type: 'noteUpdated', body: { id: 'note', type, body } })
					: projected(family as StreamSubscription['channel'], type, body, params);
			expect(frame).not.toBeNull(); noSensitive(frame);
		});
	}
});

it('reduces every native source event and supports safe projection of replayed entities', () => {
	const families = ['main', 'drive', 'note', 'userList', 'roleTimeline', 'antenna', 'admin', 'chatUser', 'chatRoom', 'reversi', 'reversiGame', 'serverStats', 'queueStats', 'broadcast'] as const;
	for (const family of families) for (const type of streamEventCatalog[family]) {
		const channel = family === 'broadcast' ? family : family === 'serverStats' || family === 'queueStats' ? `statisticsStream:${family}` : `${family}Stream:${family === 'chatUser' ? 'owner-other' : 'entity'}`;
		const body = family === 'serverStats' ? { ...sensitive, cpu: 0.5 } : family === 'queueStats' ? { ...sensitive, inbox: { waiting: 2 } } : bodyFor(type);
		const reduced = reduceOccurrence(occurrence(channel, type, body));
		expect(reduced, `${family}.${type}`).not.toBeNull(); noSensitive(reduced);
		// Note/timeline hydration belongs to the replay adapter, not the safe catalog.
		if (family === 'note' || family === 'main' && ['mention', 'reply', 'renote'].includes(type)) continue;
		const message = reduced!.message as JsonObject;
		const frame = family === 'broadcast' ? projectFrame({ channel: family, params: {} }, { type, body: message.body as JsonObject })
			: projected(family, type, message.body!, { gameId: 'entity' });
		expect(frame, `${family}.${type} replay`).not.toBeNull(); noSensitive(frame);
	}
});

it('preserves native note visibility tombstones without storing text/reaction URLs', () => {
	const source = occurrence('noteStream:note', 'deleted', { id: 'note', userId: 'author', visibility: 'specified', visibleUserIds: ['viewer'], body: { deletedAt: '2026-10-12T06:00:00.000Z', ...sensitive }, ...sensitive });
	const reduced = reduceOccurrence(source)!;
	expect((reduced.message as JsonObject).body).toEqual({ id: 'note', userId: 'author', visibility: 'specified', visibleUserIds: ['viewer'], body: { noteId: 'note', deletedAt: '2026-10-12T06:00:00.000Z' } });
	noSensitive(reduced);
	expect(reduceOccurrence({ ...source, message: { type: 'deleted', body: { id: 'note', userId: 'author', visibility: 'arbitrary', visibleUserIds: [] } } })).toBeNull();
});

it('reduces notesStream to a hydration reference and notification to mute metadata', () => {
	expect(reduceOccurrence({ id: 'event', createdAt: 0, channel: 'notesStream', message: bodyFor('note') })?.message).toEqual({ id: 'entity' });
	const reduced = reduceOccurrence(occurrence('mainStream:owner', 'notification', bodyFor('notification')))!;
	expect(reduced.message).toEqual({ type: 'notification', body: { id: 'entity', userId: 'author', user: { host: 'example.invalid' }, note: { id: 'note' } } });
	noSensitive(reduced);
});

it('rejects internal, future, malformed, oversized, command-only and nonfinite inputs', () => {
	for (const route of ['internal', 'unknownStream:owner', 'mainStream:a:b', `mainStream:${'a'.repeat(129)}`]) expect(reduceOccurrence(occurrence(route, 'signin', bodyFor('signin')))).toBeNull();
	for (const type of ['futureEvent', 'connected', 'statsLog']) expect(projected('main', type, bodyFor(type))).toBeNull();
	expect(reduceOccurrence(occurrence('broadcast', 'emojiUpdated', { emojis: Array.from({ length: 257 }, () => ({ id: 'emoji' })) }))).toBeNull();
	expect(projected('serverStats', 'stats', { cpu: Infinity, secret: 1, mem: { used: NaN } })).toBeNull();
	expect(projected('queueStats', 'stats', { inbox: { waiting: 2, secret: 2, delayed: Infinity } })?.body.body).toEqual({ inbox: { waiting: 2 } });
	expect(reduceOccurrence({ ...occurrence('broadcast', 'emojiAdded', bodyFor('emojiAdded')), createdAt: NaN })).toBeNull();
});

it('uses coarse source routing with native replay as final authority', () => {
	for (const channel of streamChannels) expect(acceptsSource({ channel, params: {} }, 'internal')).toBe(false);
	expect(acceptsSource({ channel: 'homeTimeline', params: {} }, 'notesStream')).toBe(true);
	expect(acceptsSource({ channel: 'main', params: {} }, 'notesStream')).toBe(false);
	expect(acceptsSource({ channel: 'chatRoom', params: { roomId: 'specific' } }, 'chatRoomStream:other')).toBe(true);
	expect(acceptsSource({ channel: 'note', params: {} }, 'noteStream:entity')).toBe(true);
});

it('requires supplemental feature grants for main references', () => {
	const subscription: StreamSubscription = { channel: 'main', params: {} };
	for (const [type, scope] of [['notification', 'read:notifications'], ['unreadNotification', 'read:notifications'], ['notificationFlushed', 'read:notifications'], ['newChatMessage', 'read:chat'], ['driveFileCreated', 'read:drive'], ['urlUploadFinished', 'read:drive']]) expect(requiredEventScope(subscription, occurrence('mainStream:owner', type, null))).toBe(scope);
	expect(requiredEventScope(subscription, occurrence('mainStream:owner', 'meUpdated', null))).toBeUndefined();
});

it.each(['readAllNotifications', 'notificationFlushed', 'readAllAnnouncements', 'myTokenRegenerated'])('preserves null void main event %s as invalidation', type => {
	const reduced = reduceOccurrence(occurrence('mainStream:owner', type, null));
	expect(reduced?.message).toEqual({ type, body: {} });
	expect(projected('main', type, null)?.body.body).toEqual({});
});
