/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { restoreMfmIntegrationBaseline } from './mfm-integration-source-rebase.js';
import rebases from './formula-source-rebase.json';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
export function restoreFormulaBaseline(file: string, source: string): string {
	source = restoreMfmIntegrationBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase || sha256(source) === rebase.baselineSha256) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Unreviewed formula source: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`formula boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`formula baseline differs: ${file}`);
	return source;
}
