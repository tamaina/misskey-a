/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { implement } from '@orpc/server';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { assertApiAuthorization, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { FukushuBackupRestorer } from './backup-restore.js';
import { FukushuBackupInspector } from './backup-drive.js';
import { FukushuBackupStore } from './backup-store.js';
import { backupErrors } from './backup.contract.js';
import { BackupError } from './backup-codec.js';
import { fukushuContract, materialErrors } from './material.contract.js';
import { FukushuStore, MaterialError } from './store.js';
import { FukushuStudyStore, StudyError } from './study-store.js';
import { studyErrors } from './study.contract.js';
import { FukushuDriveImporter } from './drive-import.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';

async function invoke<T>(operation: () => Promise<T>): Promise<T> {
	try { return await operation(); } catch (error) {
		if (error instanceof MaterialError) throw apiError(materialErrors[error.code]);
		if (error instanceof BackupError) throw apiError(backupErrors[error.code]);
		if (error instanceof StudyError) throw apiError(studyErrors[error.code]);
		throw error;
	}
}

export function createFukushuRouter(store: Pick<FukushuStore, 'create' | 'show' | 'list' | 'update' | 'archive' | 'updateCardExplanation' | 'listCardVersions' | 'showCardVersion'>, importer?: Pick<FukushuDriveImporter, 'import'>, study?: Pick<FukushuStudyStore, 'queue' | 'review' | 'history'>, backup?: { restorer?: Pick<FukushuBackupRestorer, 'restore'>; store: Pick<FukushuBackupStore, 'assertOwned'>; inspector: Pick<FukushuBackupInspector, 'inspect'>; enqueue(ownerId: string, deckId: string): Promise<void> }) {
	const procedure = createApiProcedure<MiLocalUser>();
	const principal = requirePrincipal<MiLocalUser>();
	const studyStore = () => { if (!study) throw new StudyError('STUDY_UNAVAILABLE'); return study; };
	return implement(fukushuContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		backupRestore: procedure(fukushuContract.backupRestore).use(principal).handler(({ input, context }) => invoke(async () => {
			if (!backup?.restorer) throw new BackupError('BACKUP_FAILED');
			return backup.restorer.restore(context.principal.id, input.fileId);
		})),
		backupExport: procedure(fukushuContract.backupExport).use(principal).handler(({ input, context }) => invoke(async () => {
			if (!backup) throw new BackupError('BACKUP_FAILED');
			await backup.store.assertOwned(context.principal.id, input.id);
			await backup.enqueue(context.principal.id, input.id);
		})),
		backupInspect: procedure(fukushuContract.backupInspect).use(principal).handler(({ input, context }) => invoke(async () => {
			if (!backup) throw new BackupError('BACKUP_FAILED');
			return backup.inspector.inspect(context.principal.id, input.fileId);
		})),
		studyQueue: procedure(fukushuContract.studyQueue).use(principal).handler(({ input, context }) => invoke(() => studyStore().queue(context.principal.id, input.id))),
		studyReview: procedure(fukushuContract.studyReview).use(principal).handler(({ input, context }) => invoke(() => studyStore().review(context.principal.id, input))),
		studyHistory: procedure(fukushuContract.studyHistory).use(principal).handler(({ input, context }) => invoke(() => studyStore().history(context.principal.id, input.id, { beforeId: input.beforeId, limit: input.limit }))),
		list: procedure(fukushuContract.list).use(principal).handler(({ input, context }) => invoke(() => store.list(context.principal.id, { archived: input.archived }))),
		import: procedure(fukushuContract.import).use(principal).handler(async ({ input, context }) => {
			await assertApiAuthorization({ name: 'fukushu/materials/import', requireCredential: true, kind: 'read:drive' }, context);
			return invoke(() => {
				if (!importer) throw new MaterialError('IMPORT_FAILED');
				return importer.import(context.principal.id, input.fileId);
			});
		}),
		update: procedure(fukushuContract.update).use(principal).handler(({ input, context }) => invoke(() => store.update(context.principal.id, input.id, input.expectedRevision, input.name, input.description))),
		updateCardExplanation: procedure(fukushuContract.updateCardExplanation).use(principal).handler(({ input, context }) => invoke(() => store.updateCardExplanation(context.principal.id, input.id, input.questionId, input.expectedRevision, input.explanation))),
		listCardVersions: procedure(fukushuContract.listCardVersions).use(principal).handler(({ input, context }) => invoke(() => store.listCardVersions(context.principal.id, input.id, input.questionId, { before: input.before, limit: input.limit }))),
		showCardVersion: procedure(fukushuContract.showCardVersion).use(principal).handler(({ input, context }) => invoke(() => store.showCardVersion(context.principal.id, input.id, input.questionId, input.version))),
		archive: procedure(fukushuContract.archive).use(principal).handler(({ input, context }) => invoke(() => store.archive(context.principal.id, input.id, input.expectedRevision, input.archived))),
		create: procedure(fukushuContract.create).use(principal).handler(({ input, context }) => invoke(() => store.create(context.principal.id, input.material))),
		show: procedure(fukushuContract.show).use(principal).handler(({ input, context }) => invoke(() => store.show(context.principal.id, input.id))),
	});
}

@Injectable()
export class FukushuApiProvider {
	private router: ReturnType<typeof createFukushuRouter> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		if (!this.router) {
			const store = new FukushuStore(this.moduleRef.get(DI.db, { strict: false }));
			const importer = new FukushuDriveImporter(
				this.moduleRef.get(DI.driveFilesRepository, { strict: false }),
				this.moduleRef.get(InternalStorageService, { strict: false }),
				this.moduleRef.get(DownloadService, { strict: false }),
				store,
			);
			const backupStore = new FukushuBackupStore(this.moduleRef.get(DI.db, { strict: false }));
			const inspector = new FukushuBackupInspector(this.moduleRef.get(DI.driveFilesRepository, { strict: false }), this.moduleRef.get(InternalStorageService, { strict: false }), this.moduleRef.get(DownloadService, { strict: false }), backupStore);
			this.router = createFukushuRouter(store, importer, new FukushuStudyStore(this.moduleRef.get(DI.db, { strict: false })), {
				store: backupStore,
				inspector,
				restorer: new FukushuBackupRestorer(this.moduleRef.get(DI.db, { strict: false }), inspector),
				enqueue: async (ownerId, deckId) => { await this.moduleRef.get(QueueService, { strict: false }).createExportFukushuJob({ id: ownerId }, deckId); },
			});
		}
		return this.router;
	}
}
