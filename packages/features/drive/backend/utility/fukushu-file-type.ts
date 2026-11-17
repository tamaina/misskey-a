/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { open } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const FUKUSHU_MIME = 'application/x-fukushu-backup';
const magic = Buffer.from('FUKUSHU-BACKUP-1\n');
const stores = new Set(['settings', 'decks', 'questions', 'studyStates', 'reviewLogs', 'importSources', 'media', 'imports']);

/** Recognize the bounded binary envelope, not the safety of embedded HTML/APKG.
 * Delivery still uses octet-stream. Game-specific validation belongs to the importer.
 */
export async function isFukushuBackupFile(path: string): Promise<boolean> {
	const file = await open(path, 'r');
	try {
		const size = (await file.stat()).size;
		if (size < magic.length + 64 || size > 8 * 1024 * 1024) return false;
		const bytes = Buffer.alloc(size + 1);
		let read = 0;
		while (read < bytes.length) { const part = await file.read(bytes, read, bytes.length - read, read); if (!part.bytesRead) break; read += part.bytesRead; }
		if (read !== size || !bytes.subarray(0, magic.length).equals(magic)) return false;
		const end = size - 64;
		if (createHash('sha256').update(bytes.subarray(0, end)).digest('hex') !== bytes.subarray(end, size).toString('ascii')) return false;
		let offset = magic.length;
		let count = 0;
		let settings = 0;
		const seen = new Set<string>();
		while (offset < end) {
			if (++count > 20_000 || offset + 4 > end) return false;
			const length = bytes.readUInt32LE(offset); offset += 4;
			if (!length || offset + length > end) return false;
			const row = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset, offset + length)));
			offset += length;
			if (!row || !stores.has(row.store) || !row.value || typeof row.value !== 'object' || Array.isArray(row.value)) return false;
			const id = row.value.id ?? row.value.questionId;
			if (typeof id !== 'string' || seen.has(`${row.store}:${id}`)) return false;
			seen.add(`${row.store}:${id}`);
			if (row.store === 'settings') settings++;
			if (row.blobSize !== undefined) {
				if (!['media', 'importSources'].includes(row.store) || !Number.isSafeInteger(row.blobSize) || row.blobSize < 0 || row.blobSize > end - offset) return false;
				offset += row.blobSize;
			} else if (row.store === 'media') return false;
		}
		return offset === end && settings === 1;
	} catch { return false; } finally { await file.close(); }
}
