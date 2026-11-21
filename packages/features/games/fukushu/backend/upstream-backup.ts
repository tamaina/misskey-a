/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { inspectUpstreamBytes, UpstreamBackupError } from '../shared/upstream-reader.js';
import { BackupError } from './backup-codec.js';
export { UPSTREAM_MAGIC } from '../shared/upstream-reader.js';

export async function inspectUpstreamBackup(bytes: Buffer) {
	try {
		return await inspectUpstreamBytes(bytes, async value => createHash('sha256').update(value).digest('hex'));
	} catch (error) {
		if (error instanceof UpstreamBackupError) throw new BackupError(error.code);
		throw error;
	}
}
