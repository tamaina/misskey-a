/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { scanSourceArchive, MAX_SOURCE_ARCHIVE_BYTES } from '../shared/source-scan.js';
import { UpstreamBackupError } from '../shared/upstream-reader.js';
export { MAX_SOURCE_ARCHIVE_BYTES as LOCAL_ARCHIVE_BYTES } from '../shared/source-scan.js';

export async function inspectLocalUpstream(file: File, signal?: AbortSignal) {
	if (file.size > MAX_SOURCE_ARCHIVE_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
	if (!/\.fukushu$/i.test(file.name)) throw new UpstreamBackupError('INVALID_BACKUP');
	return scanSourceArchive(file, signal);
}
