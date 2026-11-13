/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isJsonObject } from '@features/runtime/backend/formatting/json-value.js';
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import type { NativeStreamFrame } from '@features/api/backend/transport/stream/Connection.js';
import type { StreamOccurrence, StreamSubscription } from './stream-types.js';

const mainEvents = ['notification', 'mention', 'reply', 'renote', 'follow', 'followed', 'unfollow', 'meUpdated', 'pageEvent', 'urlUploadFinished', 'readAllNotifications', 'notificationFlushed', 'unreadNotification', 'unreadAntenna', 'newChatMessage', 'readAllAnnouncements', 'myTokenRegenerated', 'signin', 'registryUpdated', 'driveFileCreated', 'readAntenna', 'receiveFollowRequest', 'announcementCreated'] as const;
const noteEvents = ['pollVoted', 'deleted', 'updated', 'reacted', 'unreacted'] as const;
const broadcastEvents = ['emojiAdded', 'emojiUpdated', 'emojiDeleted', 'announcementCreated'] as const;
const chatEvents = ['message', 'deleted', 'react', 'unreact'] as const;
const noteChannelEvents = ['note'] as const;
/** Explicit wire inventory. connected and statsLog require inbound commands, which MCP does not execute. */
export const streamEventCatalog = {
	main: mainEvents,
	homeTimeline: noteChannelEvents, localTimeline: noteChannelEvents, hybridTimeline: noteChannelEvents,
	globalTimeline: noteChannelEvents, userList: ['note', 'userAdded', 'userRemoved'], hashtag: noteChannelEvents,
	roleTimeline: noteChannelEvents, antenna: noteChannelEvents, channel: noteChannelEvents,
	drive: ['fileCreated', 'fileDeleted', 'fileUpdated', 'folderCreated', 'folderDeleted', 'folderUpdated'],
	admin: ['newAbuseUserReport'], chatUser: chatEvents, chatRoom: chatEvents,
	reversi: ['matched', 'invited'],
	reversiGame: ['changeReadyStates', 'updateSettings', 'log', 'started', 'ended', 'canceled'],
	serverStats: ['stats'], queueStats: ['stats'], broadcast: broadcastEvents, note: noteEvents,
} as const;

type Family = keyof typeof streamEventCatalog;
const timelineFamilies = new Set<Family>(['homeTimeline', 'localTimeline', 'hybridTimeline', 'globalTimeline', 'userList', 'hashtag', 'roleTimeline', 'antenna', 'channel']);
const identifier = /^[A-Za-z0-9_-]{1,128}$/;

function id(value: JsonValue | undefined): string | undefined { return typeof value === 'string' && identifier.test(value) ? value : undefined; }

function label(value: JsonValue | undefined): string | undefined { return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[\u0000-\u001f]/.test(value) ? value : undefined; }

function obj(value: JsonValue | undefined): JsonObject { return isJsonObject(value) ? value : {}; }

function reference(key: string, value: JsonValue | undefined): JsonObject | null { const found = id(value); return found ? { [key]: found } : null; }

function addId(target: JsonObject, key: string, value: JsonValue | undefined) { const found = id(value); if (found) target[key] = found; }

function eventAllowed(family: Family, type: string): boolean { return (streamEventCatalog[family] as readonly string[]).includes(type); }

function boundedNames(value: JsonValue | undefined, limit: number): string[] | undefined {
	return Array.isArray(value) && value.length <= limit && value.every(v => id(v)) ? value as string[] : undefined;
}

function instant(value: JsonValue | undefined): string | undefined {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.+-]{8,24}Z?$/.test(value) && Number.isFinite(Date.parse(value)) ? value : undefined;
}

/** Only native public transport sources are admitted, never internal or future unknown routes. */
function sourceFamily(route: string): Family | 'notes' | null {
	if (route === 'notesStream') return 'notes';
	if (route === 'broadcast') return 'broadcast';
	if (route === 'statisticsStream:serverStats') return 'serverStats';
	if (route === 'statisticsStream:queueStats') return 'queueStats';
	const match = /^(main|drive|note|userList|roleTimeline|antenna|admin|chatUser|chatRoom|reversi|reversiGame)Stream:([A-Za-z0-9_-]{1,257})$/.exec(route);
	if (!match) return null;
	if (match[1] === 'chatUser') {
		if (!/^[A-Za-z0-9_-]{1,128}-[A-Za-z0-9_-]{1,128}$/.test(match[2])) return null;
	} else if (!id(match[2])) return null;
	return match[1] as Family;
}

/** Coarse fan-out only. Native connection/channel initialization and replay remain authoritative. */
export function acceptsSource(subscription: StreamSubscription, rawChannel: string): boolean {
	const family = sourceFamily(rawChannel);
	if (family === 'notes') return timelineFamilies.has(subscription.channel);
	if (family === 'userList') return subscription.channel === 'userList';
	return family === subscription.channel;
}

/** Main's native read:account scope alone must not forward other feature references. */
export function requiredEventScope(subscription: StreamSubscription, source: StreamOccurrence): string | undefined {
	if (subscription.channel !== 'main' || !isJsonObject(source.message)) return undefined;
	switch (source.message.type) {
		case 'newChatMessage': return 'read:chat';
		case 'driveFileCreated': case 'urlUploadFinished': return 'read:drive';
		case 'notification': case 'unreadNotification': case 'readAllNotifications': case 'notificationFlushed': return 'read:notifications';
		default: return undefined;
	}
}

function numericStats(family: 'serverStats' | 'queueStats', value: JsonValue | undefined): JsonObject | null {
	const input = obj(value); const result: JsonObject = {};
	const layout: Record<string, readonly string[] | null> = family === 'serverStats'
		? { cpu: null, mem: ['used', 'active'], net: ['rx', 'tx'], fs: ['r', 'w'] }
		: { deliver: ['activeSincePrevTick', 'active', 'waiting', 'delayed'], inbox: ['activeSincePrevTick', 'active', 'waiting', 'delayed'] };
	for (const [key, fields] of Object.entries(layout)) {
		if (fields === null) { const number = input[key]; if (typeof number === 'number' && Number.isFinite(number)) result[key] = number; } else {
			const nested = obj(input[key]); const output: JsonObject = {};
			for (const field of fields) { const number = nested[field]; if (typeof number === 'number' && Number.isFinite(number)) output[field] = number; }
			if (Object.keys(output).length) result[key] = output;
		}
	}
	return Object.keys(result).length ? result : null;
}

/** Safe event contracts are references/invalidation hints; no text, URLs, private profile, or arbitrary values. */
function contract(family: Family, type: string, value: JsonValue | undefined, params: JsonObject): JsonObject | null {
	if (!eventAllowed(family, type)) return null;
	const body = obj(value);
	if (family === 'userList' && type !== 'note') return reference('userId', body.id ?? body.userId);
	if (timelineFamilies.has(family)) return reference('noteId', body.id ?? body.noteId);
	if (family === 'serverStats' || family === 'queueStats') return numericStats(family, value);
	if (family === 'note') {
		const result = reference('noteId', params.noteId ?? params.id ?? body.id); if (!result) return null;
		addId(result, 'userId', body.userId);
		if (type === 'pollVoted' && typeof body.choice === 'number' && Number.isSafeInteger(body.choice) && body.choice >= 0 && body.choice <= 100) result.choice = body.choice;
		if (type === 'deleted') { const timestamp = instant(body.deletedAt); if (timestamp) result.deletedAt = timestamp; }
		return result;
	}
	if (family === 'broadcast' || family === 'main' && type === 'announcementCreated') {
		if (type === 'announcementCreated') return reference('announcementId', obj(body.announcement).id ?? body.announcementId);
		if (type === 'emojiAdded') return reference('emojiId', obj(body.emoji).id ?? body.emojiId);
		if (body.emojiIds !== undefined) { const ids = boundedNames(body.emojiIds, 256); return ids ? { emojiIds: ids } : null; }
		const emojis = body.emojis; if (!Array.isArray(emojis) || emojis.length > 256) return null;
		const ids = emojis.map(emoji => id(obj(emoji).id)); if (ids.some(found => !found)) return null;
		return { emojiIds: ids as string[] };
	}
	if (family === 'drive') return reference(type.startsWith('file') ? 'fileId' : 'folderId', typeof value === 'string' ? value : body.id ?? body.fileId ?? body.folderId);
	if (family === 'admin') return reference('reportId', body.id ?? body.reportId);
	if (family === 'chatUser' || family === 'chatRoom' || family === 'main' && type === 'newChatMessage') {
		const result = reference('messageId', typeof value === 'string' ? value : body.messageId ?? body.id); if (!result) return null;
		addId(result, 'userId', body.userId ?? obj(body.user).id);
		addId(result, 'toUserId', body.toUserId); addId(result, 'toRoomId', body.toRoomId);
		return result;
	}
	if (family === 'reversi') return type === 'matched' ? reference('gameId', obj(body.game).id ?? body.gameId) : reference('userId', obj(body.user).id ?? body.userId);
	if (family === 'reversiGame') {
		const result = reference('gameId', obj(body.game).id ?? body.gameId ?? params.gameId); if (!result) return null;
		addId(result, 'userId', body.userId); addId(result, 'winnerId', body.winnerId);
		if (type === 'log') {
			addId(result, 'logId', body.id ?? body.logId);
			for (const key of ['index', 'pos'] as const) if (typeof body[key] === 'number' && Number.isSafeInteger(body[key]) && (body[key] as number) >= 0) result[key] = body[key];
		}
		return result;
	}
	if (family !== 'main') return null;
	switch (type) {
		case 'mention': case 'reply': case 'renote': return reference('noteId', body.id ?? body.noteId);
		case 'follow': case 'followed': case 'unfollow': case 'meUpdated': case 'receiveFollowRequest': return reference('userId', body.id ?? body.userId);
		case 'notification': case 'unreadNotification': {
			const result = reference('notificationId', body.id ?? body.notificationId); if (!result) return null;
			addId(result, 'userId', body.userId); addId(result, 'noteId', obj(body.note).id ?? body.noteId); return result;
		}
		case 'unreadAntenna': case 'readAntenna': return reference('antennaId', body.id ?? body.antennaId);
		case 'driveFileCreated': return reference('fileId', body.id ?? body.fileId);
		case 'urlUploadFinished': return reference('fileId', obj(body.file).id ?? body.fileId);
		case 'readAllNotifications': case 'notificationFlushed': case 'readAllAnnouncements': case 'myTokenRegenerated': return {};
		case 'signin': {
			const result = reference('id', body.id); if (!result) return null;
			const timestamp = instant(body.createdAt); if (timestamp) result.createdAt = timestamp;
			if (typeof body.success === 'boolean') result.success = body.success; return result;
		}
		case 'registryUpdated': {
			const key = label(body.key); const scope = Array.isArray(body.scope) && body.scope.length <= 32 && body.scope.every(item => label(item)) ? body.scope : undefined; if (!key || body.scope !== undefined && !scope) return null;
			return { key, ...(scope ? { scope } : {}) };
		}
		case 'pageEvent': {
			const result = reference('pageId', body.pageId); if (!result || !label(body.event)) return null;
			result.event = body.event; addId(result, 'userId', body.userId); return result;
		}
		default: return null;
	}
}

/** Strip payload before Redis queue storage, preserving only native routing and hydration metadata. */
export function reduceOccurrence(source: StreamOccurrence): StreamOccurrence | null {
	if (!id(source.id) || !Number.isFinite(source.createdAt) || source.createdAt < 0) return null;
	const family = sourceFamily(source.channel); if (!family) return null;
	if (family === 'notes') {
		const noteId = id(obj(source.message).id); return noteId ? { ...source, message: { id: noteId } } : null;
	}
	const message = obj(source.message); if (typeof message.type !== 'string' || !eventAllowed(family, message.type)) return null;
	const type = message.type; const body = obj(message.body);
	if (family === 'note') {
		const noteId = id(body.id); const userId = id(body.userId);
		const visibility = body.visibility;
		const visibleUserIds = boundedNames(body.visibleUserIds, 1536);
		if (!noteId || source.channel !== `noteStream:${noteId}` || !userId || typeof visibility !== 'string' || !['public', 'home', 'followers', 'specified'].includes(visibility) || !visibleUserIds) return null;
		const reduced = contract('note', type, body.body, { noteId }); if (!reduced) return null;
		return { ...source, message: { type, body: { id: noteId, userId, visibility, visibleUserIds, body: reduced } } };
	}
	if (family === 'main' && ['mention', 'reply', 'renote'].includes(type)) {
		const noteId = id(body.id); return noteId ? { ...source, message: { type, body: { id: noteId } } } : null;
	}
	if (family === 'main' && ['notification', 'unreadNotification'].includes(type)) {
		const notificationId = id(body.id); if (!notificationId) return null;
		const reduced: JsonObject = { id: notificationId }; addId(reduced, 'userId', body.userId);
		const user = obj(body.user); const host = user.host;
		if (host === null || typeof host === 'string' && host.length <= 253 && /^[A-Za-z0-9.-]+$/.test(host)) reduced.user = { host };
		const noteId = id(obj(body.note).id); if (noteId) reduced.note = { id: noteId };
		return { ...source, message: { type, body: reduced } };
	}
	const reduced = contract(family, type, message.body, family === 'reversiGame' ? { gameId: source.channel.slice('reversiGameStream:'.length) } : {});
	if (!reduced) return null;
	// Native callbacks need native-shaped entities, never the original packed payload.
	let nativeBody: JsonValue = reduced;
	if (family === 'antenna' || family === 'roleTimeline') nativeBody = { id: reduced.noteId };
	if (family === 'userList') nativeBody = { id: type === 'note' ? reduced.noteId : reduced.userId };
	if (family === 'drive') nativeBody = type.endsWith('Deleted') ? String(reduced.fileId ?? reduced.folderId) : { id: reduced.fileId ?? reduced.folderId };
	if (family === 'main' && ['follow', 'followed', 'unfollow', 'meUpdated', 'receiveFollowRequest'].includes(type)) nativeBody = { id: reduced.userId };
	return { ...source, message: { type, body: nativeBody } };
}

/** Called only after native replay and delivery-time authorization. Unknown output fails closed. */
export function projectFrame(subscription: StreamSubscription, frame: NativeStreamFrame): NativeStreamFrame | null {
	let type: string; let body: JsonValue | undefined;
	if (subscription.channel === 'broadcast') { type = frame.type; body = frame.body; } else if (subscription.channel === 'note') {
		if (frame.type !== 'noteUpdated' || typeof frame.body.type !== 'string') return null;
		type = frame.body.type; body = frame.body.body;
		const reduced = contract('note', type, body, { ...subscription.params, noteId: frame.body.id });
		return reduced ? { type: 'noteUpdated', body: { id: reduced.noteId, type, body: reduced } } : null;
	} else {
		if (frame.type !== 'channel' || !id(frame.body.id) || typeof frame.body.type !== 'string') return null;
		type = frame.body.type; body = frame.body.body;
	}
	const reduced = contract(subscription.channel, type, body, subscription.params);
	return reduced ? subscription.channel === 'broadcast' ? { type, body: reduced } : { type: 'channel', body: { id: frame.body.id, type, body: reduced } } : null;
}
