/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readDriveOriginal } from './drive-original.js';
import { buildAnkiTextMaterial } from './anki-text.js';
import { MaterialError } from './store.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import type { FukushuStore } from './store.js';

export const MAX_IMPORT_BYTES = 131_072;

/** Imports only the owner's recorded original, never a preview or a guessed storage key. */
export class FukushuDriveImporter {
	constructor(
		private readonly files: Pick<DriveFilesRepository, 'findOneBy'>,
		private readonly storage: Pick<InternalStorageService, 'read'>,
		private readonly download: Pick<DownloadService, 'downloadUrl'>,
		private readonly store: Pick<FukushuStore, 'create'>,
	) {}

	async import(ownerId: string, fileId: string) {
		// Avoid both downloading foreign content and disclosing whether its ID exists.
		const file = await this.files.findOneBy({ id: fileId, userId: ownerId });
		if (!file || file.userId !== ownerId) throw new MaterialError('NO_SUCH_FILE');
		if (file.userHost !== null || file.uri !== null || file.isLink
			|| !/\.(tsv|csv|txt)$/i.test(file.name)
			|| !Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_IMPORT_BYTES) throw new MaterialError('INVALID_MATERIAL');

		let source: string;
		try {
			const bytes = await readDriveOriginal(file, this.storage, this.download, MAX_IMPORT_BYTES);
			// MD5 checks that the persisted original has not changed at its URL. It is
			// not a content-safety guarantee; parsing and schema bounds still apply.
			if (bytes.length !== file.size || createHash('md5').update(bytes).digest('hex') !== file.md5) throw new Error('Original changed');
			source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
		} catch {
			// Filesystem paths, object URLs, access keys and remote responses stay private.
			throw new MaterialError('IMPORT_FAILED');
		}
		const material = buildAnkiTextMaterial(source, file.name);
		return this.store.create(ownerId, material, { deduplicateSource: true });
	}
}
