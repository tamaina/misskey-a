/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import rebases from './signin-policy-source-rebase.json';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';
import { restoreConditionalEntryBaseline } from './conditional-entry-source-rebase.js';
import { restoreOidcSourceBaseline } from './oidc-source-rebase.js';
import { restoreSigninProgressBaseline } from './signin-progress-source-rebase.js';
import { restoreSudoSettingsBaseline } from './sudo-settings-source-rebase.js';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only this login policy flow before checking the frozen locale proofs. */
export function restoreSigninPolicyBaseline(file: string, source: string): string {
	if (rebases.some(entry => entry.file === file)) source = restoreAuthLintBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	if (sha256(source) === rebase.baselineSha256) return source;
	if (sha256(source) !== rebase.currentSha256) {
		if (file === 'packages/features/auth/frontend/components/MkSignin.vue') source = restoreSigninProgressBaseline(file, restoreOidcSourceBaseline(file, restoreConditionalEntryBaseline(file, source)));
		if (file === 'packages/features/auth/frontend/components/MkSignin.conditional.vue') source = restoreSudoSettingsBaseline(file, source);
	}
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the login policy change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Login policy rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Login policy baseline was not restored: ${file}`);
	return source;
}
