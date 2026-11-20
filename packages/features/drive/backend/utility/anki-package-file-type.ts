/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { open } from 'node:fs/promises';
import { promisify } from 'node:util';
import { constants, crc32, createInflateRaw, createZstdDecompress, inflateRaw } from 'node:zlib';
import type { FileHandle } from 'node:fs/promises';

const MAX_ARCHIVE_BYTES = 256 * 1024 ** 2;
const MAX_ENTRIES = 10_000;
const MAX_DIRECTORY_BYTES = 2 * 1024 ** 2;
const COLLECTION_PREFIX_BYTES = 64 * 1024;
const MAX_LEGACY_MAP_BYTES = 1024 ** 2;
const ZIP_ENTRY = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;
const ZIP_END = 0x06054b50;
const ZSTD = 0xfd2fb528;
const SQLITE = Buffer.from('SQLite format 3\0');
const mediaIndex = /^(?:0|[1-9]\d{0,9})$/;
const standardName = /^(?:meta|media|collection\.(?:anki2|anki21|anki21b|21b))$/;
const inflate = promisify(inflateRaw);

type Entry = { name: Buffer; offset: number; flags: number; method: number; crc: number; packed: number; expanded: number; start: number };

async function read(file: FileHandle, offset: number, length: number): Promise<Buffer> {
	const bytes = Buffer.alloc(length);
	for (let done = 0; done < length;) {
		const { bytesRead } = await file.read(bytes, done, length - done, offset + done);
		if (!bytesRead) throw new Error('Short archive read');
		done += bytesRead;
	}
	return bytes;
}

function entries(directory: Buffer, count: number) {
	const found = new Map<string, Entry>();
	let cursor = 0;
	for (let index = 0; index < count; index++) {
		if (cursor + 46 > directory.length || directory.readUInt32LE(cursor) !== ZIP_ENTRY) return null;
		const flags = directory.readUInt16LE(cursor + 8);
		const method = directory.readUInt16LE(cursor + 10);
		const crc = directory.readUInt32LE(cursor + 16);
		const packed = directory.readUInt32LE(cursor + 20);
		const expanded = directory.readUInt32LE(cursor + 24);
		const nameLength = directory.readUInt16LE(cursor + 28);
		const extraLength = directory.readUInt16LE(cursor + 30);
		const end = cursor + 46 + nameLength + extraLength;
		const offset = directory.readUInt32LE(cursor + 42);
		const attrs = directory.readUInt32LE(cursor + 38);
		// No split disks, data descriptors, encryption, links, ZIP64 or name-overriding extra fields.
		if (end > directory.length || nameLength > 20 || extraLength !== 0
			|| directory.readUInt16LE(cursor + 32) !== 0 || directory.readUInt16LE(cursor + 34) !== 0
			|| (attrs & 0x10) || ((attrs >>> 28) !== 0 && (attrs >>> 28) !== 8)
			|| (flags & ~0x0806) || (method !== 0 && method !== 8) || (method === 0 && ((flags & 6) || packed !== expanded))
			|| expanded > MAX_ARCHIVE_BYTES) return null;
		const bytes = directory.subarray(cursor + 46, cursor + 46 + nameLength);
		const name = bytes.toString('latin1');
		if ((!standardName.test(name) && !mediaIndex.test(name)) || found.has(name)) return null;
		found.set(name, { name: bytes, offset, flags, method, crc, packed, expanded, start: 0 });
		cursor = end;
	}
	return cursor === directory.length ? found : null;
}

async function validateLocalHeaders(file: FileHandle, list: Entry[], directoryStart: number) {
	let nextOffset = 0;
	for (const entry of list.sort((a, b) => a.offset - b.offset)) {
		// No gaps, overlap, prepended content, or unrelated local entries.
		const end = entry.offset + 30 + entry.name.length;
		if (entry.offset !== nextOffset || end > directoryStart) return false;
		const local = await read(file, entry.offset, 30 + entry.name.length);
		if (local.readUInt32LE(0) !== ZIP_LOCAL || local.readUInt16LE(6) !== entry.flags || local.readUInt16LE(8) !== entry.method
			|| local.readUInt32LE(14) !== entry.crc || local.readUInt32LE(18) !== entry.packed || local.readUInt32LE(22) !== entry.expanded
			|| local.readUInt16LE(26) !== entry.name.length || !local.subarray(30).equals(entry.name)) return false;
		const extraLength = local.readUInt16LE(28);
		if (extraLength !== 0) return false;
		entry.start = end + extraLength;
		nextOffset = entry.start + entry.packed;
		if (nextOffset > directoryStart) return false;
	}
	return nextOffset === directoryStart;
}

/** Only inspect a bounded prefix of the embedded database; never open SQLite. */
async function collectionHeader(file: FileHandle, entry: Entry, modern: boolean): Promise<Buffer> {
	if (modern && entry.method !== 0) return Buffer.alloc(0);
	if (!modern && entry.method === 0) return read(file, entry.start, Math.min(COLLECTION_PREFIX_BYTES, entry.packed));
	// A Zstd block is at most 128 KiB. Limit the window, input and output retention.
	const input = await read(file, entry.start, Math.min(entry.packed, modern ? 128 * 1024 + 32 : COLLECTION_PREFIX_BYTES));
	if (modern && (input.length < 6 || input.readUInt32LE(0) !== ZSTD)) return Buffer.alloc(0);
	const stream = modern
		? createZstdDecompress({ chunkSize: 4096, finishFlush: constants.ZSTD_e_flush, params: { [constants.ZSTD_d_windowLogMax]: 26 } })
		: createInflateRaw({ chunkSize: 4096, finishFlush: constants.Z_SYNC_FLUSH });
	try {
		return await new Promise<Buffer>((resolve, reject) => {
			const parts: Buffer[] = [];
			let total = 0;
			stream.on('data', (bytes: Buffer) => {
				const part = bytes.subarray(0, COLLECTION_PREFIX_BYTES - total);
				parts.push(part);
				total += part.length;
				if (total >= COLLECTION_PREFIX_BYTES) {
					stream.destroy();
					resolve(Buffer.concat(parts, total));
				}
			});
			stream.once('error', reject);
			stream.once('end', () => resolve(Buffer.concat(parts, total)));
			stream.end(input);
		});
	} finally {
		stream.destroy();
	}
}

function isSqliteHeader(bytes: Buffer): boolean {
	if (bytes.length < 100 || !bytes.subarray(0, SQLITE.length).equals(SQLITE)) return false;
	const pageSize = bytes.readUInt16BE(16);
	return (pageSize === 1 || (pageSize >= 512 && (pageSize & (pageSize - 1)) === 0))
		&& [1, 2].includes(bytes[18]) && [1, 2].includes(bytes[19])
		&& bytes.readUIntBE(21, 3) === 0x402020 && [1, 2, 3, 4].includes(bytes.readUInt32BE(44));
}

/**
 * Admission sniff, not a ZIP extractor or APKG import validator. Keep this
 * independent of decompression of bulk entries, SQLite queries and card parsing.
 */
export async function isAnkiPackageFile(path: string): Promise<boolean> {
	const file = await open(path, 'r');
	try {
		const size = (await file.stat()).size;
		if (size < 22 || size > MAX_ARCHIVE_BYTES) return false;
		const end = await read(file, size - 22, 22);
		const count = end.readUInt16LE(10);
		const length = end.readUInt32LE(12);
		const offset = end.readUInt32LE(16);
		if (end.readUInt32LE(0) !== ZIP_END || end.readUInt32LE(4) !== 0 || end.readUInt16LE(8) !== count
			|| end.readUInt16LE(20) !== 0 || count < 2 || count > MAX_ENTRIES || length < count * 46
			|| length > MAX_DIRECTORY_BYTES || offset + length !== size - 22) return false;
		const found = entries(await read(file, offset, length), count);
		if (!found || !await validateLocalHeaders(file, [...found.values()], offset)) return false;
		const media = found.get('media');
		if (!media) return false;
		const meta = found.get('meta');
		const anki2 = found.get('collection.anki2');
		const anki21 = found.get('collection.anki21');
		const latest = found.get('collection.anki21b') ?? found.get('collection.21b');
		if (found.has('collection.anki21b') && found.has('collection.21b')) return false;
		const version = latest ? 3 : anki21 ? 2 : 1;
		if ((latest && anki21) || (latest && !meta)) return false;
		if (meta) {
			if (meta.method !== 0 || meta.packed !== 2) return false;
			const marker = await read(file, meta.start, 2);
			if (marker[0] !== 8 || marker[1] !== version || crc32(marker) !== meta.crc) return false;
		}
		const collection = latest ?? anki21 ?? anki2;
		if (!collection) return false;
		const db = await collectionHeader(file, collection, version === 3);
		if (!isSqliteHeader(db)) return false;
		// Distinguish real Anki collections from arbitrary SQLite databases with
		// plausible filenames. Official exports put these schema records up front.
		const schemaPrefix = db.toString('latin1').toLowerCase();
		if (![/create\s+table\s+col[\s(]/, /create\s+table\s+notes[\s(]/, /create\s+table\s+cards[\s(]/, /create\s+table\s+revlog[\s(]/]
			.every(table => table.test(schemaPrefix))) return false;
		if (anki2 && anki2 !== collection && !isSqliteHeader(await collectionHeader(file, anki2, false))) return false;

		if (version === 3) {
			return media.method === 0 && media.packed >= 6 && (await read(file, media.start, 4)).readUInt32LE(0) === ZSTD;
		}
		// Legacy packages are often otherwise ordinary ZIPs. Check the complete,
		// bounded filename map and require it to describe exactly the numbered files.
		if (media.packed > MAX_LEGACY_MAP_BYTES || media.expanded > MAX_LEGACY_MAP_BYTES) return false;
		const stored = await read(file, media.start, media.packed);
		const map = media.method === 0 ? stored : await inflate(stored, { maxOutputLength: MAX_LEGACY_MAP_BYTES });
		if (map.length !== media.expanded || crc32(map) !== media.crc) return false;
		const manifest: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(map));
		if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return false;
		const names = Object.keys(manifest);
		return names.length === [...found.keys()].filter(name => mediaIndex.test(name)).length
			&& Object.entries(manifest).every(([index, name]) => mediaIndex.test(index) && found.has(index) && typeof name === 'string' && name.length > 0);
	} catch {
		return false;
	} finally {
		await file.close();
	}
}
