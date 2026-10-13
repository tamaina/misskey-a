/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { restoreBrowserSessionClientBaseline } from './browser-session-client-source-rebase.js';
import rebases from './client-error-log-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only this client error log port before checking the frozen locale proofs. */
export function restoreClientErrorLogBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase || sha256(source) === rebase.baselineSha256) return source;
	if (file === 'packages/features/preferences/frontend/pages/settings/other.vue' && sha256(source) !== rebase.currentSha256) {
		source = restoreBrowserSessionClientBaseline(file, source);
	}
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the client error log port: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Client error log rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Client error log baseline was not restored: ${file}`);
	return source;
}
