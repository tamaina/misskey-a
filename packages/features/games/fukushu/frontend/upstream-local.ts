/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { inspectUpstreamBytes, UpstreamBackupError } from '../shared/upstream-reader.js';

/** No network, Drive write, persistent browser storage or history reconstruction. */
export async function inspectLocalUpstream(file: File) {
	if (file.size > MAX_BACKUP_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
	if (!/\.fukushu$/i.test(file.name)) throw new UpstreamBackupError('INVALID_BACKUP');
	const bytes = new Uint8Array(await file.arrayBuffer());
	return inspectUpstreamBytes(bytes, async value => {
		const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(value).buffer);
		return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
	});
}
