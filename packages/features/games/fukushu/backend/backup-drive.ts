/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createReadStream, openAsBlob } from 'node:fs';
import { createHash } from 'node:crypto';
import { scanSourceArchive, MAX_SOURCE_ARCHIVE_BYTES } from '../shared/source-scan.js';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { BackupError, decodeBackup } from './backup-codec.js';
import { readDriveOriginal, withDriveOriginalPath } from './drive-original.js';
import { MaterialError } from './store.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { FukushuBackupStore } from './backup-store.js';

export type DriveSnapshot = { blob: Blob; md5: string; sha256: string };
export type WithSource = <T>(ownerId: string, fileId: string, use: (snapshot: DriveSnapshot) => Promise<T>, maximum?: number) => Promise<T>;

export class FukushuBackupInspector {
	constructor(
		private readonly files: Pick<DriveFilesRepository, 'findOneBy'>,
		private readonly storage: Pick<InternalStorageService, 'read'>,
		private readonly download: Pick<DownloadService, 'downloadUrl'>,
		private readonly store: Pick<FukushuBackupStore, 'inspect'>,
	) {}

	async inspect(ownerId: string, fileId: string) {
		return this.store.inspect(ownerId, decodeBackup(await this.read(ownerId, fileId)));
	}

	async inspectUpstream(ownerId: string, fileId: string) {
		return this.withSource(ownerId, fileId, snapshot => scanSourceArchive(snapshot.blob));
	}

	async sourceIdentity(ownerId: string, fileId: string) {
		const file = await this.ownedFile(ownerId, fileId, /\.(json|fukushu)$/i, MAX_SOURCE_ARCHIVE_BYTES);
		return { size: file.size, md5: file.md5 };
	}

	async withSource<T>(ownerId: string, fileId: string, use: (snapshot: DriveSnapshot) => Promise<T>, maximum = MAX_SOURCE_ARCHIVE_BYTES) {
		const file = await this.ownedFile(ownerId, fileId, /\.(json|fukushu)$/i, maximum);
		let usingSnapshot = false;
		try {
			return await withDriveOriginalPath(file, this.storage, this.download, file.size, async path => {
				const blob = await openAsBlob(path);
				if (blob.size !== file.size) throw new Error('Original size changed');
				const md5 = createHash('md5');
				const sha = createHash('sha256');
				for await (const chunk of createReadStream(path)) { md5.update(chunk); sha.update(chunk); }
				if (md5.digest('hex') !== file.md5) throw new Error('Original digest changed');
				usingSnapshot = true;
				return use({ blob, md5: file.md5, sha256: sha.digest('hex') });
			});
		} catch (error) {
			if (usingSnapshot) throw error;
			throw new BackupError('BACKUP_FAILED');
		}
	}

	async read(ownerId: string, fileId: string): Promise<Buffer> {
		return this.readOwned(ownerId, fileId, /\.(json|fukushu)$/i, MAX_BACKUP_BYTES);
	}

	async readGift(ownerId: string, fileId: string): Promise<Buffer> {
		return this.readOwned(ownerId, fileId, /\.(gift|txt)$/i, 256 * 1024);
	}

	private async ownedFile(ownerId: string, fileId: string, extension: RegExp, maximum: number) {
		const file = await this.files.findOneBy({ id: fileId, userId: ownerId });
		if (!file || file.userId !== ownerId) throw new MaterialError('NO_SUCH_FILE');
		if (file.userHost !== null || file.uri !== null || file.isLink || !extension.test(file.name)
			|| !Number.isSafeInteger(file.size) || file.size < 1) throw new BackupError('INVALID_BACKUP');
		if (file.size > maximum) throw new BackupError('BACKUP_TOO_LARGE');
		return file;
	}

	private async readOwned(ownerId: string, fileId: string, extension: RegExp, maximum: number): Promise<Buffer> {
		const file = await this.ownedFile(ownerId, fileId, extension, maximum);
		let bytes: Buffer;
		try {
			bytes = await readDriveOriginal(file, this.storage, this.download, maximum);
			if (bytes.length !== file.size || createHash('md5').update(bytes).digest('hex') !== file.md5) throw new Error('Original changed');
		} catch { throw new BackupError('BACKUP_FAILED'); }
		return bytes;
	}
}
