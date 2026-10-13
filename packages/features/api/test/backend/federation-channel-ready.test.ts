/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { afterEach, expect, test, vi } from 'vitest';
import { waitForChannelReady } from '../../../../backend/test-federation/channel-ready.js';

function harness() {
	const stream = new EventEmitter();
	const send = vi.fn();
	return { stream: Object.assign(stream, { send }), send };
}

afterEach(() => vi.useRealTimers());

test('trigger waits for matching server acknowledgement after delayed channel initialization', async () => {
	vi.useFakeTimers();
	const { stream, send } = harness();
	const trigger = vi.fn();
	const ready = waitForChannelReady(stream, 'owned-channel', 'homeTimeline', undefined, 10_000).then(trigger);
	expect(send).toHaveBeenCalledWith('connect', { id: 'owned-channel', channel: 'homeTimeline', params: undefined, pong: true });
	await vi.advanceTimersByTimeAsync(500);
	expect(trigger).not.toHaveBeenCalled();
	stream.emit('connected', { id: 'different-channel' });
	await Promise.resolve();
	expect(trigger).not.toHaveBeenCalled();
	stream.emit('connected', { id: 'owned-channel' });
	await ready;
	expect(trigger).toHaveBeenCalledTimes(1);
	expect(stream.listenerCount('connected')).toBe(0);
	expect(stream.listenerCount('_disconnected_')).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});

test('missing acknowledgement rejects without invoking trigger and releases listeners and timer', async () => {
	vi.useFakeTimers();
	const { stream } = harness();
	const trigger = vi.fn();
	const ready = waitForChannelReady(stream, 'owned-channel', 'homeTimeline', {}, 10_000).then(trigger);
	const rejected = expect(ready).rejects.toThrow('Channel acknowledgement timed out');
	await vi.advanceTimersByTimeAsync(10_000);
	await rejected;
	expect(trigger).not.toHaveBeenCalled();
	expect(stream.listenerCount('connected')).toBe(0);
	expect(stream.listenerCount('_disconnected_')).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});

test('disconnect and send failure reject immediately and release readiness state', async () => {
	vi.useFakeTimers();
	for (const failure of ['disconnect', 'send'] as const) {
		const { stream, send } = harness();
		if (failure === 'send') send.mockImplementation(() => { throw new Error('synthetic send failure'); });
		const ready = waitForChannelReady(stream, 'owned-channel', 'homeTimeline', {}, 10_000);
		const rejected = expect(ready).rejects.toThrow(failure === 'send' ? 'synthetic send failure' : 'Stream disconnected before channel acknowledgement');
		if (failure === 'disconnect') stream.emit('_disconnected_');
		await rejected;
		expect(stream.listenerCount('connected')).toBe(0);
		expect(stream.listenerCount('_disconnected_')).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	}
});

test('listeners and timeout are installed before even a synchronous acknowledgement', async () => {
	vi.useFakeTimers();
	const { stream, send } = harness();
	send.mockImplementation(() => stream.emit('connected', { id: 'owned-channel' }));
	await waitForChannelReady(stream, 'owned-channel', 'homeTimeline', undefined, 10_000);
	expect(stream.listenerCount('connected')).toBe(0);
	expect(stream.listenerCount('_disconnected_')).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});
