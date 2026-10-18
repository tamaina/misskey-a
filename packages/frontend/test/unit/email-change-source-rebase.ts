/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { restoreSudoSettingsBaseline } from './sudo-settings-source-rebase.js';
import rebases from './email-change-source-rebase.json';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only this email-change flow fix before checking the frozen locale proofs. */
export function restoreEmailChangeBaseline(file: string, source: string): string {
	if (rebases.some(entry => entry.file === file)) source = restoreAuthLintBaseline(file, source);
	if (file === 'packages/features/auth/frontend/pages/settings/email.vue') source = restoreSudoSettingsBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the email-change change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Email-change rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Email-change baseline was not restored: ${file}`);
	return source;
}
