/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';
import type Xev from 'xev';
import { afterAll, afterEach, expect, it, vi } from 'vitest';
import { ServerStatsChannel } from '@features/statistics/backend/stream/server-stats.js';
import { QueueStatsChannel } from '@features/operations/backend/stream/queue-stats.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';

const state = vi.hoisted(() => ({ emitters: [] as Xev[] }));
afterEach(() => { for (const emitter of state.emitters) emitter.removeAllListeners(); });
afterAll(() => { for (const emitter of state.emitters) emitter.dispose(); });
vi.mock('xev', async importOriginal => {
	const { default: Xev } = await importOriginal<typeof import('xev')>();
	// Capture actual process-wide emitters without replacing once/removeListener
	// or the IPC envelope. No external service or worker is needed.
	return { default: class extends Xev { constructor() { super(); state.emitters.push(this); } } };
});

it.each([
	['serverStats', ServerStatsChannel],
	['queueStats', QueueStatsChannel],
] as const)('releases pending %s log responses on channel disposal', async (name, Constructor) => {
	const subscriber = new EventEmitter();
	const send = vi.fn();
	const makeChannel = (id: string) => new Constructor({ id, connection: { subscriber, isNativeOutput: false, sendChannelMessage: send } } as unknown as ChannelRequest);
	const survivor = makeChannel('survivor');
	await survivor.init({});
	survivor.onMessage('requestLog', { id: 'shared-request', length: 10 });
	const emitter = state.emitters.find(item => item.listenerCount(name) > 0)!;
	const event = `${name}Log:shared-request`;

	// No statistics service responds: repeated screen open/close must not retain
	// the closed channels through the process-wide Xev emitter.
	for (let i = 0; i < 20; i++) {
		const channel = makeChannel(`closed-${i}`);
		await channel.init({});
		channel.onMessage('requestLog', { id: 'shared-request', length: 10 });
		channel.onMessage('requestLog', { id: `missing-${i}`, length: 10 });
		channel.dispose();
		channel.dispose();
		channel.onMessage('requestLog', { id: `missing-${i}`, length: 10 });
	}

	expect(emitter.listenerCount(event)).toBe(1);
	for (let i = 0; i < 20; i++) expect(emitter.listenerCount(`${name}Log:missing-${i}`)).toBe(0);

	const log = [{ synthetic: true }];
	emitter.emit(event, log);
	expect(send).toHaveBeenCalledExactlyOnceWith('survivor', 'statsLog', log);
	expect(emitter.listenerCount(event)).toBe(0);
	emitter.emit(event, log);
	expect(send).toHaveBeenCalledOnce();
	const remove = vi.spyOn(emitter, 'removeListener');
	survivor.dispose();
	// Completed callbacks are also released from the channel's bookkeeping.
	expect(remove.mock.calls.map(([eventName]) => eventName)).toEqual([name]);
});

it.each([
	['serverStats', ServerStatsChannel],
	['queueStats', QueueStatsChannel],
] as const)('routes native %s through Redis and WebSocket through Xev without duplicates', async (name, Constructor) => {
	const subscriber = new EventEmitter();
	const nativeSend = vi.fn(); const wsSend = vi.fn();
	const native = new Constructor({ id: 'native', connection: { subscriber, isNativeOutput: true, sendChannelMessage: nativeSend } } as unknown as ChannelRequest);
	const ws = new Constructor({ id: 'ws', connection: { subscriber, isNativeOutput: false, sendChannelMessage: wsSend } } as unknown as ChannelRequest);
	await native.init({}); await ws.init({});
	const stats = { cpu: 0.25, mem: { used: 123 } };
	try {
		subscriber.emit(`statisticsStream:${name}`, { type: 'stats', body: stats });
		expect(nativeSend).toHaveBeenCalledExactlyOnceWith('native', 'stats', stats);
		expect(wsSend).not.toHaveBeenCalled();
		state.emitters[0].emit(name, stats);
		expect(wsSend).toHaveBeenCalledExactlyOnceWith('ws', 'stats', stats);
		expect(nativeSend).toHaveBeenCalledOnce();
	} finally { native.dispose(); ws.dispose(); }
	expect(subscriber.listenerCount(`statisticsStream:${name}`)).toBe(0);
	for (const emitter of state.emitters) expect(emitter.listenerCount(name)).toBe(0);
	subscriber.emit(`statisticsStream:${name}`, { type: 'stats', body: stats });
	state.emitters[0].emit(name, stats);
	expect(wsSend).toHaveBeenCalledOnce(); expect(nativeSend).toHaveBeenCalledOnce();
});
