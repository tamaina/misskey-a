/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import proof from './remote-suspension-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse the exact remote suspension indicator while retaining all frozen locale evidence. */
export function restoreRemoteSuspensionBaseline(file: string, source: string): string {
	if (file !== proof.file) return source;
	if (sha256(source) !== proof.currentSha256) throw new Error(`Source differs from the reviewed remote suspension change: ${file}`);
	for (const edit of [...proof.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Remote suspension rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== proof.baselineSha256) throw new Error(`Remote suspension baseline was not restored: ${file}`);
	return source;
}
