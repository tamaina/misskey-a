/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ZipArchive, ZipFile } from '@features/runtime/backend/io/zip.js';
import { ExportCustomEmojisProcessorService } from '@features/emojis/backend/jobs/ExportCustomEmojisProcessorService.js';
import { createTemp, createTempDir } from '@features/runtime/backend/io/create-temp.js';
import type { Mock } from 'vitest';

vi.mock('@features/drive/backend/services/DriveService.js', () => ({ DriveService: class {} }));
vi.mock('@features/runtime/backend/services/DownloadService.js', () => ({ DownloadService: class {} }));
vi.mock('@features/notifications/backend/services/NotificationService.js', () => ({ NotificationService: class {} }));
vi.mock('@features/runtime/backend/queue/QueueLoggerService.js', () => ({ QueueLoggerService: class {} }));
vi.mock('@features/runtime/backend/io/create-temp.js', () => ({ createTemp: vi.fn(), createTempDir: vi.fn() }));

describe('custom emoji ZIP export', () => {
	let dir: string;
	let cleanup: Mock<() => void>;
	let archiveCleanup: Mock<() => void>;

	beforeEach(async () => {
		dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'emoji-export-'));
		const sourceDir = path.join(dir, 'source');
		await fs.promises.mkdir(sourceDir);
		cleanup = vi.fn(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
		archiveCleanup = vi.fn(() => fs.rmSync(path.join(dir, 'archive.zip'), { force: true }));
		vi.mocked(createTempDir).mockResolvedValue([sourceDir, cleanup]);
		vi.mocked(createTemp).mockResolvedValue([path.join(dir, 'archive.zip'), archiveCleanup]);
	});

	afterEach(async () => {
		await fs.promises.rm(dir, { recursive: true, force: true });
	});

	function setup(downloadFailure = false) {
		const emojis = ['first', 'second'].map(id => ({ id, name: 'same', type: 'image/png', originalUrl: id }));
		const addFile = vi.fn(async ({ path: zipPath }: { path: string }) => {
			const zip = await ZipFile.open(zipPath);
			const contents: Record<string, string> = {};
			try {
				for await (const entry of zip.entries()) {
					const destination = path.join(dir, entry.filename);
					await zip.extractToFile(entry, destination, { maxBytes: 1024 * 1024 });
					contents[entry.filename] = await fs.promises.readFile(destination, 'utf8');
				}
			} finally {
				await zip.close();
			}
			expect(Object.keys(contents)).toEqual(['meta.json', 'same.png']);
			expect(contents['same.png']).toBe(downloadFailure ? 'first' : 'second');
			expect(JSON.parse(contents['meta.json']).emojis.map((emoji: { downloaded: boolean }) => emoji.downloaded)).toEqual([true, !downloadFailure]);
			return { id: 'exported' };
		});
		const notify = vi.fn();
		const logger = { info: vi.fn(), error: vi.fn(), succ: vi.fn() };
		const service = new ExportCustomEmojisProcessorService(
			{ host: 'example.test' } as never,
			{ findOneBy: vi.fn().mockResolvedValue({ id: 'user' }) } as never,
			{ find: vi.fn().mockResolvedValue(emojis) } as never,
			{ addFile } as never,
			{ downloadUrl: vi.fn(async (url: string, target: string) => {
				await fs.promises.writeFile(target, url);
				if (downloadFailure && url === 'second') throw new Error('download failed');
			}) } as never,
			{ logger: { createSubLogger: () => logger } } as never,
			{ createNotification: notify } as never,
		);
		return { service, addFile, notify };
	}

	test.each([false, true])('keeps the last successful duplicate image, failed later download: %s', async downloadFailure => {
		const { service, addFile, notify } = setup(downloadFailure);
		await service.process({ data: { user: { id: 'user' } } } as never);
		expect(addFile).toHaveBeenCalledOnce();
		expect(notify).toHaveBeenCalledWith('user', 'exportCompleted', { exportedEntity: 'customEmoji', fileId: 'exported' });
		expect(cleanup).toHaveBeenCalledOnce();
		expect(archiveCleanup).toHaveBeenCalledOnce();
	});

	test('aborts a failed archive and cleans up without publishing it', async () => {
		const { service, addFile, notify } = setup();
		vi.spyOn(ZipArchive.prototype, 'addFile').mockRejectedValueOnce(new Error('write failed'));
		const abort = vi.spyOn(ZipArchive.prototype, 'abort');
		await expect(service.process({ data: { user: { id: 'user' } } } as never)).rejects.toThrow('write failed');
		expect(abort).toHaveBeenCalledOnce();
		expect(addFile).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();
		expect(cleanup).toHaveBeenCalledOnce();
		expect(archiveCleanup).toHaveBeenCalledOnce();
	});

	test('cleans up and does not notify when Drive rejects the completed ZIP', async () => {
		const { service, addFile, notify } = setup();
		addFile.mockRejectedValueOnce(new Error('drive failed'));
		await expect(service.process({ data: { user: { id: 'user' } } } as never)).rejects.toThrow('drive failed');
		expect(notify).not.toHaveBeenCalled();
		expect(cleanup).toHaveBeenCalledOnce();
		expect(archiveCleanup).toHaveBeenCalledOnce();
	});
});
