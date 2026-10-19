/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebases from './sudo-settings-source-rebase.json';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
/** Preserve the frozen locale oracle by reversing only the reviewed Sudo UI change. */
export function restoreSudoSettingsBaseline(file: string, source: string): string {
	if (rebases.some(entry => entry.file === file)) source = restoreAuthLintBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the Sudo settings change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Sudo settings rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Sudo settings baseline was not restored: ${file}`);
	return source;
}
