/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { BackupError, decodeBackup } from './backup-codec.js';
import { readDriveOriginal } from './drive-original.js';
import { MaterialError } from './store.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { FukushuBackupStore } from './backup-store.js';

export class FukushuBackupInspector {
	constructor(
		private readonly files: Pick<DriveFilesRepository, 'findOneBy'>,
		private readonly storage: Pick<InternalStorageService, 'read'>,
		private readonly download: Pick<DownloadService, 'downloadUrl'>,
		private readonly store: Pick<FukushuBackupStore, 'inspect'>,
	) {}

	async inspect(ownerId: string, fileId: string) {
		const file = await this.files.findOneBy({ id: fileId, userId: ownerId });
		if (!file || file.userId !== ownerId) throw new MaterialError('NO_SUCH_FILE');
		if (file.userHost !== null || file.uri !== null || file.isLink || !/\.(json|fukushu)$/i.test(file.name)
			|| !Number.isSafeInteger(file.size) || file.size < 1) throw new BackupError('INVALID_BACKUP');
		if (file.size > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
		let bytes: Buffer;
		try {
			bytes = await readDriveOriginal(file, this.storage, this.download, MAX_BACKUP_BYTES);
			if (bytes.length !== file.size || createHash('md5').update(bytes).digest('hex') !== file.md5) throw new Error('Original changed');
		} catch { throw new BackupError('BACKUP_FAILED'); }
		return this.store.inspect(ownerId, decodeBackup(bytes));
	}
}
