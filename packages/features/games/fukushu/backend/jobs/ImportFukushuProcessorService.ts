/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { DI } from '@/di-symbols.js';
import { FukushuBackupInspector } from '../backup-drive.js';
import { FukushuBackupStore } from '../backup-store.js';
import { FukushuUpstreamStore } from '../upstream-store.js';
import { FukushuStore } from '../store.js';
import { decodeStagedApkg } from './apkg-process.mjs';
import { StudyError } from '../study-store.js';
import type { DbQueue } from '@features/boot/backend/assembly/QueueModule.js';
import type { DriveFilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { DbImportFukushuData } from '@features/runtime/backend/queue/types.js';
import type { DataSource } from 'typeorm';
import type * as Bull from 'bullmq';

export async function sourceRestoreJob(queue: Pick<DbQueue, 'add' | 'getJob'>, store: Pick<FukushuUpstreamStore, 'restored'>,
	inspector: Pick<FukushuBackupInspector, 'sourceIdentity'>, ownerId: string, input: { fileId: string; requestId: string; format?: 'anki-apkg'; statusOnly?: boolean }) {
	const { fileId, requestId, format } = input;
	if (await store.restored(ownerId, fileId, requestId, format)) return { status: 'completed' as const };
	const jobId = 'fukushu-' + createHash('sha256').update(JSON.stringify([ownerId, requestId])).digest('hex');
	let job = await queue.getJob(jobId);
	if (!job && !input.statusOnly) {
		const identity = await inspector.sourceIdentity(ownerId, fileId, format);
		await queue.add('importFukushu', { ownerId, fileId, requestId, ...(format ? { format } : {}), ...identity } satisfies DbImportFukushuData,
			{ jobId, attempts: 1, removeOnComplete: { age: 604800, count: 1000 }, removeOnFail: { age: 604800, count: 1000 } });
		// A concurrent submitter may have won the job ID. Read the stored payload.
		job = await queue.getJob(jobId);
	}
	if (!job) return { status: 'missing' as const };
	if (job.name !== 'importFukushu' || job.data.ownerId !== ownerId || job.data.fileId !== fileId || job.data.requestId !== requestId || job.data.format !== format) throw new StudyError('STUDY_CONFLICT');
	const state = await job.getState();
	if (state === 'failed') {
		const reason = format && (job.failedReason === 'APKG_UNSUPPORTED' ? 'unsupported' as const
			: job.failedReason === 'APKG_INVALID' || job.failedReason === 'INVALID_BACKUP' ? 'invalid' as const : undefined);
		return { status: 'failed' as const, ...(reason ? { reason } : {}) };
	}
	if (state === 'completed') return { status: await store.restored(ownerId, fileId, requestId, format) ? 'completed' as const : 'missing' as const };
	return { status: state === 'active' ? 'running' as const : 'waiting' as const };
}

type ApkgJobDependencies = {
	restored: FukushuUpstreamStore['restored'];
	withApkg: FukushuBackupInspector['withApkg'];
	decode: typeof decodeStagedApkg;
	commit: FukushuStore['createFromApkg'];
	progress(value: number): Promise<void>;
};

export async function processApkgJob(data: DbImportFukushuData, deps: ApkgJobDependencies) {
	const { ownerId, fileId, requestId, size, md5 } = data;
	if (await deps.restored(ownerId, fileId, requestId, 'anki-apkg')) return;
	const identity = { size, md5 };
	await deps.progress(10);
	const material = await deps.withApkg(ownerId, fileId, identity, async snapshot => {
		await deps.progress(30);
		return deps.decode(snapshot);
	});
	await deps.progress(80);
	await deps.commit(ownerId, fileId, requestId, identity, material);
}

@Injectable()
export class ImportFukushuProcessorService {
	private readonly store: FukushuUpstreamStore;
	private readonly inspector: FukushuBackupInspector;
	private readonly native: FukushuStore;

	constructor(@Inject(DI.db) db: DataSource, @Inject(DI.driveFilesRepository) files: DriveFilesRepository,
		@Inject(DI.usersRepository) private readonly users: UsersRepository, storage: InternalStorageService, download: DownloadService) {
		this.inspector = new FukushuBackupInspector(files, storage, download, new FukushuBackupStore(db));
		this.store = new FukushuUpstreamStore(db, this.inspector);
		this.native = new FukushuStore(db);
	}

	async process(job: Bull.Job<DbImportFukushuData>) {
		const { ownerId, fileId, requestId, size, md5 } = job.data;
		const user = await this.users.findOneBy({ id: ownerId });
		if (!user || user.host !== null || user.isDeleted || user.isSuspended || user.movedToUri !== null) throw new Error('Import account unavailable');
		if (job.data.format === 'anki-apkg') {
			await processApkgJob(job.data, {
				restored: this.store.restored.bind(this.store), withApkg: this.inspector.withApkg.bind(this.inspector),
				decode: decodeStagedApkg, commit: this.native.createFromApkg.bind(this.native), progress: value => job.updateProgress(value),
			});
		} else {
			await this.store.restore(ownerId, fileId, requestId, { size, md5 });
		}
	}
}
