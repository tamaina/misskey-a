/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import * as v from 'valibot';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { experimentalBackupV2Schema } from '../../shared/experimental/backup-v2.schema.js';
import { readUpstreamArchive } from '../../shared/upstream-reader.js';

/** Unregistered design experiment: no API, queue, persistence or v1 dispatch. */
export class ExperimentalBackupV2Error extends Error {
	constructor(public readonly code: 'INVALID_EXPERIMENTAL_BACKUP' | 'BACKUP_TOO_LARGE') { super(code); }
}

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const invalid = () => new ExperimentalBackupV2Error('INVALID_EXPERIMENTAL_BACKUP');
const checkSize = (length: number) => {
	if (length > MAX_BACKUP_BYTES) throw new ExperimentalBackupV2Error('BACKUP_TOO_LARGE');
};

export async function encodeExperimentalBackupV2(input: Uint8Array): Promise<Buffer> {
	checkSize(input.length);
	// Base64 alone can exceed the existing limit; reject before allocating it.
	checkSize(4 * Math.ceil(input.length / 3));
	const archive = await readUpstreamArchive(input, async bytes => hash(bytes));
	const payload = {
		sourceFormat: 'FUKUSHU-BACKUP-1' as const,
		sourceFileSha256: archive.fileSha256,
		sourcePayloadSha256: archive.payloadSha256,
		rawArchiveBase64: Buffer.from(archive.originalBytes()).toString('base64'),
	};
	const bytes = Buffer.from(JSON.stringify({
		format: 'misskey-fukushu-backup-pilot', version: 2, experimental: true,
		payload, sha256: hash(Buffer.from(JSON.stringify(payload))),
	}));
	checkSize(bytes.length); // Includes metadata and JSON framing, not just binary.
	return bytes;
}

export async function decodeExperimentalBackupV2(input: Uint8Array) {
	checkSize(input.length);
	let raw: unknown;
	try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(input)); } catch { throw invalid(); }
	const result = v.safeParse(experimentalBackupV2Schema, raw);
	if (!result.success) throw invalid();
	const { payload, sha256 } = result.output;
	if (hash(Buffer.from(JSON.stringify((raw as { payload: unknown }).payload))) !== sha256) throw invalid();
	// Node's permissive base64 decoder must not silently discard malformed input.
	const bytes = Buffer.from(payload.rawArchiveBase64, 'base64');
	if (bytes.toString('base64') !== payload.rawArchiveBase64 || hash(bytes) !== payload.sourceFileSha256) throw invalid();
	const archive = await readUpstreamArchive(bytes, async value => hash(value));
	if (archive.payloadSha256 !== payload.sourcePayloadSha256) throw invalid();
	return archive;
}
