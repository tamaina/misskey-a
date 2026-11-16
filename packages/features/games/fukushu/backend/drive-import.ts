/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { DriveFilesRepository, MiDriveFile } from '@features/persistence/backend/repositories/models.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { buildAnkiTextMaterial } from './anki-text.js';
import { MaterialError } from './store.js';
import type { FukushuStore } from './store.js';

export const MAX_IMPORT_BYTES = 131_072;

async function readBounded(stream: Readable): Promise<Buffer> {
	const chunks: Buffer[] = [];
	let size = 0;
	try {
		for await (const chunk of stream) {
			const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			size += bytes.length;
			if (size > MAX_IMPORT_BYTES) throw new MaterialError('IMPORT_FAILED');
			chunks.push(bytes);
		}
		return Buffer.concat(chunks, size);
	} finally {
		stream.destroy();
	}
}

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
			const bytes = await this.original(file);
			// MD5 checks that the persisted original has not changed at its URL. It is
			// not a content-safety guarantee; parsing and schema bounds still apply.
			if (bytes.length !== file.size || createHash('md5').update(bytes).digest('hex') !== file.md5) throw new Error('Original changed');
			source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
		} catch {
			// Filesystem paths, object URLs, access keys and remote responses stay private.
			throw new MaterialError('IMPORT_FAILED');
		}
		const material = buildAnkiTextMaterial(source, file.name);
		return this.store.create(ownerId, material, { deduplicateSource: true });
	}

	private async original(file: MiDriveFile): Promise<Buffer> {
		if (file.storedInternal) {
			const key = file.accessKey;
			if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || key === '.' || key === '..') throw new MaterialError('IMPORT_FAILED');
			return readBounded(this.storage.read(key));
		}
		// A file can outlive the current bucket configuration. Its recorded URL is
		// the source of truth; the shared downloader retains SSRF/redirect checks.
		const url = new URL(file.url);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new MaterialError('IMPORT_FAILED');
		const directory = await mkdtemp(join(tmpdir(), 'fukushu-import-'));
		try {
			const path = join(directory, 'original');
			await this.download.downloadUrl(file.url, path, { maxSize: MAX_IMPORT_BYTES });
			return await readBounded(createReadStream(path));
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	}
}
