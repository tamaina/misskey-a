/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import rebases from './posting-role-source-rebase.json';
import { restorePostingRoleBaseline } from './posting-role-source-rebase.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
test.each(rebases)('$file exact posting-policy edits restore frozen source and reject extra changes', entry => {
	const source = readFileSync(resolve(root, entry.file), 'utf8');
	expect(() => restorePostingRoleBaseline(entry.file, source)).not.toThrow();
	expect(() => restorePostingRoleBaseline(entry.file, source + '\n')).toThrow('Source differs');
});
