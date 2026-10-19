/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import entries from './oidc-source-rebase.json';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';
const hash = (source: string) => createHash('sha256').update(source).digest('hex');

/** Historical SSO source exists only in this test projection; production SSO is removed.
 * Remove only the two reviewed OIDC child integrations before the unchanged historical proofs. */
export function restoreOidcSourceBaseline(file: string, source: string): string {
	if (entries.some(entry => entry.file === file)) source = restoreAuthLintBaseline(file, source);
	const entry = entries.find(value => value.file === file);
	if (!entry || hash(source) === entry.baselineSha256) return source;
	if (hash(source) !== entry.currentSha256) throw new Error(`Source differs from reviewed OIDC integration: ${file}`);
	for (const edit of [...entry.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`OIDC source boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (hash(source) !== entry.baselineSha256) throw new Error(`OIDC source baseline differs: ${file}`);
	return source;
}
