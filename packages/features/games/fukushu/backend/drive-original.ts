/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import type { MiDriveFile } from '@features/persistence/backend/repositories/models.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';

async function readBounded(stream: Readable, maximum: number): Promise<Buffer> {
	const chunks: Buffer[] = [];
	let size = 0;
	try {
		for await (const chunk of stream) {
			const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			size += bytes.length;
			if (size > maximum) throw new Error('Original exceeds the size bound');
			chunks.push(bytes);
		}
		return Buffer.concat(chunks, size);
	} finally {
		stream.destroy();
	}
}

/** Read a previously owner-checked Drive original using its recorded location. */
export async function readDriveOriginal(file: MiDriveFile, storage: Pick<InternalStorageService, 'read'>, download: Pick<DownloadService, 'downloadUrl'>, maximum: number): Promise<Buffer> {
	if (file.storedInternal) return readBounded(storage.read(originalKey(file)), maximum);
	return withDriveOriginalPath(file, storage, download, maximum, path => readBounded(createReadStream(path), maximum));
}

function originalKey(file: MiDriveFile) {
	const key = file.accessKey;
	if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || key === '.' || key === '..') throw new Error('Invalid original location');
	return key;
}

/** A private stable file lets the importer validate before holding the owner transaction. */
export async function withDriveOriginalPath<T>(file: MiDriveFile, storage: Pick<InternalStorageService, 'read'>, download: Pick<DownloadService, 'downloadUrl'>, maximum: number, use: (path: string) => Promise<T>): Promise<T> {
	const directory = await mkdtemp(join(tmpdir(), 'fukushu-original-'));
	try {
		const path = join(directory, 'original');
		if (file.storedInternal) {
			let size = 0;
			const bound = new Transform({ transform(chunk, _encoding, callback) {
				size += chunk.length;
				if (size > maximum) callback(new Error('Original exceeds the size bound'));
				else callback(null, chunk);
			} });
			await pipeline(storage.read(originalKey(file)), bound, createWriteStream(path, { flags: 'wx', mode: 0o600 }));
		} else {
			const url = new URL(file.url);
			if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid original location');
			await download.downloadUrl(file.url, path, { maxSize: maximum });
		}
		return await use(path);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
