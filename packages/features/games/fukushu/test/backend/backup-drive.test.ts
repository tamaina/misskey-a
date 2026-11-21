/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { access, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { FukushuBackupInspector } from '../../backend/backup-drive.js';
import { BackupError, encodeBackup } from '../../backend/backup-codec.js';
import { exportFukushuBackup } from '../../backend/jobs/ExportFukushuProcessorService.js';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { backupFixture } from './backup-fixture.js';

function inspectorFixture() {
	const payload = backupFixture(); const bytes = encodeBackup(payload);
	const file = { id: 'owned-file', userId: 'alice', userHost: null, uri: null, isLink: false, name: 'snapshot.json', size: bytes.length,
																md5: createHash('md5').update(bytes).digest('hex'), storedInternal: true, accessKey: 'original.json', url: 'https://old.example/original.json' };
	const files = { findOneBy: vi.fn(async () => file) };
	const storage = { read: vi.fn(() => Readable.from([bytes])) };
	const download = { downloadUrl: vi.fn(async (_url: string, path: string) => { await writeFile(path, bytes); }) };
	const store = { inspect: vi.fn(async () => ({ restored: false })) };
	const inspector = new FukushuBackupInspector(files as never, storage as never, download as never, store as never);
	return { payload, bytes, file, files, storage, download, store, inspector };
}

test('reads only the owner original and passes the intact snapshot to read-only inspection', async () => {
	const f = inspectorFixture();
	expect(await f.inspector.inspect('alice', 'owned-file')).toEqual({ restored: false });
	expect(f.files.findOneBy).toHaveBeenCalledWith({ id: 'owned-file', userId: 'alice' });
	expect(f.storage.read).toHaveBeenCalledWith('original.json');
	expect(f.store.inspect).toHaveBeenCalledWith('alice', f.payload);
	expect(f.download.downloadUrl).not.toHaveBeenCalled();
});

test('foreign and missing files fail identically before any original read', async () => {
	for (const missing of [false, true]) {
		const f = inspectorFixture(); f.file.userId = 'bob';
		if (missing) f.files.findOneBy.mockResolvedValue(null as never);
		await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow('NO_SUCH_FILE');
		expect(f.storage.read).not.toHaveBeenCalled(); expect(f.store.inspect).not.toHaveBeenCalled();
	}
});

test.each([{ userHost: 'remote.example' }, { uri: 'https://remote.example/file' }, { isLink: true }, { name: 'image.png' }, { size: -1 }, { size: 1.5 }])('rejects invalid original metadata %j', async patch => {
	const f = inspectorFixture(); Object.assign(f.file, patch);
	await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow('INVALID_BACKUP');
	expect(f.storage.read).not.toHaveBeenCalled(); expect(f.store.inspect).not.toHaveBeenCalled();
});

test('bounds recorded and streamed size and closes a growing stream', async () => {
	const f = inspectorFixture(); f.file.size = MAX_BACKUP_BYTES + 1;
	await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow('BACKUP_TOO_LARGE');
	expect(f.storage.read).not.toHaveBeenCalled(); f.file.size = f.bytes.length;
	const stream = Readable.from([Buffer.alloc(MAX_BACKUP_BYTES), Buffer.from('x')]);
	f.storage.read.mockReturnValue(stream);
	await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow('BACKUP_FAILED');
	expect(stream.destroyed).toBe(true); expect(f.store.inspect).not.toHaveBeenCalled();
});

test.each([{ md5: 'changed' }, { accessKey: '../secret' }, { size: 1 }])('refuses changed or invalid original %j', async patch => {
	const f = inspectorFixture(); Object.assign(f.file, patch);
	await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow('BACKUP_FAILED');
	expect(f.store.inspect).not.toHaveBeenCalled();
});

test('uses the recorded object URL and shared bounded downloader, then removes its temporary file', async () => {
	const f = inspectorFixture(); f.file.storedInternal = false;
	await f.inspector.inspect('alice', 'owned-file');
	expect(f.storage.read).not.toHaveBeenCalled();
	expect(f.download.downloadUrl).toHaveBeenCalledWith(f.file.url, expect.any(String), { maxSize: MAX_BACKUP_BYTES });
	await expect(access(f.download.downloadUrl.mock.calls[0][1])).rejects.toThrow();
	expect(f.store.inspect).toHaveBeenCalledWith('alice', f.payload);
});

test('sanitizes storage failures and cleans up a failed remote download', async () => {
	const f = inspectorFixture(); f.file.storedInternal = false;
	f.download.downloadUrl.mockImplementation(async () => { throw new Error('secret internal URL and path'); });
	await expect(f.inspector.inspect('alice', 'owned-file')).rejects.toThrow(/^BACKUP_FAILED$/);
	await expect(access(f.download.downloadUrl.mock.calls[0][1])).rejects.toThrow();
	expect(f.store.inspect).not.toHaveBeenCalled();
});

function exportFixture() {
	const bytes = encodeBackup(backupFixture()); let path = '';
	const users = { findOneBy: vi.fn(async () => ({ id: 'alice', host: null, isDeleted: false })) };
	const store = { export: vi.fn(async () => bytes) };
	const drive = { addFile: vi.fn(async (input: { path: string }) => {
		path = input.path;
		expect(await readFile(path)).toEqual(bytes);
		expect((await stat(path)).mode & 0o077).toBe(0);
		return { id: 'saved-backup' };
	}) };
	const notifications = { createNotification: vi.fn(async () => {}) };
	const execute = (finalAttempt = false) => exportFukushuBackup({ user: { id: 'alice' }, deckId: 'deck-original' }, { users, store, drive, notifications } as never, finalAttempt);
	return { users, store, drive, notifications, execute, path: () => path };
}

test('saves the complete backup before notifying, then always removes its private temporary file', async () => {
	const f = exportFixture(); await f.execute();
	expect(f.store.export).toHaveBeenCalledWith('alice', 'deck-original');
	expect(f.drive.addFile).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ id: 'alice' }), name: expect.stringMatching(/^fukushu-backup-.*\.json$/), ext: 'json', force: true }));
	expect(f.notifications.createNotification).toHaveBeenCalledWith('alice', 'exportCompleted', { exportedEntity: 'fukushu', fileId: 'saved-backup' });
	expect(f.notifications.createNotification.mock.invocationCallOrder[0]).toBeGreaterThan(f.drive.addFile.mock.invocationCallOrder[0]);
	await expect(access(f.path())).rejects.toThrow();
});

test('does not save or notify for missing/deleted users or before the last failed attempt', async () => {
	for (const deleted of [false, true]) {
		const f = exportFixture(); f.users.findOneBy.mockResolvedValue(deleted ? { id: 'alice', host: null, isDeleted: true } : null as never);
		await f.execute(true); expect(f.store.export).not.toHaveBeenCalled(); expect(f.drive.addFile).not.toHaveBeenCalled();
		expect(f.notifications.createNotification).not.toHaveBeenCalled();
	}
	const f = exportFixture(); f.store.export.mockRejectedValue(new Error('BACKUP_TOO_LARGE'));
	await expect(f.execute()).rejects.toThrow('BACKUP_TOO_LARGE'); expect(f.drive.addFile).not.toHaveBeenCalled(); expect(f.notifications.createNotification).not.toHaveBeenCalled();
});

test.each([
	[new BackupError('BACKUP_TOO_LARGE'), 'The backup exceeds the size or record limit.'],
	[new Error('private deck contents and storage details'), 'The backup could not be exported.'],
] as const)('notifies only the owner of a terminal native export failure, without passing through the error', async (failure, message) => {
	const temporaryRoot = await mkdtemp(join(tmpdir(), 'fukushu-export-test-'));
	vi.stubEnv('TMPDIR', temporaryRoot);
	vi.stubEnv('TEMP', temporaryRoot);
	const f = exportFixture();
	try {
		f.store.export.mockRejectedValue(failure);
		await expect(f.execute(true)).rejects.toBe(failure);
		expect(f.drive.addFile).not.toHaveBeenCalled();
		expect(f.notifications.createNotification).toHaveBeenCalledExactlyOnceWith('alice', 'app', {
			customHeader: 'Fukushu', customBody: expect.stringContaining(message), customIcon: null, appAccessTokenId: null,
		});
		expect(JSON.stringify(f.notifications.createNotification.mock.calls)).not.toContain(failure.message);
		expect(await readdir(temporaryRoot)).toEqual([]);
	} finally {
		vi.unstubAllEnvs();
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});

test('does not send terminal failure to an account deleted while the backup was running', async () => {
	const f = exportFixture();
	f.users.findOneBy.mockResolvedValueOnce({ id: 'alice', host: null, isDeleted: false }).mockResolvedValue({ id: 'alice', host: null, isDeleted: true });
	f.store.export.mockRejectedValue(new BackupError('BACKUP_TOO_LARGE'));
	await expect(f.execute(true)).rejects.toThrow('BACKUP_TOO_LARGE');
	expect(f.notifications.createNotification).not.toHaveBeenCalled();
});

test('rechecks deleted users after snapshot and emits no false success when Drive fails', async () => {
	const f = exportFixture(); f.users.findOneBy.mockResolvedValueOnce({ id: 'alice', host: null, isDeleted: false }).mockResolvedValue({ id: 'alice', host: null, isDeleted: true });
	await f.execute(); expect(f.drive.addFile).not.toHaveBeenCalled(); expect(f.notifications.createNotification).not.toHaveBeenCalled();
	const failing = exportFixture(); let path = '';
	failing.drive.addFile.mockImplementation(async input => { path = input.path; throw new Error('Drive unavailable'); });
	await expect(failing.execute()).rejects.toThrow('Drive unavailable');
	await expect(access(path)).rejects.toThrow(); expect(failing.notifications.createNotification).not.toHaveBeenCalled();
});

test('retains the Drive file when notification fails and still removes temporary plaintext', async () => {
	const f = exportFixture(); f.notifications.createNotification.mockRejectedValue(new Error('Notification unavailable'));
	await expect(f.execute(true)).rejects.toThrow('Notification unavailable');
	expect(f.notifications.createNotification).toHaveBeenCalledTimes(1);
	expect(f.drive.addFile).toHaveBeenCalledTimes(1); await expect(access(f.path())).rejects.toThrow();
});

test('upstream inspection reuses the owned bounded reader without calling native inspection or any writer', async () => {
	const f = inspectorFixture();
	const bytes = await readFile('../features/games/fukushu/test/backend/fixtures/upstream-backup.fukushu');
	Object.assign(f.file, { name: 'original.fukushu', size: bytes.length, md5: createHash('md5').update(bytes).digest('hex') });
	f.storage.read.mockImplementation(() => Readable.from([bytes]));
	expect(await f.inspector.inspectUpstream('alice', 'owned-file')).toMatchObject({ imported: false, canImport: false, counts: { reviewLogs: 2 } });
	expect(f.files.findOneBy).toHaveBeenCalledWith({ id: 'owned-file', userId: 'alice' });
	expect(f.store.inspect).not.toHaveBeenCalled();
	f.file.userId = 'bob'; f.storage.read.mockClear();
	await expect(f.inspector.inspectUpstream('alice', 'owned-file')).rejects.toThrow('NO_SUCH_FILE');
	expect(f.storage.read).not.toHaveBeenCalled();
	f.file.userId = 'alice'; f.file.md5 = 'changed';
	await expect(f.inspector.inspectUpstream('alice', 'owned-file')).rejects.toThrow('BACKUP_FAILED');
});

test('source export uses the source store, original extension and the existing private temporary lifecycle', async () => {
	const f = exportFixture();
	const bytes = await readFile('../features/games/fukushu/test/backend/fixtures/actual-upstream/actual-upstream.fukushu');
	const upstream = { writeExport: vi.fn(async (_id: string, write: (part: Buffer) => Promise<void>) => write(bytes)) }; let path = '';
	f.drive.addFile.mockImplementation(async input => { path = input.path; expect(await readFile(path)).toEqual(bytes); return { id: 'saved-backup' }; });
	await exportFukushuBackup({ user: { id: 'alice' }, deckId: '', upstream: true }, { users: f.users, store: f.store, upstream, drive: f.drive, notifications: f.notifications } as never);
	expect(upstream.writeExport).toHaveBeenCalledWith('alice', expect.any(Function)); expect(f.store.export).not.toHaveBeenCalled();
	expect(f.drive.addFile).toHaveBeenCalledWith(expect.objectContaining({ ext: 'fukushu', name: expect.stringMatching(/\.fukushu$/) }));
	await expect(access(path)).rejects.toThrow();
});
