/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Queue, Worker } from 'bullmq';
import { DI } from '@/di-symbols.js';
import { MailStore } from '../mail/store.js';
import { S3PrivateMailStorage } from '../mail/storage.js';
import { resolveUserMailConfig } from '../mail/settings.js';
import { createMailIngress } from '../mail/http-ingress.js';
import { parseMailIsolated } from '../mail/isolated-parser.mjs';
import type { UserMailSettings } from '../mail/settings.js';
import type { Config } from '@/config.js';
import type { DataSource } from 'typeorm';
import type { Server } from 'node:http';

@Injectable()
export class UserMailRuntime {
	public readonly settings: UserMailSettings | null;
	public readonly store: MailStore | null;
	public readonly storage: S3PrivateMailStorage | null;
	private readonly s3: S3Client | null;
	private privacy: Promise<void> | null = null;
	private ingress?: Server;
	private parseQueue?: Queue;
	private submitQueue?: Queue;
	private workers: Worker[] = [];
	private nextCollectionAt = 0;
	private timer?: ReturnType<typeof setInterval>;
	private tickRunning?: Promise<void>;
	private submissionProcessor?: (id: string) => Promise<void>;
	private submissionDispatcher?: () => Promise<void>;

	constructor(@Inject(DI.config) private readonly config: Config, @Inject(DI.db) private readonly db: DataSource) {
		this.settings = resolveUserMailConfig(config.userMail);
		const s = this.settings;
		// Construction performs no I/O, opens no listeners/queues and does not touch S3 credentials.
		this.s3 = s ? new S3Client({ region: s.s3.region, endpoint: s.s3.endpoint, forcePathStyle: s.s3.forcePathStyle }) : null;
		this.storage = s && this.s3 ? new S3PrivateMailStorage(this.s3, s.s3.bucket, s.maxBytes) : null;
		this.store = s && this.storage ? new MailStore(db, this.storage, s.domain, BigInt(s.quotaBytes), s.maxBytes, BigInt(s.spoolBytes), Boolean(s.forwarding?.enabled && s.forwarding.trustedIngress && s.forwarding.loopChecked && s.forwarding.forwardingRelay)) : null;
	}

	async ready(): Promise<void> {
		if (!this.storage) throw new Error('USER_MAIL_DISABLED');
		this.privacy ??= this.storage.verifyPrivacy().catch(error => { this.privacy = null; throw error; });
		await this.privacy;
	}

	async getContext() {
		await this.ready();
		return { store: this.store!, storage: this.storage!, settings: this.settings! };
	}

	setSubmissionProcessor(handler: (id: string) => Promise<void>) { this.submissionProcessor = handler; }
	setSubmissionDispatcher(handler: () => Promise<void>) { this.submissionDispatcher = handler; }
	async enqueueSubmission(id: string): Promise<void> {
		if (!this.submitQueue) throw new Error('MAIL_QUEUE_NOT_STARTED');
		await this.submitQueue.add('submit', { id }, { jobId: id, removeOnComplete: true, removeOnFail: true });
	}

	async start(role: 'server' | 'queue'): Promise<void> {
		if (!this.settings) return;
		await this.ready();
		if (role === 'server') {
			this.ingress = createMailIngress(this.settings, this.store!);
			await new Promise<void>((resolve, reject) => {
				this.ingress!.once('error', reject);
				this.ingress!.listen({ port: this.settings!.ingress.port ?? 8025, host: this.settings!.ingress.host ?? '127.0.0.1', reusePort: true }, () => {
					this.ingress!.removeListener('error', reject); resolve();
				});
			});
			return;
		}
		const redis = this.config.redisForJobQueue;
		const connection = { ...redis, password: redis.pass, keyPrefix: undefined, maxRetriesPerRequest: null };
		const options = { connection, prefix: `${redis.prefix ?? 'misskey'}-user-mail` };
		this.parseQueue = new Queue('parse', options);
		this.submitQueue = new Queue('submit', options);
		this.parseQueue.on('error', () => {});
		this.submitQueue.on('error', () => {});
		this.workers = [
			new Worker('parse', async job => {
				const id = job.data?.id;
				if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return;
				const [row] = await this.db.query(`SELECT d."userId" FROM "mail_delivery" d
					WHERE d."id"=$1 AND d."deletedAt" IS NULL AND d."localStored" AND d."parseState"='pending'`, [id]);
				if (!row) return;
				// Transient storage/DB failures remain pending. Only actual parser failure is terminal.
				const raw = await this.store!.readRaw(row.userId, id);
				let parsed: Record<string, unknown> | null;
				try { parsed = await parseMailIsolated(raw); } catch { parsed = null; }
				await this.store!.completeParse(id, parsed);
			}, { ...options, concurrency: 1 }),
			new Worker('submit', async job => {
				if (typeof job.data?.id !== 'string' || !/^[a-f0-9-]{36}$/.test(job.data.id)) return;
				if (!this.submissionProcessor) throw new Error('MAIL_SUBMISSION_HANDLER_UNAVAILABLE');
				await this.submissionProcessor(job.data.id);
			}, { ...options, concurrency: 1 }),
		];
		for (const worker of this.workers) worker.on('error', () => {});
		await Promise.all([...this.workers.map(worker => worker.waitUntilReady()), this.parseQueue.waitUntilReady(), this.submitQueue.waitUntilReady()]);
		const tick = () => {
			this.tickRunning ??= this.dispatch().catch(() => { /* DB outboxes retry next tick; do not log mail or credentials. */ }).finally(() => { this.tickRunning = undefined; });
		};
		tick();
		this.timer = setInterval(tick, 5000);
		this.timer.unref();
	}

	private async dispatch(): Promise<void> {
		// DB is canonical. Redis loss, failed/stalled/completed jobs are reconciled on every tick.
		const rows = await this.db.query(`SELECT o."deliveryId" FROM "mail_outbox" o JOIN "mail_delivery" d ON d."id"=o."deliveryId"
			WHERE o."kind"='parse' AND d."parseState"='pending' AND d."deletedAt" IS NULL AND d."localStored" ORDER BY o."createdAt" LIMIT 100`);
		for (const row of rows) await this.parseQueue!.add('parse', { id: row.deliveryId }, { jobId: row.deliveryId, removeOnComplete: true, removeOnFail: true });
		await this.submissionDispatcher?.();
		if (Date.now() >= this.nextCollectionAt) {
			// Advance before execution: even a storage outage cannot cause five-second collection retries.
			this.nextCollectionAt = Date.now() + 60 * 60 * 1000;
			await this.store!.collect(100);
		}
	}

	async stop(): Promise<void> {
		if (this.timer) clearInterval(this.timer);
		if (this.ingress?.listening) await new Promise<void>((resolve, reject) => this.ingress!.close(error => error ? reject(error) : resolve()));
		await this.tickRunning;
		await Promise.all(this.workers.map(worker => worker.close()));
		await Promise.all([this.parseQueue?.close(), this.submitQueue?.close()]);
		this.s3?.destroy();
	}
}
