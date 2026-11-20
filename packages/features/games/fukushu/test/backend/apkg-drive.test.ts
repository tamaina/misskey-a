/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { expect, test, vi } from 'vitest';
import { FukushuBackupInspector } from '../../backend/backup-drive.js';

const archive = readFileSync('../features/games/fukushu/test/backend/fixtures/apkg/generated-anki-25.09.apkg');
const md5 = (bytes: Buffer) => createHash('md5').update(bytes).digest('hex');

function setup(bytes = archive) {
	const file = {
		id: 'original', userId: 'alice', userHost: null, uri: null, isLink: false, name: 'cards.APKG',
		size: bytes.length, md5: md5(bytes), storedInternal: true, accessKey: 'original', url: 'https://old.example/original',
	};
	const files = { findOneBy: vi.fn(async () => file) };
	const storage = { read: vi.fn(() => Readable.from([bytes])) };
	const download = { downloadUrl: vi.fn(async (_url: string, path: string) => { await writeFile(path, bytes); }) };
	const source = new FukushuBackupInspector(files as never, storage as never, download as never, { inspect: vi.fn() });
	return { file, files, storage, download, source, identity: { size: file.size, md5: file.md5 } };
}

test.each([true, false])('stages a real Anki export privately and removes it after inspection (internal=%s)', async internal => {
	const f = setup();
	f.file.storedInternal = internal;
	const identity = await f.source.sourceIdentity('alice', 'original', 'anki-apkg');
	expect(identity).toEqual(f.identity);
	expect(f.storage.read).not.toHaveBeenCalled();
	expect(f.download.downloadUrl).not.toHaveBeenCalled();
	const path = await f.source.withApkg('alice', 'original', identity, async staged => {
		expect(staged.name).toBe('cards.APKG');
		expect(staged.sha256).toBe('a97e9c2e4e737a2a2a295aef66259d9a9cdcf466047f07b7302017e75fcca81a');
		expect(await readFile(staged.path)).toEqual(archive);
		expect((await stat(dirname(staged.path))).mode & 0o077).toBe(0);
		return staged.path;
	});
	expect(f.files.findOneBy).toHaveBeenCalledWith({ id: 'original', userId: 'alice' });
	await expect(access(path)).rejects.toThrow();
});

test.each([
	[{ userId: 'bob' }, 'NO_SUCH_FILE'], [{ isLink: true }, 'INVALID_BACKUP'],
	[{ name: 'cards.fukushu' }, 'INVALID_BACKUP'], [{ userHost: 'remote.example' }, 'INVALID_BACKUP'],
	[{ size: 256 * 1024 ** 2 + 1 }, 'BACKUP_TOO_LARGE'], [{ size: archive.length + 1 }, 'BACKUP_FAILED'],
	[{ md5: 'changed' }, 'BACKUP_FAILED'],
] as const)('rejects ineligible or changed metadata before a worker reads the original: %j', async (patch, code) => {
	const f = setup();
	Object.assign(f.file, patch);
	const consume = vi.fn();
	await expect(f.source.withApkg('alice', 'original', f.identity, consume)).rejects.toThrow(code);
	expect(f.storage.read).not.toHaveBeenCalled();
	expect(consume).not.toHaveBeenCalled();
});

test('rejects non-ZIP or altered bytes, does not offer the APKG to the backup decoder', async () => {
	const consume = vi.fn();
	const fake = setup(Buffer.from('not an Anki package'));
	await expect(fake.source.withApkg('alice', 'original', fake.identity, consume)).rejects.toThrow('INVALID_BACKUP');
	const f = setup();
	f.storage.read.mockImplementation(() => Readable.from([Buffer.alloc(archive.length)]));
	await expect(f.source.withApkg('alice', 'original', f.identity, consume)).rejects.toThrow('BACKUP_FAILED');
	await expect(f.source.sourceIdentity('alice', 'original')).rejects.toThrow('INVALID_BACKUP');
	expect(consume).not.toHaveBeenCalled();
});

test('cleans up when the consumer rejects the package and can retry against the unchanged original', async () => {
	const f = setup();
	let previousPath = '';
	await expect(f.source.withApkg('alice', 'original', f.identity, async ({ path }) => {
		previousPath = path;
		throw new Error('unsupported archive');
	})).rejects.toThrow('unsupported archive');
	await expect(access(previousPath)).rejects.toThrow();
	await f.source.withApkg('alice', 'original', f.identity, async ({ path }) => { expect(await readFile(path)).toEqual(archive); });
});
