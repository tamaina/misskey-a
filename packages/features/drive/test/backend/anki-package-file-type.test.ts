/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ANKI_PACKAGE_MIME, getDriveFileDisposition } from '../../backend/file-types.js';
import { getSafeContentType, setFileResponseHeaders } from '../../backend/http/FileServerUtils.js';
import { FileInfoService } from '../../backend/services/FileInfoService.js';
import { isAnkiPackageFile } from '../../backend/utility/anki-package-file-type.js';
import type { SensitiveMediaDetectionService } from '../../backend/services/SensitiveMediaDetectionService.js';
import type { LoggerService } from '../../../runtime/backend/services/LoggerService.js';
import type { FastifyReply } from 'fastify';

const fixture = (name: string) => `../features/games/fukushu/test/backend/fixtures/apkg/${name}`;
const service = new FileInfoService(mockDeep<SensitiveMediaDetectionService>(), mockDeep<LoggerService>());
let directory: string;
beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), 'anki-upload-')); });
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });

test.each(['basic-anki21.apkg', 'basic-21b.apkg', 'generated-anki-25.09.apkg'])('recognizes only genuine Anki content for the .apkg hint: %s', async name => {
	const path = join(directory, name);
	await writeFile(path, await readFile(fixture(name)));
	expect(await service.getFileInfo(path, { fileName: name.toUpperCase(), skipSensitiveDetection: true }))
		.toMatchObject({ type: { mime: ANKI_PACKAGE_MIME, ext: 'apkg' } });
	expect(await service.getFileInfo(path, { fileName: 'deck.zip', skipSensitiveDetection: true }))
		.toMatchObject({ type: { mime: 'application/zip', ext: 'zip' } });
});

test('does not classify fake, ambiguous, truncated or unsupported ZIP structure as APKG', async () => {
	const original = await readFile(fixture('basic-21b.apkg'));
	const eocd = original.length - 22;
	const directoryStart = original.readUInt32LE(eocd + 16);
	const path = join(directory, 'spoof.apkg');
	const changes: ((bytes: Buffer) => void)[] = [
		bytes => { Buffer.from('junk').copy(bytes, 30); }, // local and central names conflict
		bytes => { bytes.writeUInt16LE(10_001, eocd + 8); bytes.writeUInt16LE(10_001, eocd + 10); },
		bytes => { bytes.writeUInt32LE(0xffffffff, eocd + 12); },
		bytes => { bytes.writeUInt32LE(10, directoryStart + 42); },
		bytes => { bytes.writeUInt16LE(1, directoryStart + 8); }, // encrypted
		bytes => { bytes.writeUInt16LE(513, 28); }, // invalid local extra field
		bytes => { // valid CRC but contradicts the collection generation
			bytes[35] = 2;
			const checksum = crc32(bytes.subarray(34, 36));
			bytes.writeUInt32LE(checksum, 14);
			bytes.writeUInt32LE(checksum, directoryStart + 16);
		},
		bytes => { bytes.fill(0, 84, 100); }, // zstd prefix no longer yields SQLite
	];
	for (const change of changes) {
		const bytes = Buffer.from(original);
		change(bytes);
		await writeFile(path, bytes);
		expect(await isAnkiPackageFile(path)).toBe(false);
	}
	for (const bytes of [original.subarray(0, -1), Buffer.concat([original, Buffer.from('extra')]), Buffer.from('fake data')]) {
		await writeFile(path, bytes);
		expect(await isAnkiPackageFile(path)).toBe(false);
	}
});

test('an admitted package is an attachment, not a browser-safe file or preview', () => {
	const reply = mockDeep<FastifyReply>();
	setFileResponseHeaders(reply, { mime: ANKI_PACKAGE_MIME, filename: 'cards.apkg' });
	expect(reply.header.mock.calls).toContainEqual(['Content-Type', 'application/octet-stream']);
	expect(reply.header.mock.calls).toContainEqual(['Content-Disposition', expect.stringMatching(/^attachment;.*cards\.apkg/)]);
	expect(getDriveFileDisposition(ANKI_PACKAGE_MIME)).toBe('attachment');
	expect(getSafeContentType(ANKI_PACKAGE_MIME)).toBe('application/octet-stream');
	expect(getDriveFileDisposition('image/png')).toBe('inline');
});
