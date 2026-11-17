/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { readUpstreamArchive, projectUpstreamInspection, inspectUpstreamBytes, UPSTREAM_MAGIC } from '../../shared/upstream-reader.js';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { encodeExperimentalBackupV2, decodeExperimentalBackupV2 } from '../../backend/experimental/backup-v2-codec.js';
import { encodeBackup, decodeBackup } from '../../backend/backup-codec.js';
import { backupFixture } from './backup-fixture.js';
import type { UpstreamFrame } from '../../shared/upstream-reader.js';

const golden = readFileSync('../features/games/fukushu/test/backend/fixtures/upstream-backup.fukushu');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const sha256 = async (bytes: Uint8Array) => hash(bytes);

function pack(frames: UpstreamFrame[]) {
	const parts: Uint8Array[] = [Buffer.from(UPSTREAM_MAGIC)];
	for (const frame of frames) {
		const meta = Buffer.from(JSON.stringify({ store: frame.store, value: frame.value, ...(frame.blob === undefined ? {} : { blobSize: frame.blob.length }) }));
		const length = Buffer.alloc(4); length.writeUInt32LE(meta.length);
		parts.push(length, meta, frame.blob ?? new Uint8Array());
	}
	const body = Buffer.concat(parts);

	return Buffer.concat([body, Buffer.from(hash(body))]);
}

async function frames() { return (await readUpstreamArchive(golden, sha256)).frames(); }

function row(rows: UpstreamFrame[], store: UpstreamFrame['store']) {
	const result = rows.find(r => r.store === store);
	if (!result) throw new Error('Missing fixture frame');
	return result;
}

test('retains every binary and original frame while inspection stays redacted', async () => {
	const archive = await readUpstreamArchive(golden, sha256);
	expect(archive.originalBytes()).toEqual(new Uint8Array(golden));
	expect(archive.fileSha256).toBe(hash(golden));
	expect(archive.payloadSha256).toBe(hash(golden.subarray(0, -64)));
	expect(archive.fileSha256).not.toBe(archive.payloadSha256);
	const original = archive.frames();
	expect(row(original, 'importSources').blob?.length).toBe(23);
	expect(row(original, 'media').blob?.length).toBe(62);
	expect(projectUpstreamInspection(archive)).toEqual(await inspectUpstreamBytes(golden, sha256));
	expect(JSON.stringify(projectUpstreamInspection(archive))).not.toContain('old response');
});

test('keeps omitted defaults out of original values and bytes', async () => {
	const rows = await frames();
	delete row(rows, 'settings').value.checkpointInterval;
	delete row(rows, 'decks').value.studyMode;
	const original = pack(rows);
	const archive = await decodeExperimentalBackupV2(await encodeExperimentalBackupV2(original));
	expect(archive.normalizedRecords().settings[0].checkpointInterval).toBe(20);
	expect(archive.normalizedRecords().decks[0].studyMode).toBe('quiz');
	expect(row(archive.frames(), 'settings').value).not.toHaveProperty('checkpointInterval');
	expect(row(archive.frames(), 'decks').value).not.toHaveProperty('studyMode');
	expect(archive.originalBytes()).toEqual(new Uint8Array(original));
});

test('snapshots before asynchronous hashing and isolates accessor mutations', async () => {
	const input = new Uint8Array(golden);
	const pending = readUpstreamArchive(input, sha256);
	input.fill(0);
	const archive = await pending;
	const before = archive.frames();
	archive.originalBytes().fill(0);
	const copied = archive.frames();
	row(copied, 'settings').value.desiredRetention = 0.8;
	row(copied, 'importSources').blob?.fill(0);
	archive.normalizedRecords().settings[0].desiredRetention = 0.8;
	expect(archive.originalBytes()).toEqual(new Uint8Array(golden));
	expect(archive.frames()).toEqual(before);
	expect(archive.normalizedRecords().settings[0].desiredRetention).toBe(0.93);
});

test('round trips binary and unknown historical facts without inventing a native history', async () => {
	const encoded = await encodeExperimentalBackupV2(golden);
	const archive = await decodeExperimentalBackupV2(encoded);
	expect(archive.originalBytes()).toEqual(new Uint8Array(golden));
	expect(await encodeExperimentalBackupV2(archive.originalBytes())).toEqual(encoded);
	const records = archive.normalizedRecords();
	expect(records.studyStates[0].card.reps).toBe(7);
	expect(records.reviewLogs.filter(r => r.questionId === 'source-card')).toHaveLength(1);
	expect(records.reviewLogs[0].id).toBe('source-review-1');
	for (const entry of projectUpstreamInspection(archive).history) {
		expect(entry).toMatchObject({ questionSnapshot: 'unavailable', cardBefore: null, cardAfter: null, scheduler: null });
	}
});

test('preserves absent binary versus explicitly empty binary', async () => {
	for (const blob of [undefined, new Uint8Array()]) {
		const rows = await frames();
		row(rows, 'importSources').blob = blob;
		const original = pack(rows);
		const decoded = await decodeExperimentalBackupV2(await encodeExperimentalBackupV2(original));
		expect(row(decoded.frames(), 'importSources').blob).toEqual(blob);
		expect(decoded.originalBytes()).toEqual(new Uint8Array(original));
	}
});

test.each(['envelope-field', 'payload-field', 'format', 'version', 'experimental', 'envelope-hash', 'file-hash', 'payload-hash', 'base64'])('rejects altered pilot metadata: %s', async kind => {
	const value = JSON.parse((await encodeExperimentalBackupV2(golden)).toString());
	if (kind === 'envelope-field') value.ownerId = 'not-authority';
	if (kind === 'payload-field') value.payload.questionVersion = 1;
	if (kind === 'format') value.format = 'misskey-fukushu-backup';
	if (kind === 'version') value.version = 3;
	if (kind === 'experimental') value.experimental = false;
	if (kind === 'file-hash') value.payload.sourceFileSha256 = '0'.repeat(64);
	if (kind === 'payload-hash') value.payload.sourcePayloadSha256 = '0'.repeat(64);
	if (kind === 'base64') value.payload.rawArchiveBase64 += '\n';
	value.sha256 = kind === 'envelope-hash' ? '0'.repeat(64) : hash(Buffer.from(JSON.stringify(value.payload)));
	await expect(decodeExperimentalBackupV2(Buffer.from(JSON.stringify(value)))).rejects.toThrow('INVALID_EXPERIMENTAL_BACKUP');
});

test.each(['checksum', 'source-binary', 'media-binary', 'unknown-record-field'])('validates the inner archive even with recalculated outer hashes: %s', async kind => {
	const rows = await frames();
	if (kind === 'media-binary') row(rows, 'media').blob![0] ^= 1;
	if (kind === 'unknown-record-field') row(rows, 'reviewLogs').value.questionVersion = 1;
	let original = pack(rows);
	if (kind === 'checksum') original[original.length - 1] ^= 1;
	if (kind === 'source-binary') original = original.subarray(0, original.length - 100);
	const value = JSON.parse((await encodeExperimentalBackupV2(golden)).toString());
	value.payload.rawArchiveBase64 = original.toString('base64');
	value.payload.sourceFileSha256 = hash(original);
	value.payload.sourcePayloadSha256 = hash(original.subarray(0, -64));
	value.sha256 = hash(Buffer.from(JSON.stringify(value.payload)));
	await expect(decodeExperimentalBackupV2(Buffer.from(JSON.stringify(value)))).rejects.toThrow('INVALID_BACKUP');
	await expect(encodeExperimentalBackupV2(original)).rejects.toThrow('INVALID_BACKUP');
});

test('rejects malformed JSON and UTF-8 without reading a partial envelope', async () => {
	for (const bytes of [Buffer.from('{'), Buffer.from([0xff])]) {
		await expect(decodeExperimentalBackupV2(bytes)).rejects.toThrow('INVALID_EXPERIMENTAL_BACKUP');
	}
});

test('keeps the existing 8 MiB envelope limit including JSON metadata', async () => {
	const small = await encodeExperimentalBackupV2(golden);
	const exact = Buffer.concat([small, Buffer.alloc(MAX_BACKUP_BYTES - small.length, 0x20)]);
	expect((await decodeExperimentalBackupV2(exact)).originalBytes()).toEqual(new Uint8Array(golden));
	await expect(decodeExperimentalBackupV2(Buffer.concat([exact, Buffer.from(' ')]))).rejects.toThrow('BACKUP_TOO_LARGE');
	await expect(encodeExperimentalBackupV2(Buffer.alloc(MAX_BACKUP_BYTES + 1))).rejects.toThrow('BACKUP_TOO_LARGE');
	const rows = await frames();
	// Choose the largest base64 length fitting the envelope, then cross by one group.
	const metadataBytes = small.length - 4 * Math.ceil(golden.length / 3);
	const maxRaw = 3 * Math.floor((MAX_BACKUP_BYTES - metadataBytes) / 4);
	row(rows, 'importSources').blob = new Uint8Array(maxRaw - golden.length + 23);
	// The blobSize decimal adds bytes to the inner header; account for its new width.
	let original = pack(rows);
	row(rows, 'importSources').blob = new Uint8Array(row(rows, 'importSources').blob!.length - (original.length - maxRaw));
	original = pack(rows);
	expect(original.length).toBe(maxRaw);
	expect((await encodeExperimentalBackupV2(original)).length).toBeLessThanOrEqual(MAX_BACKUP_BYTES);
	row(rows, 'importSources').blob = new Uint8Array(row(rows, 'importSources').blob!.length + 1);
	await expect(encodeExperimentalBackupV2(pack(rows))).rejects.toThrow('BACKUP_TOO_LARGE');
	row(rows, 'importSources').blob = new Uint8Array(6 * 1024 * 1024);
	original = pack(rows);
	expect(original.length).toBeLessThan(MAX_BACKUP_BYTES);
	await expect(encodeExperimentalBackupV2(original)).rejects.toThrow('BACKUP_TOO_LARGE');
});

test('keeps native v1 encoding and decoding separate from the experimental envelope', async () => {
	const before = encodeBackup(backupFixture());
	const pilot = await encodeExperimentalBackupV2(golden);
	expect(() => decodeBackup(pilot)).toThrow('INVALID_BACKUP');
	await expect(decodeExperimentalBackupV2(before)).rejects.toThrow('INVALID_EXPERIMENTAL_BACKUP');
	expect(encodeBackup(decodeBackup(before))).toEqual(before);
	expect(encodeBackup(backupFixture())).toEqual(before);
});
