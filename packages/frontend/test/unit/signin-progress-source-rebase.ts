/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import entries from './signin-progress-source-rebase.json';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Strictly compose the reviewed signin state delta with the immutable locale oracle. */
export function restoreSigninProgressBaseline(file: string, source: string): string {
	const entry = entries.find(value => value.file === file);
	if (!entry) return source;
	const actual = sha256(source);
	if (actual === entry.baselineSha256) return source;
	if (actual !== entry.currentSha256) throw new Error(`Source differs from reviewed signin progress: ${file}`);
	for (const edit of [...entry.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Signin progress boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== entry.baselineSha256) throw new Error(`Signin progress baseline differs: ${file}`);
	return source;
}
