/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { bindThis } from '../decorators.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { CheckModeratorsActivityProcessorService } from '@features/moderation/backend/jobs/CheckModeratorsActivityProcessorService.js';
import { runQueueJob } from './queue-job-runner.js';
import { McpStreamDeliverProcessorService } from '@features/integrations/backend/jobs/McpStreamDeliverProcessorService.js';
import { reconcileStreamJobs, releaseStreamJob } from '@features/mcp/backend/stream-queue-admission.js';
import type { McpStreamDeliverQueue } from '@features/boot/backend/assembly/QueueModule.js';
import type { ArchiveAnnouncementJobData, McpStreamDeliverJobData } from './types.js';
import { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import { SystemWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/SystemWebhookDeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from '@features/notes/backend/jobs/EndedPollNotificationProcessorService.js';
import { PostScheduledNoteProcessorService } from '@features/notes/backend/jobs/PostScheduledNoteProcessorService.js';
import { DeliverProcessorService } from '@features/federation/backend/jobs/DeliverProcessorService.js';
import { InboxProcessorService } from '@features/federation/backend/jobs/InboxProcessorService.js';
import { DeleteDriveFilesProcessorService } from '@features/drive/backend/jobs/DeleteDriveFilesProcessorService.js';
import { ExportCustomEmojisProcessorService } from '@features/emojis/backend/jobs/ExportCustomEmojisProcessorService.js';
import { ExportNotesProcessorService } from '@features/notes/backend/jobs/ExportNotesProcessorService.js';
import { ExportClipsProcessorService } from '@features/collections/backend/jobs/ExportClipsProcessorService.js';
import { ExportFollowingProcessorService } from '@features/relationships/backend/jobs/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from '@features/relationships/backend/jobs/ExportMutingProcessorService.js';
import { ExportBlockingProcessorService } from '@features/relationships/backend/jobs/ExportBlockingProcessorService.js';
import { ExportUserListsProcessorService } from '@features/relationships/backend/jobs/ExportUserListsProcessorService.js';
import { ExportAntennasProcessorService } from '@features/timelines/backend/jobs/ExportAntennasProcessorService.js';
import { ImportFollowingProcessorService } from '@features/relationships/backend/jobs/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from '@features/relationships/backend/jobs/ImportMutingProcessorService.js';
import { ImportBlockingProcessorService } from '@features/relationships/backend/jobs/ImportBlockingProcessorService.js';
import { ImportUserListsProcessorService } from '@features/relationships/backend/jobs/ImportUserListsProcessorService.js';
import { ImportCustomEmojisProcessorService } from '@features/emojis/backend/jobs/ImportCustomEmojisProcessorService.js';
import { ImportAntennasProcessorService } from '@features/timelines/backend/jobs/ImportAntennasProcessorService.js';
import { DeleteAccountProcessorService } from '@features/users/backend/jobs/DeleteAccountProcessorService.js';
import { ExportFavoritesProcessorService } from '@features/collections/backend/jobs/ExportFavoritesProcessorService.js';
import { CleanRemoteFilesProcessorService } from '@features/drive/backend/jobs/CleanRemoteFilesProcessorService.js';
import { DeleteFileProcessorService } from '@features/drive/backend/jobs/DeleteFileProcessorService.js';
import { RelationshipProcessorService } from '@features/relationships/backend/jobs/RelationshipProcessorService.js';
import { TickChartsProcessorService } from '@features/statistics/backend/jobs/TickChartsProcessorService.js';
import { ResyncChartsProcessorService } from '@features/statistics/backend/jobs/ResyncChartsProcessorService.js';
import { CleanChartsProcessorService } from '@features/statistics/backend/jobs/CleanChartsProcessorService.js';
import { ArchiveAnnouncementProcessorService } from '@features/announcements/backend/jobs/ArchiveAnnouncementProcessorService.js';
import { CheckExpiredMutingsProcessorService } from '@features/relationships/backend/jobs/CheckExpiredMutingsProcessorService.js';
import { BakeBufferedReactionsProcessorService } from '@features/notes/backend/jobs/BakeBufferedReactionsProcessorService.js';
import { CleanProcessorService } from '@features/operations/backend/jobs/CleanProcessorService.js';
import { AggregateRetentionProcessorService } from '@features/statistics/backend/jobs/AggregateRetentionProcessorService.js';
import { CleanRemoteNotesProcessorService } from '@features/notes/backend/jobs/CleanRemoteNotesProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QUEUE, baseWorkerOptions } from './const.js';
import { InboxKeyDiscoveryDeferredError, inboxKeyDiscoveryBackoff } from '@features/federation/backend/utility/inbox-key-discovery.js';

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function httpRelatedBackoff(attemptsMade: number) {
	const baseDelay = 60 * 1000;	// 1min
	const maxBackoff = 8 * 60 * 60 * 1000;	// 8hours
	let backoff = (Math.pow(2, attemptsMade) - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	backoff += Math.round(backoff * Math.random() * 0.2);
	return backoff;
}

function getJobInfo(job: Bull.Job | undefined, increment = false): string {
	if (job == null) return '-';

	const age = Date.now() - job.timestamp;

	const formated = age > 60000 ? `${Math.floor(age / 1000 / 60)}m`
		: age > 10000 ? `${Math.floor(age / 1000)}s`
		: `${age}ms`;

	// onActiveとかonCompletedのattemptsMadeがなぜか0始まりなのでインクリメントする
	const currentAttempts = job.attemptsMade + (increment ? 1 : 0);
	const maxAttempts = job.opts.attempts ?? 0;

	return `id=${job.id} attempts=${currentAttempts}/${maxAttempts} age=${formated}`;
}

@Injectable()
export class QueueProcessorService implements OnApplicationShutdown {
	private logger: Logger;
	private systemQueueWorker: Bull.Worker;
	private dbQueueWorker: Bull.Worker;
	private deliverQueueWorker: Bull.Worker;
	private inboxQueueWorker: Bull.Worker;
	private userWebhookDeliverQueueWorker: Bull.Worker;
	private mcpStreamDeliverQueueWorker: Bull.Worker<McpStreamDeliverJobData>;
	private streamMaintenanceTimer: NodeJS.Timeout | undefined;
	private streamMaintenance: Promise<void> | undefined;
	private mcpAntennaDeliverQueueWorker: Bull.Worker;
	private systemWebhookDeliverQueueWorker: Bull.Worker;
	private relationshipQueueWorker: Bull.Worker;
	private objectStorageQueueWorker: Bull.Worker;
	private endedPollNotificationQueueWorker: Bull.Worker;
	private postScheduledNoteQueueWorker: Bull.Worker;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueLoggerService: QueueLoggerService,
		private telemetryService: TelemetryService,
		private userWebhookDeliverProcessorService: UserWebhookDeliverProcessorService,
		private systemWebhookDeliverProcessorService: SystemWebhookDeliverProcessorService,
		private endedPollNotificationProcessorService: EndedPollNotificationProcessorService,
		private postScheduledNoteProcessorService: PostScheduledNoteProcessorService,
		private deliverProcessorService: DeliverProcessorService,
		private inboxProcessorService: InboxProcessorService,
		private deleteDriveFilesProcessorService: DeleteDriveFilesProcessorService,
		private exportCustomEmojisProcessorService: ExportCustomEmojisProcessorService,
		private exportNotesProcessorService: ExportNotesProcessorService,
		private exportClipsProcessorService: ExportClipsProcessorService,
		private exportFavoritesProcessorService: ExportFavoritesProcessorService,
		private exportFollowingProcessorService: ExportFollowingProcessorService,
		private exportMutingProcessorService: ExportMutingProcessorService,
		private exportBlockingProcessorService: ExportBlockingProcessorService,
		private exportUserListsProcessorService: ExportUserListsProcessorService,
		private exportAntennasProcessorService: ExportAntennasProcessorService,
		private importFollowingProcessorService: ImportFollowingProcessorService,
		private importMutingProcessorService: ImportMutingProcessorService,
		private importBlockingProcessorService: ImportBlockingProcessorService,
		private importUserListsProcessorService: ImportUserListsProcessorService,
		private importCustomEmojisProcessorService: ImportCustomEmojisProcessorService,
		private importAntennasProcessorService: ImportAntennasProcessorService,
		private deleteAccountProcessorService: DeleteAccountProcessorService,
		private deleteFileProcessorService: DeleteFileProcessorService,
		private cleanRemoteFilesProcessorService: CleanRemoteFilesProcessorService,
		private relationshipProcessorService: RelationshipProcessorService,
		private tickChartsProcessorService: TickChartsProcessorService,
		private resyncChartsProcessorService: ResyncChartsProcessorService,
		private cleanChartsProcessorService: CleanChartsProcessorService,
		private aggregateRetentionProcessorService: AggregateRetentionProcessorService,
		private checkExpiredMutingsProcessorService: CheckExpiredMutingsProcessorService,
		private archiveAnnouncementProcessorService: ArchiveAnnouncementProcessorService,
		private bakeBufferedReactionsProcessorService: BakeBufferedReactionsProcessorService,
		private checkModeratorsActivityProcessorService: CheckModeratorsActivityProcessorService,
		private cleanProcessorService: CleanProcessorService,
		private cleanRemoteNotesProcessorService: CleanRemoteNotesProcessorService,
		@Inject('queue:mcpStreamDeliver') private mcpStreamDeliverQueue: McpStreamDeliverQueue,
		private mcpStreamDeliverProcessorService: McpStreamDeliverProcessorService,
	) {
		this.logger = this.queueLoggerService.logger;

		function renderError(e?: Error) {
			// 何故かeがundefinedで来ることがある
			if (!e) return '?';

			if (e instanceof Bull.UnrecoverableError || e.name === 'AbortError') {
				return `${e.name}: ${e.message}`;
			}

			return {
				stack: e.stack,
				message: e.message,
				name: e.name,
			};
		}

		function renderJob(job?: Bull.Job) {
			if (!job) return '?';

			return {
				name: job.name || undefined,
				info: getJobInfo(job),
				failedReason: job.failedReason || undefined,
				data: job.data,
			};
		}

		// 以下の各 Worker はジョブの実処理全体を worker span で囲む。
		//#region system
		{
			const processer = (job: Bull.Job) => {
				switch (job.name) {
					case 'tickCharts': return this.tickChartsProcessorService.process();
					case 'resyncCharts': return this.resyncChartsProcessorService.process();
					case 'cleanCharts': return this.cleanChartsProcessorService.process();
					case 'aggregateRetention': return this.aggregateRetentionProcessorService.process();
					case 'checkExpiredMutings': return this.checkExpiredMutingsProcessorService.process();
					case 'archiveAnnouncement': return this.archiveAnnouncementProcessorService.process(job as Bull.Job<ArchiveAnnouncementJobData>);
					case 'bakeBufferedReactions': return this.bakeBufferedReactionsProcessorService.process();
					case 'checkModeratorsActivity': return this.checkModeratorsActivityProcessorService.process();
					case 'clean': return this.cleanProcessorService.process();
					case 'cleanRemoteNotes': return this.cleanRemoteNotesProcessorService.process(job);
					default: throw new Error(`unrecognized job type ${job.name} for system`);
				}
			};
			const logger = this.logger.createSubLogger('system');

			this.systemQueueWorker = new Bull.Worker(QUEUE.SYSTEM, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: System: ' + job.name,
					() => processer(job) as Promise<void>,
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: System: ${job.name}: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.SYSTEM),
				autorun: false,
			});

			this.systemQueueWorker
				.on('active', (job) => logger.debug(`active id=${job.id}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) id=${job.id}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region db
		{
			const processer = (job: Bull.Job) => {
				switch (job.name) {
					case 'deleteDriveFiles': return this.deleteDriveFilesProcessorService.process(job);
					case 'exportCustomEmojis': return this.exportCustomEmojisProcessorService.process(job);
					case 'exportNotes': return this.exportNotesProcessorService.process(job);
					case 'exportClips': return this.exportClipsProcessorService.process(job);
					case 'exportFavorites': return this.exportFavoritesProcessorService.process(job);
					case 'exportFollowing': return this.exportFollowingProcessorService.process(job);
					case 'exportMuting': return this.exportMutingProcessorService.process(job);
					case 'exportBlocking': return this.exportBlockingProcessorService.process(job);
					case 'exportUserLists': return this.exportUserListsProcessorService.process(job);
					case 'exportAntennas': return this.exportAntennasProcessorService.process(job);
					case 'importFollowing': return this.importFollowingProcessorService.process(job);
					case 'importFollowingToDb': return this.importFollowingProcessorService.processDb(job);
					case 'importMuting': return this.importMutingProcessorService.process(job);
					case 'importBlocking': return this.importBlockingProcessorService.process(job);
					case 'importBlockingToDb': return this.importBlockingProcessorService.processDb(job);
					case 'importUserLists': return this.importUserListsProcessorService.process(job);
					case 'importCustomEmojis': return this.importCustomEmojisProcessorService.process(job);
					case 'importAntennas': return this.importAntennasProcessorService.process(job);
					case 'deleteAccount': return this.deleteAccountProcessorService.process(job);
					default: throw new Error(`unrecognized job type ${job.name} for db`);
				}
			};
			const logger = this.logger.createSubLogger('db');

			this.dbQueueWorker = new Bull.Worker(QUEUE.DB, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: DB: ' + job.name,
					() => processer(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: DB: ${job.name}: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.DB),
				autorun: false,
			});

			this.dbQueueWorker
				.on('active', (job) => logger.debug(`active id=${job.id}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) id=${job.id}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region deliver
		{
			const logger = this.logger.createSubLogger('deliver');

			this.deliverQueueWorker = new Bull.Worker(QUEUE.DELIVER, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: Deliver',
					() => this.deliverProcessorService.process(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) ${getJobInfo(job)} to=${job.data.to}`, { e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: Deliver: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.DELIVER),
				autorun: false,
				concurrency: this.config.deliverJobConcurrency ?? 128,
				limiter: {
					max: this.config.deliverJobPerSec ?? 128,
					duration: 1000,
				},
				settings: {
					backoffStrategy: httpRelatedBackoff,
				},
			});

			this.deliverQueueWorker
				.on('active', (job) => logger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region inbox
		{
			const logger = this.logger.createSubLogger('inbox');

			this.inboxQueueWorker = new Bull.Worker(QUEUE.INBOX, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: Inbox',
					() => this.inboxProcessorService.process(job),
					err => {
						if (err instanceof InboxKeyDiscoveryDeferredError && job.attemptsMade + 1 < (job.opts.attempts ?? 1) && inboxKeyDiscoveryBackoff(err, job) >= 0) {
							logger.info(`deferring Actor key discovery ${getJobInfo(job)}`);
							return;
						}
						const activityId = job.data.activity ? job.data.activity.id : 'none';
						logger.error(`failed(${err.name}: ${err.message}) ${getJobInfo(job)} activity=${activityId}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: Inbox: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.INBOX),
				autorun: false,
				concurrency: this.config.inboxJobConcurrency ?? 16,
				limiter: {
					max: this.config.inboxJobPerSec ?? 32,
					duration: 1000,
				},
				settings: {
					backoffStrategy: (attemptsMade, _type, error, job) => error instanceof InboxKeyDiscoveryDeferredError
						? inboxKeyDiscoveryBackoff(error, job)
						: httpRelatedBackoff(attemptsMade),
				},
			});

			this.inboxQueueWorker
				.on('active', (job) => logger.debug(`active ${getJobInfo(job, true)}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) ${getJobInfo(job, true)}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region user-webhook deliver
		{
			const logger = this.logger.createSubLogger('user-webhook');

			this.userWebhookDeliverQueueWorker = new Bull.Worker(QUEUE.USER_WEBHOOK_DELIVER, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: UserWebhookDeliver',
					() => this.userWebhookDeliverProcessorService.process(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) ${getJobInfo(job)} to=${job.data.to}`, { e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: UserWebhookDeliver: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.USER_WEBHOOK_DELIVER),
				autorun: false,
				concurrency: 64,
				limiter: {
					max: 64,
					duration: 1000,
				},
				settings: {
					backoffStrategy: httpRelatedBackoff,
				},
			});

			this.userWebhookDeliverQueueWorker
				.on('active', (job) => logger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		// Same processor/backoff; a distinct queue isolates antenna dedup retention.
		{
			const logger = this.logger.createSubLogger('mcp-antenna');
			this.mcpAntennaDeliverQueueWorker = new Bull.Worker(QUEUE.MCP_ANTENNA_DELIVER, job => runQueueJob(
				this.telemetryService, 'Queue: McpAntennaDeliver',
				() => this.userWebhookDeliverProcessorService.process(job),
				() => logger.error(`delivery failed ${getJobInfo(job)}`),
			), {
				...baseWorkerOptions(this.config, QUEUE.MCP_ANTENNA_DELIVER), autorun: false, concurrency: 64,
				limiter: { max: 64, duration: 1000 }, settings: { backoffStrategy: httpRelatedBackoff },
			});
			this.mcpAntennaDeliverQueueWorker.on('error', () => logger.error('queue error'))
				.on('stalled', jobId => logger.warn(`stalled id=${jobId}`));
		}

		// Concurrency is bounded per process; retries/concurrent workers can reorder.
		{
			const logger = this.logger.createSubLogger('mcp-stream');
			this.mcpStreamDeliverQueueWorker = new Bull.Worker<McpStreamDeliverJobData>(QUEUE.MCP_STREAM_DELIVER,
				job => runQueueJob(this.telemetryService, 'Queue: McpStreamDeliver',
					() => this.mcpStreamDeliverProcessorService.process(job),
					() => logger.error(`delivery failed id=${job.id}`)), {
					...baseWorkerOptions(this.config, QUEUE.MCP_STREAM_DELIVER), autorun: false, concurrency: 1,
					settings: { backoffStrategy: httpRelatedBackoff },
				});
			const release = async (job: Bull.Job<McpStreamDeliverJobData> | undefined) => {
				if (!job?.id) return;
				const state = await job.getState();
				if (state === 'completed' || state === 'failed') await releaseStreamJob(this.mcpStreamDeliverQueue, job.id, job.data.webhookId);
			};
			this.mcpStreamDeliverQueueWorker.on('completed', job => { void release(job).catch(() => logger.error('capacity release failed')); })
				.on('failed', job => { void release(job).catch(() => logger.error('capacity release failed')); })
				.on('error', () => logger.error('queue error'))
				.on('stalled', jobId => logger.warn(`stalled id=${jobId}`));
		}

		//#region system-webhook deliver
		{
			const logger = this.logger.createSubLogger('system-webhook');

			this.systemWebhookDeliverQueueWorker = new Bull.Worker(QUEUE.SYSTEM_WEBHOOK_DELIVER, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: SystemWebhookDeliver',
					() => this.systemWebhookDeliverProcessorService.process(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) ${getJobInfo(job)} to=${job.data.to}`, { e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: SystemWebhookDeliver: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.SYSTEM_WEBHOOK_DELIVER),
				autorun: false,
				concurrency: 16,
				limiter: {
					max: 16,
					duration: 1000,
				},
				settings: {
					backoffStrategy: httpRelatedBackoff,
				},
			});

			this.systemWebhookDeliverQueueWorker
				.on('active', (job) => logger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region relationship
		{
			const processer = (job: Bull.Job) => {
				switch (job.name) {
					case 'follow': return this.relationshipProcessorService.processFollow(job);
					case 'unfollow': return this.relationshipProcessorService.processUnfollow(job);
					case 'block': return this.relationshipProcessorService.processBlock(job);
					case 'unblock': return this.relationshipProcessorService.processUnblock(job);
					default: throw new Error(`unrecognized job type ${job.name} for relationship`);
				}
			};
			const logger = this.logger.createSubLogger('relationship');

			this.relationshipQueueWorker = new Bull.Worker(QUEUE.RELATIONSHIP, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: Relationship: ' + job.name,
					() => processer(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: Relationship: ${job.name}: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.RELATIONSHIP),
				autorun: false,
				concurrency: this.config.relationshipJobConcurrency ?? 16,
				limiter: {
					max: this.config.relationshipJobPerSec ?? 64,
					duration: 1000,
				},
			});

			this.relationshipQueueWorker
				.on('active', (job) => logger.debug(`active id=${job.id}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) id=${job.id}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region object storage
		{
			const processer = (job: Bull.Job) => {
				switch (job.name) {
					case 'deleteFile': return this.deleteFileProcessorService.process(job);
					case 'cleanRemoteFiles': return this.cleanRemoteFilesProcessorService.process(job);
					default: throw new Error(`unrecognized job type ${job.name} for objectStorage`);
				}
			};
			const logger = this.logger.createSubLogger('objectStorage');

			this.objectStorageQueueWorker = new Bull.Worker(QUEUE.OBJECT_STORAGE, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: ObjectStorage: ' + job.name,
					() => processer(job) as Promise<void>,
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: ObjectStorage: ${job.name}: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.OBJECT_STORAGE),
				autorun: false,
				concurrency: 16,
			});

			this.objectStorageQueueWorker
				.on('active', (job) => logger.debug(`active id=${job.id}`))
				.on('completed', (job, result) => logger.debug(`completed(${result}) id=${job.id}`))
				.on('error', (err: Error) => logger.error(`error ${err.name}: ${err.message}`, { e: renderError(err) }))
				.on('stalled', (jobId) => logger.warn(`stalled id=${jobId}`));
		}
		//#endregion

		//#region ended poll notification
		{
			const logger = this.logger.createSubLogger('ended-poll-notification');

			this.endedPollNotificationQueueWorker = new Bull.Worker(QUEUE.ENDED_POLL_NOTIFICATION, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: EndedPollNotification',
					() => this.endedPollNotificationProcessorService.process(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: EndedPollNotification: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.ENDED_POLL_NOTIFICATION),
				autorun: false,
			});
		}
		//#endregion

		//#region post scheduled note
		{
			const logger = this.logger.createSubLogger('post-scheduled-note');

			this.postScheduledNoteQueueWorker = new Bull.Worker(QUEUE.POST_SCHEDULED_NOTE, (job) => {
				return runQueueJob(
					this.telemetryService,
					'Queue: PostScheduledNote',
					() => this.postScheduledNoteProcessorService.process(job),
					err => {
						logger.error(`failed(${err.name}: ${err.message}) id=${job.id}`, { job: renderJob(job), e: renderError(err) });
						this.telemetryService.captureMessage(`Queue: PostScheduledNote: ${err.name}: ${err.message}`, {
							level: 'error',
							extra: { job, err },
						});
					},
				);
			}, {
				...baseWorkerOptions(this.config, QUEUE.POST_SCHEDULED_NOTE),
				autorun: false,
			});
		}
		//#endregion
	}

	@bindThis
	public async waitUntilReady(): Promise<void> {
		await Promise.all([
			this.systemQueueWorker, this.dbQueueWorker, this.deliverQueueWorker,
			this.inboxQueueWorker, this.userWebhookDeliverQueueWorker, this.mcpAntennaDeliverQueueWorker, this.mcpStreamDeliverQueueWorker, this.systemWebhookDeliverQueueWorker,
			this.relationshipQueueWorker, this.objectStorageQueueWorker,
			this.endedPollNotificationQueueWorker, this.postScheduledNoteQueueWorker,
		].map(worker => worker.waitUntilReady()));
	}

	@bindThis
	public async start(): Promise<void> {
		await reconcileStreamJobs(this.mcpStreamDeliverQueue);
		if (!this.streamMaintenanceTimer) {
			this.streamMaintenanceTimer = setInterval(() => {
				if (this.streamMaintenance) return;
				this.streamMaintenance = reconcileStreamJobs(this.mcpStreamDeliverQueue)
					.catch(() => { this.logger.error('MCP stream capacity reconciliation failed'); })
					.finally(() => { this.streamMaintenance = undefined; });
			}, 60000);
			this.streamMaintenanceTimer.unref();
		}
		await Promise.all([
			this.systemQueueWorker.run(),
			this.dbQueueWorker.run(),
			this.deliverQueueWorker.run(),
			this.inboxQueueWorker.run(),
			this.userWebhookDeliverQueueWorker.run(),
			this.mcpAntennaDeliverQueueWorker.run(),
			this.mcpStreamDeliverQueueWorker.run(),
			this.systemWebhookDeliverQueueWorker.run(),
			this.relationshipQueueWorker.run(),
			this.objectStorageQueueWorker.run(),
			this.endedPollNotificationQueueWorker.run(),
			this.postScheduledNoteQueueWorker.run(),
		]);
	}

	@bindThis
	public async stop(): Promise<void> {
		clearInterval(this.streamMaintenanceTimer);
		this.streamMaintenanceTimer = undefined;
		await this.streamMaintenance;
		await Promise.all([
			this.systemQueueWorker.close(),
			this.dbQueueWorker.close(),
			this.deliverQueueWorker.close(),
			this.inboxQueueWorker.close(),
			this.userWebhookDeliverQueueWorker.close(),
			this.mcpAntennaDeliverQueueWorker.close(),
			this.mcpStreamDeliverQueueWorker.close(),
			this.systemWebhookDeliverQueueWorker.close(),
			this.relationshipQueueWorker.close(),
			this.objectStorageQueueWorker.close(),
			this.endedPollNotificationQueueWorker.close(),
			this.postScheduledNoteQueueWorker.close(),
		]);
	}

	@bindThis
	public async onApplicationShutdown(signal?: string | undefined): Promise<void> {
		await this.stop();
	}
}
