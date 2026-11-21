/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { restoreMfmIntegrationBaseline } from './mfm-integration-source-rebase.js';
import rebases from './mfm-search-source-rebase.json';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
export function restoreMfmSearchBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	source = restoreMfmIntegrationBaseline(file, source);
	if (sha256(source) === rebase.baselineSha256) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Unreviewed MFM search source: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`MFM search boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`MFM search baseline differs: ${file}`);
	return source;
}
