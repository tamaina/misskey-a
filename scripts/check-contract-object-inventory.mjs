/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { collectLegacyReferences, assertShrinkingInventory } from './lib/contract-object-inventory.mjs';

const inventoryPath = 'scripts/contract-object-inventory.json';
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'packages'], { maxBuffer: 16 * 1024 * 1024 })
	.toString().split('\0').filter(file => /\.[cm]?[jt]sx?$/.test(file) && existsSync(file));
const current = collectLegacyReferences([...new Set(files)].map(file => [file, readFileSync(file, 'utf8')]));
const write = process.argv.includes('--write');
if (existsSync(inventoryPath)) {
	assertShrinkingInventory(current, JSON.parse(readFileSync(inventoryPath, 'utf8')), !write);
} else if (!write) {
	throw new Error('Missing legacy object inventory');
}
const baseIndex = process.argv.indexOf('--base');
if (baseIndex !== -1) {
	const base = process.argv[baseIndex + 1];
	if (!base || base.startsWith('-')) throw new Error('Missing inventory baseline ref');
	const tracked = execFileSync('git', ['ls-tree', '--name-only', base, '--', inventoryPath]).toString().trim();
	if (tracked) {
		const previous = JSON.parse(execFileSync('git', ['show', `${base}:${inventoryPath}`], { maxBuffer: 16 * 1024 * 1024 }).toString());
		assertShrinkingInventory(current, previous, false);
	}
}
if (write) writeFileSync(inventoryPath, JSON.stringify(current, null, 2) + '\n');
const total = Object.values(current).reduce((sum, count) => sum + count, 0);
console.log(`Legacy object inventory: PASS (${total} known references; new usages forbidden)`);
