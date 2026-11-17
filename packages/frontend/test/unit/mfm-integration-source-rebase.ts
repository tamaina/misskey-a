/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebases from './mfm-integration-source-rebase.json';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
/** Normalize only the reviewed combined sources before the unchanged per-feature/historical proofs. */
export function restoreMfmIntegrationBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	const hash = sha256(source);
	if (hash === rebase.baselineSha256 || rebase.individualSha256.includes(hash)) return source;
	if (hash !== rebase.currentSha256) throw new Error(`Unreviewed MFM integration source: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`MFM integration boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`MFM integration baseline differs: ${file}`);
	return source;
}
