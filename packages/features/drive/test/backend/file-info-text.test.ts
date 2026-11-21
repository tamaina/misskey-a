/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { FileInfoService } from '../../backend/services/FileInfoService.js';
import type { SensitiveMediaDetectionService } from '../../backend/services/SensitiveMediaDetectionService.js';
import type { LoggerService } from '../../../runtime/backend/services/LoggerService.js';

describe('Drive plain text filenames', () => {
	let directory: string;
	const service = new FileInfoService(mockDeep<SensitiveMediaDetectionService>(), mockDeep<LoggerService>());
	beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), 'drive-text-')); });
	afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
	test.each([
		['教材.tsv', 'text/tab-separated-values', 'tsv'],
		['教材.TSV', 'text/tab-separated-values', 'tsv'],
		['教材.TXT', 'text/plain', 'txt'],
		['教材.csv', 'text/csv', 'csv'],
		['教材.unknown', 'application/octet-stream', null],
	])('recognizes %s without changing unknown-file policy', async (fileName, mime, ext) => {
		const path = join(directory, fileName);
		await writeFile(path, '\uFEFF#html:false\n日本の首都は？\t東京\n');
		const result = await service.getFileInfo(path, { fileName, skipSensitiveDetection: true });
		expect(result.type).toEqual({ mime, ext });
	});
	test('a known binary signature is not overridden by a TSV extension', async () => {
		const path = join(directory, 'binary.tsv');
		await writeFile(path, '%PDF-1.7\n%binary content\n');
		const result = await service.getFileInfo(path, { fileName: 'binary.tsv', skipSensitiveDetection: true });
		expect(result.type.mime).toBe('application/pdf');
	});
});
