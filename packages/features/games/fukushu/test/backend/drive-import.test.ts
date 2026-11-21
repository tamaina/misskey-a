/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { FukushuDriveImporter, MAX_IMPORT_BYTES } from '../../backend/drive-import.js';
import { buildAnkiTextMaterial } from '../../backend/anki-text.js';
import { MaterialError } from '../../backend/store.js';
import { material } from './fixture.js';
import type { DriveFilesRepository, MiDriveFile } from '@features/persistence/backend/repositories/models.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import type { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import type { FukushuStore } from '../../backend/store.js';

vi.mock('../../backend/anki-text.js', () => ({ buildAnkiTextMaterial: vi.fn() }));

const bytes = Buffer.from('#html:false\nfront\tback\n');

function file(overrides: Partial<MiDriveFile> = {}) {
	return mockDeep<MiDriveFile>({ id: 'file1', userId: 'alice', userHost: null, uri: null, isLink: false, storedInternal: true,
		name: 'cards.tsv', size: bytes.length, md5: createHash('md5').update(bytes).digest('hex'),
		accessKey: 'original.tsv', url: 'https://old-bucket.example/original.tsv', ...overrides });
}

function fixture(overrides: Partial<MiDriveFile> = {}) {
	const files = mockDeep<DriveFilesRepository>();
	const storage = mockDeep<InternalStorageService>();
	const download = mockDeep<DownloadService>();
	const store = mockDeep<FukushuStore>();
	files.findOneBy.mockResolvedValue(file(overrides));
	storage.read.mockReturnValue(Readable.from([bytes]) as ReturnType<InternalStorageService['read']>);
	store.create.mockResolvedValue(material());
	return { files, storage, download, store, importer: new FukushuDriveImporter(files, storage, download, store) };
}

beforeEach(() => {
	vi.mocked(buildAnkiTextMaterial).mockReset().mockReturnValue(material());
});

describe('Fukushu owned Drive original import', () => {
	test('selects owner before I/O, reads original key and requests atomic source deduplication', async () => {
		const f = fixture();
		expect(await f.importer.import('alice', 'file1')).toEqual(material());
		expect(f.files.findOneBy).toHaveBeenCalledWith({ id: 'file1', userId: 'alice' });
		expect(f.storage.read).toHaveBeenCalledWith('original.tsv');
		expect(f.download.downloadUrl).not.toHaveBeenCalled();
		expect(buildAnkiTextMaterial).toHaveBeenCalledWith(bytes.toString(), 'cards.tsv');
		expect(f.store.create).toHaveBeenCalledWith('alice', material(), { deduplicateSource: true });
	});
	test.each([null, file({ userId: 'bob' })])('foreign and missing files have the same unavailable error (%#)', async value => {
		const f = fixture(); f.files.findOneBy.mockResolvedValue(value);
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'NO_SUCH_FILE' });
		expect(f.storage.read).not.toHaveBeenCalled();
		expect(f.download.downloadUrl).not.toHaveBeenCalled();
		expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
	});
	test.each([
		{ isLink: true }, { uri: 'https://remote.example/file' }, { userHost: 'remote.example' },
		{ name: 'cards.apkg' }, { name: 'backup.fukushu' }, { size: 0 }, { size: MAX_IMPORT_BYTES + 1 },
	])('rejects unsupported remote or oversized records before I/O (%#)', async overrides => {
		const f = fixture(overrides);
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'INVALID_MATERIAL' });
		expect(f.storage.read).not.toHaveBeenCalled();
		expect(f.download.downloadUrl).not.toHaveBeenCalled();
	});
	test.each([null, '..', '.', '../original.tsv', '/original.tsv', 'a\\b', 'a\0b'])('rejects unsafe or missing original keys (%#)', async accessKey => {
		const f = fixture({ accessKey });
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'IMPORT_FAILED' });
		expect(f.storage.read).not.toHaveBeenCalled();
	});
	test.each([{ size: bytes.length - 1 }, { md5: '0'.repeat(32) }])('does not parse or save changed content (%#)', async overrides => {
		const f = fixture(overrides);
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'IMPORT_FAILED' });
		expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
		expect(f.store.create).not.toHaveBeenCalled();
	});
	test('rejects malformed UTF-8 even when recorded size and hash match', async () => {
		const invalid = Buffer.from([0xc3, 0x28]);
		const f = fixture({ size: invalid.length, md5: createHash('md5').update(invalid).digest('hex') });
		f.storage.read.mockReturnValue(Readable.from([invalid]) as ReturnType<InternalStorageService['read']>);
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'IMPORT_FAILED' });
		expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
	});
	test('enforces the actual byte bound and closes the local stream', async () => {
		const f = fixture();
		const input = Readable.from([Buffer.alloc(MAX_IMPORT_BYTES), Buffer.from('x')]);
		f.storage.read.mockReturnValue(input as ReturnType<InternalStorageService['read']>);
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'IMPORT_FAILED' });
		expect(input.destroyed).toBe(true);
		expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
	});
	test('local missing-file and interrupted-stream errors remain generic', async () => {
		for (const code of ['ENOENT', 'ECONNRESET']) {
			const f = fixture();
			const input = new Readable({ read() { this.destroy(new Error(`${code}: secret path`)); } });
			f.storage.read.mockReturnValue(input as ReturnType<InternalStorageService['read']>);
			await expect(f.importer.import('alice', 'file1')).rejects.toThrow(/^IMPORT_FAILED$/);
			expect(input.destroyed).toBe(true);
			expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
		}
	});
	test('uses the recorded object URL despite current storage changes and always removes its temp file', async () => {
		const f = fixture({ storedInternal: false, accessKey: 'not-a-current-bucket-key' });
		let temp = '';
		f.download.downloadUrl.mockImplementation(async (url, path, options) => {
			expect(url).toBe('https://old-bucket.example/original.tsv');
			expect(options).toEqual({ maxSize: MAX_IMPORT_BYTES });
			temp = path;
			await writeFile(path, bytes);
			return { filename: 'untrusted-other-name.tsv' };
		});
		await f.importer.import('alice', 'file1');
		expect(f.storage.read).not.toHaveBeenCalled();
		expect(buildAnkiTextMaterial).toHaveBeenCalledWith(bytes.toString(), 'cards.tsv');
		await expect(stat(temp)).rejects.toMatchObject({ code: 'ENOENT' });
	});
	test.each(['error', 'oversized', 'changed'])('object failures leave no temp file or parsed material (%s)', async mode => {
		const f = fixture({ storedInternal: false });
		let temp = '';
		f.download.downloadUrl.mockImplementation(async (_url, path) => {
			temp = path;
			await writeFile(path, mode === 'oversized' ? Buffer.alloc(MAX_IMPORT_BYTES + 1) : Buffer.from('changed'));
			if (mode === 'error') throw new Error('secret object URL error');
			return { filename: 'cards.tsv' };
		});
		await expect(f.importer.import('alice', 'file1')).rejects.toThrow(/^IMPORT_FAILED$/);
		await expect(stat(temp)).rejects.toMatchObject({ code: 'ENOENT' });
		expect(buildAnkiTextMaterial).not.toHaveBeenCalled();
		expect(f.store.create).not.toHaveBeenCalled();
	});
	test.each(['', 'file:///private', 'https://user:secret@example.com/a'])('does not guess unavailable or unsafe object locations (%#)', async url => {
		const f = fixture({ storedInternal: false, url });
		await expect(f.importer.import('alice', 'file1')).rejects.toThrow(/^IMPORT_FAILED$/);
		expect(f.download.downloadUrl).not.toHaveBeenCalled();
	});
	test('preserves parser and duplicate source errors instead of overwriting material', async () => {
		const f = fixture();
		vi.mocked(buildAnkiTextMaterial).mockImplementationOnce(() => { throw new MaterialError('INVALID_MATERIAL'); });
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'INVALID_MATERIAL' });
		expect(f.store.create).not.toHaveBeenCalled();
		f.storage.read.mockReturnValue(Readable.from([bytes]) as ReturnType<InternalStorageService['read']>);
		f.store.create.mockRejectedValueOnce(new MaterialError('MATERIAL_EXISTS'));
		await expect(f.importer.import('alice', 'file1')).rejects.toMatchObject({ code: 'MATERIAL_EXISTS' });
	});
});
