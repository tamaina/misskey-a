/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, test, vi } from 'vitest';
import { QueueStatsService } from '@features/runtime/backend/queue/QueueStatsService.js';
import { ServerStatsService } from '@features/statistics/backend/daemons/ServerStatsService.js';
import { ChartManagementService } from '@features/statistics/backend/services/ChartManagementService.js';
const state = vi.hoisted(() => ({ events: [] as { close: ReturnType<typeof vi.fn> }[], emitters: [] as any[], cpu: [] as ((value: number) => void)[] }));
vi.mock('bullmq', () => ({ QueueEvents: class {
	close = vi.fn(async () => {});
	constructor() { state.events.push(this); }
	on() {}
} }));
vi.mock('@features/runtime/backend/queue/const.js', () => ({ QUEUE: { DELIVER: 'deliver', INBOX: 'inbox' }, baseQueueOptions: () => ({}) }));
vi.mock('xev', async () => {
	const { EventEmitter } = await import('node:events');
	return { default: class extends EventEmitter { constructor() { super(); state.emitters.push(this); } } };
});
vi.mock('os-utils', () => ({ cpuUsage: (callback: (value: number) => void) => { state.cpu.push(callback); } }));
vi.mock('systeminformation', () => ({ mem: async () => ({ total: 1, available: 1, active: 0 }), networkInterfaceDefault: async () => 'test', networkStats: async () => [{ rx_sec: 0, tx_sec: 0 }], disksIO: async () => ({ rIO_sec: 0, wIO_sec: 0 }) }));
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); state.events.length = 0; state.cpu.length = 0; });
test('queue statistics waits for pending reads and closes event clients once', async () => {
	vi.useFakeTimers(); let release!: (value: { active: number; waiting: number; delayed: number }) => void;
	const counts = new Promise<{ active: number; waiting: number; delayed: number }>(resolve => { release = resolve; });
	const queue = { getJobCounts: () => counts };
	const service = new QueueStatsService({} as never, { deliverQueue: queue, inboxQueue: queue } as never);
	service.start(); service.start(); expect(state.events).toHaveLength(2);
	let done = false; const stopping = service.dispose().then(() => { done = true; });
	await Promise.resolve(); expect(done).toBe(false);
	release({ active: 0, waiting: 0, delayed: 0 }); await stopping; await service.dispose();
	for (const event of state.events) expect(event.close).toHaveBeenCalledOnce();
	for (const emitter of state.emitters) expect(emitter.listenerCount('requestQueueStatsLog')).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});
test('server statistics removes its listener and waits for the active sample', async () => {
	vi.useFakeTimers(); const service = new ServerStatsService({ enableServerMachineStats: true } as never);
	service.start(); expect(state.cpu).toHaveLength(1);
	let done = false; const stopping = service.dispose().then(() => { done = true; });
	await Promise.resolve(); expect(done).toBe(false); state.cpu[0](0.25); await stopping;
	for (const emitter of state.emitters) expect(emitter.listenerCount('requestServerStatsLog')).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
});
test('chart shutdown waits for active save before final flush and does not repeat', async () => {
	vi.useFakeTimers(); vi.stubEnv('NODE_ENV', 'development'); let release!: () => void;
	const pending = new Promise<void>(resolve => { release = resolve; });
	const save = vi.fn().mockImplementationOnce(() => pending).mockResolvedValue(undefined);
	const chart = { save } as never;
	const service = new ChartManagementService(chart, chart, chart, chart, chart, chart, chart, chart, chart, chart, chart, chart, { logger: { error: vi.fn() } } as never);
	await service.start(); await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
	let done = false; const stopping = service.dispose().then(() => { done = true; });
	await Promise.resolve(); expect(done).toBe(false); release(); await stopping;
	const calls = save.mock.calls.length; expect(calls).toBe(24);
	await service.dispose(); expect(save).toHaveBeenCalledTimes(calls); expect(vi.getTimerCount()).toBe(0);
});
