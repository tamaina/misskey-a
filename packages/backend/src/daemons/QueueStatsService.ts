/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import Xev from 'xev';
import * as Bull from 'bullmq';
import { QueueService } from '../../../features/runtime/backend/services/QueueService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { QUEUE, baseQueueOptions } from '@/queue/const.js';
import type { OnApplicationShutdown } from '@nestjs/common';

const ev = new Xev();

const interval = 10000;

@Injectable()
export class QueueStatsService implements OnApplicationShutdown {
	private disposing: Promise<void> | undefined;
	private pending = new Set<Promise<void>>();
	private logListener: ((request: { id: string; length?: number }) => void) | undefined;
	private intervalId: NodeJS.Timeout | undefined;
	private events: Bull.QueueEvents[] = [];

	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueService: QueueService,
	) {
	}

	/**
	 * Report queue stats regularly
	 */
	@bindThis
	public start(): void {
		if (this.intervalId || this.disposing) return;
		const log = [] as any[];

		this.logListener = x => {
			ev.emit(`queueStatsLog:${x.id}`, log.slice(0, x.length ?? 50));
		};
		ev.on('requestQueueStatsLog', this.logListener);

		let activeDeliverJobs = 0;
		let activeInboxJobs = 0;

		const deliverQueueEvents = new Bull.QueueEvents(QUEUE.DELIVER, baseQueueOptions(this.config, QUEUE.DELIVER));
		this.events.push(deliverQueueEvents);
		const inboxQueueEvents = new Bull.QueueEvents(QUEUE.INBOX, baseQueueOptions(this.config, QUEUE.INBOX));
		this.events.push(inboxQueueEvents);

		deliverQueueEvents.on('active', () => {
			activeDeliverJobs++;
		});

		inboxQueueEvents.on('active', () => {
			activeInboxJobs++;
		});

		const tick = async () => {
			const deliverJobCounts = await this.queueService.deliverQueue.getJobCounts();
			const inboxJobCounts = await this.queueService.inboxQueue.getJobCounts();

			const stats = {
				deliver: {
					activeSincePrevTick: activeDeliverJobs,
					active: deliverJobCounts.active,
					waiting: deliverJobCounts.waiting,
					delayed: deliverJobCounts.delayed,
				},
				inbox: {
					activeSincePrevTick: activeInboxJobs,
					active: inboxJobCounts.active,
					waiting: inboxJobCounts.waiting,
					delayed: inboxJobCounts.delayed,
				},
			};

			if (this.disposing) return;
			ev.emit('queueStats', stats);

			log.unshift(stats);
			if (log.length > 200) log.pop();

			activeDeliverJobs = 0;
			activeInboxJobs = 0;
		};

		const runTick = () => {
			if (this.disposing) return;
			const task = tick();
			this.pending.add(task);
			void task.then(() => this.pending.delete(task), error => {
				this.pending.delete(task);
				console.error('Statistics collection failed:', error);
			});
		};
		runTick();
		this.intervalId = setInterval(runTick, interval);
	}

	@bindThis
	public dispose(): Promise<void> {
		return this.disposing ??= (async () => {
			clearInterval(this.intervalId ?? undefined);
			if (this.logListener) ev.off('requestQueueStatsLog', this.logListener);
			const results = await Promise.allSettled([...this.pending, ...this.events.map(event => event.close())]);
			const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
			if (errors.length) throw new AggregateError(errors, 'Statistics cleanup failed');
		})();
	}

	@bindThis
	public async onApplicationShutdown(): Promise<void> {
		await this.dispose();
	}
}
