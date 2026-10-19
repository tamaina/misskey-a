/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import entries from './sudo-settings-source-rebase.json';
import { restoreSudoSettingsBaseline } from './sudo-settings-source-rebase.js';
import { restoreOidcSourceBaseline } from './oidc-source-rebase.js';
import { restoreAuthLintBaseline } from './auth-lint-source-rebase.js';

test.each(entries)('$file reverses only the pinned completion change and rejects every edited boundary', entry => {
	let source = readFileSync(resolve(import.meta.dirname, '../../../..', entry.file), 'utf8');
	source = restoreAuthLintBaseline(entry.file, source);
	if (entry.file === 'packages/features/auth/frontend/pages/settings/security.vue') source = restoreOidcSourceBaseline(entry.file, source);
	const baseline = restoreSudoSettingsBaseline(entry.file, source);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(entry.baselineSha256);
	expect(() => restoreSudoSettingsBaseline(entry.file, source + '\n')).toThrow('Source differs');
	for (const edit of entry.edits) {
		const changed = source.slice(0, edit.start) + '/* unreviewed */' + source.slice(edit.start);
		expect(() => restoreSudoSettingsBaseline(entry.file, changed)).toThrow('Source differs');
	}
});
