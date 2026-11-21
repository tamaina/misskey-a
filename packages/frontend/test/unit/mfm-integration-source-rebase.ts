/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebases from './mfm-integration-source-rebase.json';
import developPreferences from './mfm-develop-preferences-source-rebase.json';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Remove only the MFM additions before applying develop's current Crowdin/pilot proofs. */
export function restoreMergedMfmPreferencesDevelopBaseline(file: string, source: string): string {
	if (file !== developPreferences.file || sha256(source) !== developPreferences.currentSha256) return source;

	const mfm = rebases.find(entry => entry.file === file);
	if (!mfm) throw new Error('Missing MFM preferences proof');
	for (const edit of mfm.edits) {
		if (!source.includes(edit.current) || source.indexOf(edit.current) !== source.lastIndexOf(edit.current)) throw new Error('MFM develop preferences feature boundary differs');
		source = source.replace(edit.current, () => edit.baseline);
	}
	if (sha256(source) !== developPreferences.developSha256) throw new Error('MFM develop preferences baseline differs');
	return source;
}

/** The original per-feature proofs still verify the independently pinned pre-merge MFM tree. */
function restoreMergedMfmPreferencesFeatureHead(file: string, source: string): string {
	if (file !== developPreferences.file || sha256(source) !== developPreferences.currentSha256) return source;

	for (const edit of [...developPreferences.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error('MFM develop preferences upstream boundary differs');
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== developPreferences.mfmHeadSha256) throw new Error('MFM previous feature head differs');
	return source;
}

/** Normalize only the reviewed combined sources before the unchanged per-feature/historical proofs. */
export function restoreMfmIntegrationBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	source = restoreMergedMfmPreferencesFeatureHead(file, source);
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
