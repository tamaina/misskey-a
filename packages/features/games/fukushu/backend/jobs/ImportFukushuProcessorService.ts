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
import { StudyError } from '../study-store.js';
import type { DbQueue } from '@features/boot/backend/assembly/QueueModule.js';
import type { DriveFilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { DbImportFukushuData } from '@features/runtime/backend/queue/types.js';
import type { DataSource } from 'typeorm';
import type * as Bull from 'bullmq';

export async function sourceRestoreJob(queue: Pick<DbQueue, 'add' | 'getJob'>, store: Pick<FukushuUpstreamStore, 'restored'>,
	inspector: Pick<FukushuBackupInspector, 'sourceIdentity'>, ownerId: string, input: { fileId: string; requestId: string; statusOnly?: boolean }) {
	const { fileId, requestId } = input;
	if (await store.restored(ownerId, fileId, requestId)) return { status: 'completed' as const };
	const jobId = 'fukushu-' + createHash('sha256').update(JSON.stringify([ownerId, requestId])).digest('hex');
	let job = await queue.getJob(jobId);
	if (!job && !input.statusOnly) {
		const identity = await inspector.sourceIdentity(ownerId, fileId);
		await queue.add('importFukushu', { ownerId, fileId, requestId, ...identity } satisfies DbImportFukushuData,
			{ jobId, attempts: 1, removeOnComplete: { age: 604800, count: 1000 }, removeOnFail: { age: 604800, count: 1000 } });
		// A concurrent submitter may have won the job ID. Read the stored payload.
		job = await queue.getJob(jobId);
	}
	if (!job) return { status: 'missing' as const };
	if (job.name !== 'importFukushu' || job.data.ownerId !== ownerId || job.data.fileId !== fileId || job.data.requestId !== requestId) throw new StudyError('STUDY_CONFLICT');
	const state = await job.getState();
	if (state === 'failed') return { status: 'failed' as const };
	if (state === 'completed') return { status: await store.restored(ownerId, fileId, requestId) ? 'completed' as const : 'missing' as const };
	return { status: state === 'active' ? 'running' as const : 'waiting' as const };
}

@Injectable()
export class ImportFukushuProcessorService {
	private readonly store: FukushuUpstreamStore;

	constructor(@Inject(DI.db) db: DataSource, @Inject(DI.driveFilesRepository) files: DriveFilesRepository,
		@Inject(DI.usersRepository) private readonly users: UsersRepository, storage: InternalStorageService, download: DownloadService) {
		this.store = new FukushuUpstreamStore(db, new FukushuBackupInspector(files, storage, download, new FukushuBackupStore(db)));
	}

	async process(job: Bull.Job<DbImportFukushuData>) {
		const { ownerId, fileId, requestId, size, md5 } = job.data;
		const user = await this.users.findOneBy({ id: ownerId });
		if (!user || user.host !== null || user.isDeleted || user.isSuspended || user.movedToUri !== null) throw new Error('Import account unavailable');
		await this.store.restore(ownerId, fileId, requestId, { size, md5 });
	}
}
