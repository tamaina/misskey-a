/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { QueueModule } from '@features/boot/backend/assembly/QueueModule.js';
import { QueueProcessorService } from '@features/runtime/backend/queue/QueueProcessorService.js';
import { QUEUE } from '@features/runtime/backend/queue/const.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import type { Provider, FactoryProvider } from '@nestjs/common';
import type { Config } from '@/config.js';
const mocks = vi.hoisted(() => ({ workers: [] as { name: string; process: (job: unknown) => unknown; options: Record<string, unknown>; run: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn>; waitUntilReady: ReturnType<typeof vi.fn> }[] }));
vi.mock('@features/mcp/backend/stream-queue-admission.js', async () => ({ ...await vi.importActual<typeof import('@features/mcp/backend/stream-queue-admission.js')>('@features/mcp/backend/stream-queue-admission.js'), reconcileStreamJobs: vi.fn(async () => {}), releaseStreamJob: vi.fn(async () => {}) }));
vi.mock('bullmq', async () => {
	const actual = await vi.importActual<typeof import('bullmq')>('bullmq');
	return { ...actual, Queue: class {
		close = vi.fn(async () => {});
		constructor(public name: string, public opts: Record<string, unknown>) { }
	}, Worker: class {
		run = vi.fn(async () => {}); close = vi.fn(async () => {}); waitUntilReady = vi.fn(async () => {});
		constructor(public name: string, public process: (job: unknown) => unknown, public options: Record<string, unknown>) { mocks.workers.push(this); }
		on() { return this; }
	} };
});
it('wires the isolated antenna worker to existing delivery and includes it in readiness/start/shutdown', async () => {
	mocks.workers.length = 0;
	const config = { redisForJobQueue: { host: 'synthetic.invalid', prefix: 'synthetic' } } as Config;
	const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue(mockDeep());
	const delivery = mockDeep<UserWebhookDeliverProcessorService>(); delivery.process.mockResolvedValue('Synthetic success');
	const parameters = Array.from({ length: Reflect.getMetadata('design:paramtypes', QueueProcessorService).length }, () => mockDeep());
	parameters[0] = config; parameters[1] = logger; parameters[2] = { startSpan: (_name: string, callback: () => unknown) => callback() }; parameters[3] = delivery;
	const service = new QueueProcessorService(...parameters as ConstructorParameters<typeof QueueProcessorService>);
	const worker = mocks.workers.find(worker => worker.name === QUEUE.MCP_ANTENNA_DELIVER)!;
	expect(worker).toBeDefined(); expect(worker.options.autorun).toBe(false);
	expect(worker.options.prefix).not.toBe(mocks.workers.find(worker => worker.name === QUEUE.USER_WEBHOOK_DELIVER)!.options.prefix);
	const job = { data: { mode: 'mcp', type: 'antenna', noteId: 'synthetic' } };
	expect(await worker.process(job)).toBe('Synthetic success'); expect(delivery.process).toHaveBeenCalledWith(job);
	await service.waitUntilReady(); await service.start(); await service.stop();
	expect(worker.waitUntilReady).toHaveBeenCalledOnce(); expect(worker.run).toHaveBeenCalledOnce(); expect(worker.close).toHaveBeenCalledOnce();
	const providers = Reflect.getMetadata('providers', QueueModule) as Provider[];
	const registrations = providers.filter(provider => typeof provider === 'object' && 'provide' in provider && provider.provide === 'queue:mcpAntennaDeliver');
	expect(registrations).toHaveLength(1);
	const queue = (registrations[0] as FactoryProvider).useFactory(config);
	expect(queue.name).toBe(worker.name); expect(queue.opts.prefix).toBe(worker.options.prefix);
	const queues = Array.from({ length: Reflect.getMetadata('design:paramtypes', QueueModule).length }, () => ({ close: vi.fn(async () => {}) }));
	const injectionTokens = Reflect.getMetadata('self:paramtypes', QueueModule) as { index: number; param: string }[];
	const index = injectionTokens.find(entry => entry.param === 'queue:mcpAntennaDeliver')!.index; queues[index] = queue;
	const module = new QueueModule(...queues as unknown as ConstructorParameters<typeof QueueModule>);
	await module.dispose(); expect(queue.close).toHaveBeenCalledOnce();
	const exports = Reflect.getMetadata('exports', QueueModule) as Provider[];
	expect(exports.filter(provider => typeof provider === 'object' && 'provide' in provider && provider.provide === 'queue:mcpAntennaDeliver')).toHaveLength(1);
});
