/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import got from 'got';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DownloadService } from '../../backend/services/DownloadService.js';
import type { Config } from '@/config.js';
import type { HttpRequestService } from '../../backend/services/HttpRequestService.js';
import type { LoggerService } from '../../backend/services/LoggerService.js';
import type { Logger } from '../../backend/logging/logger.js';

vi.mock('got', async importOriginal => {
	const original = await importOriginal<typeof import('got')>();
	return { ...original, default: { ...original.default, stream: vi.fn() } };
});

let directory: string;
beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), 'fukushu-download-test-'));
	vi.mocked(got.stream).mockReset();
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

function fixture(chunks: Buffer[], configuredLimit = 20) {
	const input = Readable.from(chunks);
	vi.mocked(got.stream).mockReturnValue(input as ReturnType<typeof got.stream>);
	const config = mockDeep<Config>({ maxFileSize: configuredLimit });
	const http = mockDeep<HttpRequestService>();
	const loggers = mockDeep<LoggerService>();
	loggers.getLogger.mockReturnValue(mockDeep<Logger>());
	return { input, service: new DownloadService(config, http, loggers), path: join(directory, 'download') };
}

describe('DownloadService per-download actual byte bound', () => {
	test('accepts exactly the limit without requiring Content-Length or progress events', async () => {
		const f = fixture([Buffer.from('123'), Buffer.from('45')]);
		await f.service.downloadUrl('https://example.com/file', f.path, { maxSize: 5 });
		expect(await readFile(f.path, 'utf8')).toBe('12345');
	});
	test('stops chunked or decompressed bodies before writing bytes exceeding the requested limit', async () => {
		const f = fixture([Buffer.from('123'), Buffer.from('456')]);
		await expect(f.service.downloadUrl('https://example.com/file', f.path, { maxSize: 5 })).rejects.toThrow('Download size limit exceeded');
		expect((await stat(f.path)).size).toBeLessThanOrEqual(5);
		expect(f.input.destroyed).toBe(true);
	});
	test('cannot raise the server-wide limit with a per-download option', async () => {
		const f = fixture([Buffer.from('123456')], 5);
		await expect(f.service.downloadUrl('https://example.com/file', f.path, { maxSize: 10 })).rejects.toThrow('Download size limit exceeded');
		expect((await stat(f.path)).size).toBeLessThanOrEqual(5);
	});
	test('existing callers retain the server configured limit', async () => {
		const f = fixture([Buffer.from('12345')], 5);
		await f.service.downloadUrl('https://example.com/file', f.path);
		expect(await readFile(f.path, 'utf8')).toBe('12345');
	});
	test.each([-1, NaN, Infinity, 0.5])('rejects invalid requested bounds before starting I/O (%s)', async maxSize => {
		const f = fixture([]);
		await expect(f.service.downloadUrl('https://example.com/file', f.path, { maxSize })).rejects.toThrow('Invalid download size limit');
		expect(got.stream).not.toHaveBeenCalled();
	});
});
