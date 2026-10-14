/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { restoreSigninPolicyBaseline } from './signin-policy-source-rebase.js';
import rebases from './password-change-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only this password/MFA flow fix before checking the frozen locale proofs. */
export function restorePasswordChangeBaseline(file: string, source: string): string {
	source = restoreSigninPolicyBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the password/MFA change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Password/MFA rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Password/MFA baseline was not restored: ${file}`);
	return source;
}
