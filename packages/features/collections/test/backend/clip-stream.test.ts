/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ClipService } from '../../backend/services/ClipService.js';
import { ClipChannel } from '../../backend/stream/clip.js';
import { MiClip } from '../../backend/models/Clip.js';
import type { Connection } from '../../../api/backend/transport/stream/Connection.js';

function fixture() {
	const clips = mockDeep<ConstructorParameters<typeof ClipService>[0]>();
	const clipNotes = mockDeep<ConstructorParameters<typeof ClipService>[1]>();
	const notes = mockDeep<ConstructorParameters<typeof ClipService>[2]>();
	const roles = mockDeep<ConstructorParameters<typeof ClipService>[3]>();
	const ids = { gen: vi.fn(() => 'synthetic-id') };
	const events = { publishClipStream: vi.fn() };
	clips.findOneBy.mockResolvedValue(Object.assign(new MiClip(), { id: 'clip123', userId: 'owner123', isPublic: true }));
	clips.update.mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 });
	clips.delete.mockResolvedValue({ raw: [], affected: 1 });
	clipNotes.countBy.mockResolvedValue(0);
	clipNotes.delete.mockResolvedValue({ raw: [], affected: 1 });
	roles.getUserPolicies.mockResolvedValue({ noteEachClipsLimit: 10 } as Awaited<ReturnType<typeof roles.getUserPolicies>>);
	const service = new ClipService(clips, clipNotes, notes, roles, ids, events);
	return { clips, clipNotes, notes, events, service };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('coalesces updates into immediate and trailing events after a quiet window', async () => {
	const { service, events } = fixture();
	await service.update({ id: 'owner123' }, 'clip123', 'first', undefined, undefined);
	vi.advanceTimersByTime(1000);
	await service.update({ id: 'owner123' }, 'clip123', 'second', undefined, undefined);
	vi.advanceTimersByTime(2999);
	expect(events.publishClipStream).toHaveBeenCalledTimes(1);
	vi.advanceTimersByTime(1);
	expect(events.publishClipStream.mock.calls).toEqual([['clip123', 'updated'], ['clip123', 'updated']]);
});

test('deletion cancels a pending update and shutdown clears all timers', async () => {
	const { service, events } = fixture();
	await service.update({ id: 'owner123' }, 'clip123', 'first', undefined, undefined);
	await service.update({ id: 'owner123' }, 'clip123', 'second', undefined, undefined);
	await service.delete({ id: 'owner123' }, 'clip123');
	vi.runAllTimers();
	expect(events.publishClipStream.mock.calls).toEqual([['clip123', 'updated'], ['clip123', 'deleted']]);
	await service.update({ id: 'owner123' }, 'clip123', 'third', undefined, undefined);
	service.clearPendingUpdates();
	expect(vi.getTimerCount()).toBe(0);
});

test('failed database mutation emits no false success', async () => {
	const { clips, events, service } = fixture();
	clips.delete.mockRejectedValueOnce(new Error('synthetic write failure'));
	await expect(service.delete({ id: 'owner123' }, 'clip123')).rejects.toThrow('synthetic write failure');
	expect(events.publishClipStream).not.toHaveBeenCalled();
	clips.update.mockRejectedValueOnce(new Error('synthetic update failure'));
	await expect(service.update({ id: 'owner123' }, 'clip123', 'first', undefined, undefined)).rejects.toThrow('synthetic update failure');
	expect(events.publishClipStream).not.toHaveBeenCalled();
});

test('adding a note waits for persistence counters before notifying subscribers', async () => {
	const { clips, notes, events, service } = fixture();
	const order: string[] = [];
	clips.update.mockImplementationOnce(async () => { order.push('clip'); return { generatedMaps: [], raw: [], affected: 1 }; });
	notes.increment.mockImplementationOnce(async () => { order.push('note'); return { generatedMaps: [], raw: [], affected: 1 }; });
	events.publishClipStream.mockImplementationOnce(() => { order.push('event'); });
	await service.addNote({ id: 'owner123' }, 'clip123', 'note123');
	expect(order).toEqual(['clip', 'note', 'event']);
	service.clearPendingUpdates();
});

test.each([{ isPublic: true, viewer: null, allowed: true }, { isPublic: false, viewer: null, allowed: false }, { isPublic: false, viewer: 'other123', allowed: false }, { isPublic: false, viewer: 'owner123', allowed: true }])('clip stream authorization %j', async ({ isPublic, viewer, allowed }) => {
	const repository = mockDeep<ConstructorParameters<typeof ClipChannel>[0]>();
	repository.findOneBy.mockResolvedValue(Object.assign(new MiClip(), { id: 'clip123', userId: 'owner123', isPublic }));
	const subscriber = new EventEmitter();
	const connection = mockDeep<Connection>();
	Object.defineProperty(connection, 'subscriber', { value: subscriber });
	Object.defineProperty(connection, 'user', { value: viewer ? { id: viewer } : null });
	const channel = new ClipChannel(repository, { id: 'channel123', connection });
	expect(await channel.init({ clipId: 'clip123' })).toBe(allowed);
	expect(subscriber.listenerCount('clipStream:clip123')).toBe(allowed ? 1 : 0);
	subscriber.emit('clipStream:clip123', { type: 'updated', body: { privateMetadata: 'synthetic' } });
	if (allowed) expect(connection.sendChannelMessage).toHaveBeenCalledWith('channel123', 'updated', null);
	else expect(connection.sendChannelMessage).not.toHaveBeenCalled();
	channel.dispose();
	expect(subscriber.listenerCount('clipStream:clip123')).toBe(0);
});
