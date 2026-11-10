/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { restoreUpstreamDevelopBaseline } from './upstream-develop-source-rebase.js';
import rebases from './code-diff-source-rebase.json';

const sha256 = (source: string): string => createHash('sha256').update(source).digest('hex');

/** Reverse only the pinned code diff port before applying frozen locale proofs. */
export function restoreCodeDiffBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase || sha256(source) === rebase.baselineSha256) return source;
	// Reverse later reviewed upstream ports first; unreviewed bytes are still rejected.
	if (sha256(source) !== rebase.currentSha256) source = restoreUpstreamDevelopBaseline(file, source);
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the code diff port: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Code diff rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Code diff baseline was not restored: ${file}`);
	return source;
}
