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

const root = resolve(import.meta.dirname, '../../../..');

test.each(rebases)('$file restores the frozen source and rejects additional source changes', proof => {
	const source = readFileSync(resolve(root, proof.file), 'utf8');
	const restored = restoreSigninPolicyBaseline(proof.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(proof.baselineSha256);
	expect(() => restoreSigninPolicyBaseline(proof.file, source + '\n')).toThrow('Source differs');
	expect(() => restoreSigninPolicyBaseline(proof.file, source.replace(proof.edits[0].current, () => proof.edits[0].current + '/* unreviewed */'))).toThrow('Source differs');
	if (source.includes('<locale')) {
		expect(() => restoreSigninPolicyBaseline(proof.file, source.replace(/(<locale[^>]*>\s*\{\s*)"[^"]+"\s*:/, '$1"unexpected":'))).toThrow('Source differs');
	}
});
