/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, open, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { DI } from '@/di-symbols.js';
import { FukushuUpstreamStore } from '../upstream-store.js';
import { FukushuBackupStore } from '../backup-store.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { DbExportFukushuData } from '@features/runtime/backend/queue/types.js';
import type { DataSource } from 'typeorm';
import type * as Bull from 'bullmq';

/** Shared by the real worker and its isolated lifecycle regression tests. */
export async function exportFukushuBackup(data: DbExportFukushuData, deps: {
	users: Pick<UsersRepository, 'findOneBy'>;
	store: Pick<FukushuBackupStore, 'export'>;
	upstream?: Pick<FukushuUpstreamStore, 'writeExport'>;
	drive: Pick<DriveService, 'addFile'>;
	notifications: Pick<NotificationService, 'createNotification'>;
}) {
	const user = await deps.users.findOneBy({ id: data.user.id });
	if (!user || user.host !== null || user.isDeleted) return;
	if (data.upstream && !deps.upstream) throw new Error('Upstream export unavailable');
	const ext = data.upstream ? 'fukushu' : 'json';
	const directory = await mkdtemp(join(tmpdir(), 'fukushu-backup-'));
	const path = join(directory, `backup.${ext}`);
	try {
		if (data.upstream && deps.upstream) {
			const output = await open(path, 'wx', 0o600);
			try { await deps.upstream.writeExport(user.id, bytes => output.writeFile(bytes)); } finally { await output.close(); }
		} else {
			await writeFile(path, await deps.store.export(user.id, data.deckId), { mode: 0o600 });
		}
		const current = await deps.users.findOneBy({ id: user.id });
		if (!current || current.isDeleted) return;
		const file = await deps.drive.addFile({ user: current, path, name: `fukushu-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`, ext, force: true });
		await deps.notifications.createNotification(user.id, 'exportCompleted', { exportedEntity: 'fukushu', fileId: file.id });
	} finally { await rm(directory, { recursive: true, force: true }); }
}

@Injectable()
export class ExportFukushuProcessorService {
	constructor(
		@Inject(DI.db) private readonly db: DataSource,
		@Inject(DI.usersRepository) private readonly users: UsersRepository,
		private readonly drive: DriveService,
		private readonly notifications: NotificationService,
	) {}

	async process(job: Bull.Job<DbExportFukushuData>): Promise<void> {
		await exportFukushuBackup(job.data, { users: this.users, store: new FukushuBackupStore(this.db), upstream: new FukushuUpstreamStore(this.db, { withSource: async () => { throw new Error('Export does not read Drive'); } }), drive: this.drive, notifications: this.notifications });
		await job.updateProgress(100);
	}
}
