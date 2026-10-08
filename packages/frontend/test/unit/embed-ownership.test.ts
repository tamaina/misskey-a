/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse, compileScript } from 'vue/compiler-sfc';
import { getConfig } from '../../../frontend-embed/vite.config.js';
import ownership from './embed-ownership.json';
import locales from './final-screen-locale-migration.json';

const root = resolve(import.meta.dirname, '../../../..');

/** Reverse only the individually reviewed locale edits; retain the frozen ownership fixture. */
function beforeLocaleMigration(file: string, source: string): string {
	const entry = locales.find(entry => entry.file === file);
	if (!entry) return source;
	expect(createHash('sha256').update(source).digest('hex')).toBe(entry.migratedSha256);
	let original = source.slice(0, entry.bodyLength);
	for (const edit of [...entry.edits].reverse()) {
		expect(original.slice(edit.afterStart, edit.afterStart + edit.replacement.length)).toBe(edit.replacement);
		original = original.slice(0, edit.afterStart) + edit.source + original.slice(edit.afterStart + edit.replacement.length);
	}
	expect(createHash('sha256').update(original).digest('hex')).toBe(entry.originalSha256);
	return original;
}


describe('embed feature ownership', () => {
	test.each(ownership)('$destination preserves the complete source apart from reviewed module paths and typed parameter unwrapping', entry => {
		let expected = entry.rewrites.reduce((source, edit) => source.split(edit.source).join(edit.replacement), entry.originalSource);
		const source = readFileSync(resolve(root, entry.destination), 'utf8');
		if (entry.destination === 'packages/features/runtime/frontend/embed/components/I18n.vue') {
			const oldSlots = 'const slots = defineSlots<T extends ParameterizedString<infer R> ? { [K in R]: () => unknown } : NonNullable<unknown>>();';
			const literalSlots = "type LiteralSlotNames<S extends string> = string extends S ? never :\n\tS extends `${string}{${infer Name}}${infer Rest}` ? Name | LiteralSlotNames<Rest> : never;\ntype SlotNames<S extends string> = S extends ParameterizedString<infer R> ? R : LiteralSlotNames<S>;\n\nconst slots = defineSlots<{ [K in SlotNames<T>]: () => unknown }>();";
			expect(expected.split(oldSlots)).toHaveLength(2);
			expected = expected.replace(oldSlots, literalSlots);
		}
		expect(beforeLocaleMigration(entry.destination, source)).toBe(expected);
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
