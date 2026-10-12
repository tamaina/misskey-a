/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { ServerStatsChannel } from '@features/statistics/backend/stream/server-stats.js';
import { QueueStatsChannel } from '@features/operations/backend/stream/queue-stats.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';

const state = vi.hoisted(() => ({ emitters: [] as EventEmitter[] }));
vi.mock('xev', async () => {
	const { EventEmitter } = await import('node:events');
	return { default: class extends EventEmitter { constructor() { super(); state.emitters.push(this); } } };
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
		for (const emitter of state.emitters) emitter.emit(name, stats);
		expect(wsSend).toHaveBeenCalledExactlyOnceWith('ws', 'stats', stats);
		expect(nativeSend).toHaveBeenCalledOnce();
	} finally { native.dispose(); ws.dispose(); }
	expect(subscriber.listenerCount(`statisticsStream:${name}`)).toBe(0);
	for (const emitter of state.emitters) expect(emitter.listenerCount(name)).toBe(0);
	subscriber.emit(`statisticsStream:${name}`, { type: 'stats', body: stats });
	for (const emitter of state.emitters) emitter.emit(name, stats);
	expect(wsSend).toHaveBeenCalledOnce(); expect(nativeSend).toHaveBeenCalledOnce();
});
