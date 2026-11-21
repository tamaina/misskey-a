/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { FileInfoService } from '../../backend/services/FileInfoService.js';
import { FUKUSHU_MIME } from '../../backend/utility/fukushu-file-type.js';
import { getSafeContentType } from '../../backend/http/FileServerUtils.js';
import { DEFAULT_POLICIES } from '../../../roles/backend/services/RoleService.js';

let directory: string;
beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), 'fukushu-type-')); });
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
const service = new FileInfoService(mockDeep(), mockDeep());
const fixture = () => readFile('../features/games/fukushu/test/backend/fixtures/actual-upstream/actual-upstream.fukushu');

test('valid upstream binary is recognized and default policies explicitly allow only its type', async () => {
	const path = join(directory, 'valid'); await writeFile(path, await fixture());
	expect((await service.getFileInfo(path, { fileName: 'backup.FUKUSHU', skipSensitiveDetection: true })).type).toEqual({ mime: FUKUSHU_MIME, ext: 'fukushu' });
	expect(DEFAULT_POLICIES.uploadableFileTypes).toContain(FUKUSHU_MIME);
	expect(DEFAULT_POLICIES.uploadableFileTypes).not.toContain('application/octet-stream');
	expect(getSafeContentType(FUKUSHU_MIME)).toBe('application/octet-stream');
});

test.each(['damaged', 'renamed', 'truncated', 'oversized'])('%s binary remains unrecognized', async kind => {
	let bytes = await fixture();
	if (kind === 'damaged') bytes[100] ^= 1;
	if (kind === 'renamed') bytes = Buffer.from('not a Fukushu backup');
	if (kind === 'truncated') bytes = bytes.subarray(0, bytes.length - 1);
	if (kind === 'oversized') bytes = Buffer.alloc(8 * 1024 * 1024 + 1);
	const path = join(directory, kind); await writeFile(path, bytes);
	expect((await service.getFileInfo(path, { fileName: 'backup.fukushu', skipSensitiveDetection: true })).type.mime).toBe('application/octet-stream');
});
