/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import entries from './auth-lint-source-rebase.json';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';
import { restorePasswordChangeBaseline } from './password-change-source-rebase.js';
import { restoreEmailChangeBaseline } from './email-change-source-rebase.js';
import { restoreSigninPolicyBaseline } from './signin-policy-source-rebase.js';

test.each(entries)('$file permits only the exact lint delta before the original owning oracle', entry => {
	const source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
	expect(createHash('sha256').update(restoreAuthLintBaseline(entry.file, source)).digest('hex')).toBe(entry.baselineSha256);
	const restore = entry.file.endsWith('/settings/email.vue') ? restoreEmailChangeBaseline
		: entry.file.endsWith('/MkSignin.conditional.vue') ? restoreSigninPolicyBaseline : restorePasswordChangeBaseline;
	expect(() => restore(entry.file, source)).not.toThrow();
	for (const edit of entry.edits) {
		const changed = source.slice(0, edit.start) + '/* unreviewed */' + source.slice(edit.start);
		expect(restoreAuthLintBaseline(entry.file, changed)).toBe(changed);
		expect(() => restore(entry.file, changed)).toThrow('Source differs');
	}
	expect(() => restore(entry.file, source + '\n')).toThrow('Source differs');
});
