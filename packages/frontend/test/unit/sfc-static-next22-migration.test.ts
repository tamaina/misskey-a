/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync } from 'node:fs';
import { restoreCommonUtilitiesBaseline } from './upstream-common-utilities-source-rebase.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createApp } from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import { describe, expect, test } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale } from 'vite-vue-internationalization/runtime';
import { languages } from 'i18n';
import { locales } from './instance-pilot-locale-catalog.js';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { applyWithLocale } from '../../../frontend-builder/locale-inliner/apply-with-locale.js';
import { blankLogger } from '../../../frontend-builder/logger.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import migrationInputs from './sfc-static-next22-migration.json';
import type { Locale } from './instance-pilot-locale-types.js';
import { restorePilotHistoricalSource, reviewedPilotMessage } from './instance-pilot-locale-metadata.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const MagicString = createRequire(resolve(root, 'packages/frontend-builder/package.json'))('magic-string').default;

function originalValue(language: string, key: string): string {
	const value = key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown>)[part], locales[language]);
	if (typeof value !== 'string') throw new Error(`Non-string locale: ${language}:${key}`);
	return value;
}

function production(message: string): unknown {
	const code = new MagicString('raw');
	applyWithLocale(code, [{ type: 'localized', begin: 0, end: 3, localizationKey: ['message'], localizedOnly: true }], 'en-US', { message } as unknown as Locale, blankLogger);
	return runInNewContext(code.toString());
}

async function activate(language: string) {
	const runtime = createInternationalization({ initialLocale: language });
	await runtime.ready;
	await runtime.loadLocale(language);
	runtime.install(createApp({}));
	return runtime;
}

describe('next22 raw locale migration', () => {
	test('preserves all9856 dictionary values and reverses every source byte', () => {
		let checked = 0;
		for (const entry of migrationInputs) {
			const source = restoreCommonUtilitiesBaseline(entry.file, restorePilotHistoricalSource(entry.file, readFileSync(resolve(root, entry.file), 'utf8')));
			expect(createHash('sha256').update(source).digest('hex')).toBe(entry.migratedSha256);
			const parsed = parse(source, { filename: entry.file });
			expect(parsed.errors).toEqual([]);
			const blocks = parsed.descriptor.customBlocks.filter(block => block.type === 'locale');
			expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
			for (const block of blocks) {
				const dictionary = JSON.parse(block.content) as Record<string, string>;
				expect(Object.keys(dictionary)).toEqual(entry.keys.map(key => key.local));
				for (const key of entry.keys) {
					expect(Buffer.from(dictionary[key.local])).toEqual(Buffer.from(originalValue(String(block.attrs.locale), key.global)));
					checked++;
				}
			}
			let original = source.split('\n<locale lang="json"')[0];
			expect(original).not.toContain('i18n.ts');
			for (const edit of [...entry.edits].reverse()) {
				expect(original.slice(edit.afterStart, edit.afterStart + edit.replacement.length)).toBe(edit.replacement);
				original = original.slice(0, edit.afterStart) + edit.source + original.slice(edit.afterStart + edit.replacement.length);
			}
			expect(createHash('sha256').update(original).digest('hex')).toBe(entry.originalSha256);
		}
		expect(checked).toBe(9856);
	});

	test('transforms every real SFC with the installed VVI plugin and Vue compiler', async () => {
		const plugin = pluginVvi();
		const hook = (value: unknown, ...args: unknown[]): unknown => {
			if (typeof value === 'function') return Reflect.apply(value, {}, args);
			if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
			throw new Error('Expected plugin hook');
		};
		hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
		hook(plugin.buildStart);
		for (const entry of migrationInputs) {
			const file = resolve(root, entry.file);
			const transformed = await hook(plugin.transform, readFileSync(file, 'utf8'), file) as { code: string };
			expect(transformed.code).toContain('createComponentLocale');
			const parsed = parse(transformed.code, { filename: file });
			expect(parsed.errors).toEqual([]);
			expect(compileScript(parsed.descriptor, { id: entry.file, fs: { fileExists: existsSync, readFile: path => readFileSync(path, 'utf8') } }).content).toContain('useLocale');
		}
	}, 30000);

	test('loads every raw VVI string with both legacy runtime and production parity', async () => {
		let checked = 0;
		for (const language of languages) {
			await activate(language);
			for (const entry of migrationInputs) {
				const raw = createComponentLocale(entry.file.replace('packages/', '/'));
				for (const key of entry.keys) {
					expect(key.formatter).toBe(false);
					const message = reviewedPilotMessage(entry.file, language, key.local, originalValue(language, key.global));
					expect(Buffer.from(raw[key.local])).toEqual(Buffer.from(message));
					expect(raw[key.local]).toBe(new I18n({ message }).t('message'));
					expect(raw[key.local]).toBe(production(message));
					checked++;
				}
			}
		}
		expect(checked).toBe(9856);
	}, 30000);
});
