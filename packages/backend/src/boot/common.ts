/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NestFactory } from '@nestjs/core';
import { init } from 'slacc';
import { createProcessRoles } from '@features/boot/backend';
import type { ProcessRole, RoleName } from '@features/boot/backend';
import { NestLogger } from '@/NestLogger.js';
import { envOption } from '@/env.js';
import type { Config } from '@/config.js';

let slaccInitialized = false;

export function initExtraThreadPool(config: Config) {
	if (slaccInitialized) return;

	const threadPoolSize = Math.max(config.threadPoolSize ?? 1, 1);

	init(threadPoolSize);

	slaccInitialized = true;
}

/** Transitional adapters keep Nest construction out of the feature lifecycle. */
export async function acquireLegacyRole(name: RoleName): Promise<ProcessRole> {
	const [{ MainModule }, { QueueProcessorModule }, { ServerService }, { QueueProcessorService },
		{ ChartManagementService }, { QueueStatsService }, { ServerStatsService }, { NoteCreateService }, { InboxProcessorService }, { GlobalModule }, { QueueModule }] = await Promise.all([
		import('../MainModule.js'), import('../queue/QueueProcessorModule.js'),
		import('../server/ServerService.js'), import('../queue/QueueProcessorService.js'),
		import('../core/chart/ChartManagementService.js'), import('../daemons/QueueStatsService.js'),
		import('../daemons/ServerStatsService.js'), import('../core/NoteCreateService.js'),
		import('../queue/processors/InboxProcessorService.js'), import('../GlobalModule.js'), import('../core/QueueModule.js'),
	]);
	const app = await NestFactory.createApplicationContext(name === 'server' ? MainModule : QueueProcessorModule, {
		logger: new NestLogger(), abortOnError: false,
	});
	try {
		const resources = app.get(GlobalModule);
		const queues = app.get(QueueModule);
		const charts = app.get(ChartManagementService);
		const notes = app.get(NoteCreateService);
		const serverService = name === 'server' ? app.get(ServerService) : undefined;
		const queue = name === 'queue' ? app.get(QueueProcessorService) : undefined;
		const inbox = name === 'queue' ? app.get(InboxProcessorService) : undefined;
		const queueStats = name === 'server' ? app.get(QueueStatsService) : undefined;
		const serverStats = name === 'server' ? app.get(ServerStatsService) : undefined;
		return {
			async start() {
				if (!envOption.noDaemons) {
					await charts.start();
					queueStats?.start();
					await serverStats?.start();
				}
				if (serverService) await serverService.launch();
				if (queue) {
					await queue.waitUntilReady();
					// Worker.run() settles on termination, not when admission is ready.
					void queue.start();
				}
			},
			async drain() {
				charts.stop();
				await settleRoleTasks([
					() => serverService?.drain(), () => queue?.stop(),
					() => queueStats?.dispose(), () => serverStats?.dispose(),
				]);
			},
			async flush() {
				// Flush domain buffers before charts and before Nest closes DB/Redis.
				await settleRoleTasks([() => notes.dispose(), () => inbox?.dispose(), () => charts.dispose()]);
			},
			close: () => settleRoleTasks([() => app.close(), () => queues.dispose(), () => resources.dispose()]),
		};
	} catch (error) {
		try { await app.close(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Context acquisition and cleanup failed'); }
		throw error;
	}
}

async function settleRoleTasks(tasks: (() => void | Promise<void> | undefined)[]) {
	const errors: unknown[] = [];
	for (const task of tasks) {
		try { await task(); } catch (error) { errors.push(error); }
	}
	if (errors.length) throw new AggregateError(errors, 'Role cleanup failed');
}

async function startRole(name: RoleName) {
	const runtime = createProcessRoles([name], acquireLegacyRole);
	await runtime.start();
	return { close: () => runtime.stop() };
}

export const server = () => startRole('server');
export const jobQueue = () => startRole('queue');
