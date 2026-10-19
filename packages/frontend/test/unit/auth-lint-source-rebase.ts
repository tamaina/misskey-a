/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import entries from './auth-lint-source-rebase.json';
const hash = (source: string) => createHash('sha256').update(source).digest('hex');

/** Includes exact SSO-child removal projected back to the frozen historical source.
 * Undo only an exact reviewed lint cleanup; each owning oracle still rejects unknown source. */
export function restoreAuthLintBaseline(file: string, source: string): string {
	const entry = entries.find(value => value.file === file);
	if (!entry || hash(source) !== entry.currentSha256) return source;
	for (const edit of [...entry.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Source differs at auth lint boundary: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (hash(source) !== entry.baselineSha256) throw new Error(`Source differs from auth lint baseline: ${file}`);
	return source;
}
