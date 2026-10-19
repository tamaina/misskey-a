/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import rebases from './signin-policy-source-rebase.json';
import { restoreSigninPolicyBaseline } from './signin-policy-source-rebase.js';
import { restoreConditionalEntryBaseline } from './conditional-entry-source-rebase.js';
import { restoreOidcSourceBaseline } from './oidc-source-rebase.js';
import { restoreSigninProgressBaseline } from './signin-progress-source-rebase.js';
import { restoreSudoSettingsBaseline } from './sudo-settings-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');

test.each(rebases)('$file restores the frozen source and rejects additional source changes', proof => {
	const source = readFileSync(resolve(root, proof.file), 'utf8');
	const restored = restoreSigninPolicyBaseline(proof.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(proof.baselineSha256);
	expect(() => restoreSigninPolicyBaseline(proof.file, source + '\n')).toThrow('Source differs');
	let policySource = source;
	if (proof.file === 'packages/features/auth/frontend/components/MkSignin.vue') policySource = restoreSigninProgressBaseline(proof.file, restoreOidcSourceBaseline(proof.file, restoreConditionalEntryBaseline(proof.file, source)));
	if (proof.file === 'packages/features/auth/frontend/components/MkSignin.conditional.vue') policySource = restoreSudoSettingsBaseline(proof.file, source);
	expect(createHash('sha256').update(policySource).digest('hex')).toBe(proof.currentSha256);
	for (const edit of proof.edits) {
		expect(policySource.slice(edit.start, edit.end)).toBe(edit.current);
		const changed = policySource.slice(0, edit.start) + '/* unreviewed */' + policySource.slice(edit.start);
		expect(() => restoreSigninPolicyBaseline(proof.file, changed)).toThrow('Source differs');
	}
	if (source.includes('<locale')) {
		expect(() => restoreSigninPolicyBaseline(proof.file, source.replace(/(<locale[^>]*>\s*\{\s*)"[^"]+"\s*:/, '$1"unexpected":'))).toThrow('Source differs');
	}
});
