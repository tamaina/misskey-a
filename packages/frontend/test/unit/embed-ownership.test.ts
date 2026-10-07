/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse, compileScript } from 'vue/compiler-sfc';
import { getConfig } from '../../../frontend-embed/vite.config.js';
import ownership from './embed-ownership.json';

const root = resolve(import.meta.dirname, '../../../..');

describe('embed feature ownership', () => {
	test.each(ownership)('$destination preserves the complete source apart from reviewed module paths and typed parameter unwrapping', entry => {
		const expected = entry.rewrites.reduce((source, edit) => source.split(edit.source).join(edit.replacement), entry.originalSource);
		const source = readFileSync(resolve(root, entry.destination), 'utf8');
		expect(source).toBe(expected);
		expect(existsSync(resolve(root, entry.source))).toBe(false);
		if (entry.destination.endsWith('.vue')) {
			const parsed = parse(source, { filename: resolve(root, entry.destination) });
			expect(parsed.errors).toEqual([]);
			if (parsed.descriptor.scriptSetup) expect(compileScript(parsed.descriptor, { id: entry.destination, fs: { fileExists: existsSync, readFile: path => readFileSync(path, 'utf8') } }).content).toBeTruthy();
		}
	});

	test('preserves every embed CSS module identifier from its original application path', () => {
		const modules = getConfig().css?.modules;
		if (!modules || typeof modules.generateScopedName !== 'function') throw new Error('Missing embed CSS module generator');
		for (const entry of ownership.filter(item => item.destination.endsWith('.vue'))) {
			for (const name of ['root', 'more', 'loading', 'image']) {
				expect(modules.generateScopedName(name, resolve(root, entry.destination), '')).toBe(modules.generateScopedName(name, resolve(root, entry.source), ''));
			}
		}
	});
});
