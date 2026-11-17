/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

/** Design pilot only. Not a published backup format or an API contract. */
export const experimentalBackupV2PayloadSchema = v.strictObject({
	sourceFormat: v.literal('FUKUSHU-BACKUP-1'),
	sourceFileSha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
	sourcePayloadSha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
	rawArchiveBase64: v.string(),
});

export const experimentalBackupV2Schema = v.strictObject({
	format: v.literal('misskey-fukushu-backup-pilot'),
	version: v.literal(2),
	experimental: v.literal(true),
	payload: experimentalBackupV2PayloadSchema,
	sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
});
