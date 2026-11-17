/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
	if (file.storedInternal) {
		const key = file.accessKey;
		if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || key === '.' || key === '..') throw new Error('Invalid original location');
		return readBounded(storage.read(key), maximum);
	}
	// A file can outlive the current bucket configuration. Its recorded URL is
	// the source of truth; the shared downloader retains SSRF/redirect checks.
	const url = new URL(file.url);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid original location');
	const directory = await mkdtemp(join(tmpdir(), 'fukushu-import-'));
	try {
		const path = join(directory, 'original');
		await download.downloadUrl(file.url, path, { maxSize: maximum });
		return await readBounded(createReadStream(path), maximum);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
