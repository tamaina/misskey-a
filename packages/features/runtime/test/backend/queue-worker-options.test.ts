/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { QueueProcessorService } from '@features/runtime/backend/queue/QueueProcessorService.js';
import { QUEUE } from '@features/runtime/backend/queue/const.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { Config } from '@/config.js';

const mocks = vi.hoisted(() => ({ workers: new Map<string, Record<string, unknown>>() }));
vi.mock('bullmq', async () => ({
	...await vi.importActual<typeof import('bullmq')>('bullmq'),
	Worker: class {
		constructor(name: string, _process: unknown, options: Record<string, unknown>) {
			mocks.workers.set(name, options);
		}
		on() { return this; }
	},
}));

test.each([
	{ config: {}, concurrency: 128, max: 2048 },
	{ config: { deliverJobConcurrency: 4, deliverJobPerSec: 64 }, concurrency: 4, max: 64 },
	{ config: { deliverJobConcurrency: 256 }, concurrency: 256, max: 2048 },
	{ config: { deliverJobPerSec: 512 }, concurrency: 128, max: 512 },
	{ config: { deliverJobPerSec: 0 }, concurrency: 128, max: 0 },
])('uses delivery defaults while preserving explicit settings: $config', ({ config, concurrency, max }) => {
	mocks.workers.clear();
	const logger = mockDeep<QueueLoggerService>();
	logger.logger.createSubLogger.mockReturnValue(mockDeep());
	const parameters = Array.from({ length: Reflect.getMetadata('design:paramtypes', QueueProcessorService).length }, () => mockDeep());
	parameters[0] = { redisForJobQueue: { host: 'synthetic.invalid', prefix: 'synthetic' }, ...config } as Config;
	parameters[1] = logger;
	new QueueProcessorService(...parameters as ConstructorParameters<typeof QueueProcessorService>);

	expect(mocks.workers.get(QUEUE.DELIVER)).toMatchObject({
		concurrency,
		limiter: { max, duration: 1000 },
	});
	expect(mocks.workers.get(QUEUE.INBOX)).toMatchObject({
		concurrency: 16,
		limiter: { max: 32, duration: 1000 },
	});
});
