/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import entries from './credential-issuance-source-rebase.json';
const hash = (source: string) => createHash('sha256').update(source).digest('hex');
/** Exact source and primary-label delta only; frozen historical dictionaries stay byte-identical. */
export function restoreCredentialIssuanceBaseline(file: string, source: string): string {
	const entry = entries.find(value => value.file === file);
	if (!entry || hash(source) === entry.baselineSha256) return source;
	if (hash(source) !== entry.currentSha256) throw new Error(`Source differs from reviewed credential issuance: ${file}`);
	for (const edit of [...entry.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Credential issuance source boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (hash(source) !== entry.baselineSha256) throw new Error(`Credential issuance baseline differs: ${file}`);
	return source;
}
