/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import entries from './conditional-entry-source-rebase.json';
const hash = (source: string) => createHash('sha256').update(source).digest('hex');
/** Exact Conditional entry wiring only; historical source and every locale remain frozen. */
export function restoreConditionalEntryBaseline(file: string, source: string): string {
	const entry = entries.find(value => value.file === file);
	if (!entry || hash(source) === entry.baselineSha256 || entry.historicalSha256.includes(hash(source))) return source;
	if (hash(source) !== entry.currentSha256) throw new Error(`Source differs from reviewed Conditional entry: ${file}`);
	for (const edit of [...entry.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Conditional entry source boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (hash(source) !== entry.baselineSha256) throw new Error(`Conditional entry baseline differs: ${file}`);
	return source;
}
