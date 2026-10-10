/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { restoreCommonUtilitiesBaseline } from './upstream-common-utilities-source-rebase.js';
import { restorePwaShareSourceBaseline } from './pwa-share-source-rebase.js';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, createComponentLocale } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import type { ParameterizedString } from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import proof from './final-screen-locale-migration.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');

function at(value: unknown, path: string): unknown {
	for (const key of path.split('.')) {
		if (!value || typeof value !== 'object') throw new Error(`Missing path: ${path}`);
		value = Reflect.get(value, key);
	}
	return value;
}

function leaves(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (!value || typeof value !== 'object') throw new Error('Expected locale strings');
	return Object.values(value).flatMap(leaves);
}

function hook(value: unknown, ...args: unknown[]): unknown {
	if (typeof value === 'function') return Reflect.apply(value, {}, args);
	if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
	throw new Error('Expected Vite hook');
}

function configured(embed: boolean) {
	const plugin = pluginVvi({ embed });
	hook(plugin.configResolved, { root: resolve(root, embed ? 'packages/frontend-embed' : 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
	hook(plugin.buildStart);
	return plugin;
}

test('all51 screen sources reverse byte for byte and retain all49336 effective locale strings', () => {
	let strings = 0;
	for (const entry of proof) {
		const source = restoreCommonUtilitiesBaseline(entry.file, restorePwaShareSourceBaseline(entry.file, readFileSync(resolve(root, entry.file), 'utf8')));
		expect(hash(source)).toBe(entry.migratedSha256);
		const parsed = parse(source, { filename: entry.file });
		expect(parsed.errors).toEqual([]);
		const blocks = parsed.descriptor.customBlocks.filter(block => block.type === 'locale');
		expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
		for (const block of blocks) {
			const dictionary: Record<string, unknown> = JSON.parse(block.content);
			expect(Object.keys(dictionary)).toEqual(entry.keys.map(key => key.local));
			for (const key of entry.keys) expect(dictionary[key.local]).toEqual(at(locales[String(block.attrs.locale)], key.global));
			strings += leaves(dictionary).length;
		}
		let original = source.slice(0, entry.bodyLength);
		for (const edit of [...entry.edits].reverse()) {
			expect(original.slice(edit.afterStart, edit.afterStart + edit.replacement.length)).toBe(edit.replacement);
			original = original.slice(0, edit.afterStart) + edit.source + original.slice(edit.afterStart + edit.replacement.length);
		}
		expect(hash(original)).toBe(entry.originalSha256);
	}
	expect(proof).toHaveLength(51);
	expect(strings).toBe(49336);
}, 30000);

test('installed VVI and Vue compile every actual main and embed component', async () => {
	const plugins = [configured(false), configured(true)];
	for (const entry of proof) {
		const file = resolve(root, entry.file);
		const transformed = await hook(plugins[Number(entry.file.includes('/embed/'))].transform, readFileSync(file, 'utf8'), file);
		if (!transformed || typeof transformed !== 'object' || !('code' in transformed) || typeof transformed.code !== 'string') throw new Error('Expected transformed SFC');
		expect(transformed.code).toContain('createComponentLocale');
		const parsed = parse(transformed.code, { filename: file });
		expect(parsed.errors).toEqual([]);
		const template = parsed.descriptor.template;
		if (template) expect(compileTemplate({ source: template.content, filename: file, id: entry.file }).errors).toEqual([]);
		expect(compileScript(parsed.descriptor, { id: entry.file, fs: { fileExists: existsSync, readFile: path => readFileSync(path, 'utf8') } }).content).toContain('createComponentLocale');
	}
}, 30000);

test('real main/embed loaders preserve finite selectors, unknown-key fallback and formatter string values in every language', async () => {
	let rawChecks = 0;
	let formatterChecks = 0;
	for (const embed of [false, true]) {
		const plugin = configured(embed);
		for (const language of languages) {
			const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
			if (typeof source !== 'string') throw new Error('Expected generated loader');
			const payload: LocaleBundle = {};
			runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
			const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } });
			await runtime.ready;
			await runtime.loadLocale(language);
			setActiveInternationalization(runtime);
			for (const entry of proof.filter(entry => entry.file.includes('/embed/') === embed)) {
				const raw = createComponentLocale(entry.file.replace('packages/', '/'));
				for (const key of entry.keys) {
					const actual = raw[key.local];
					expect(actual).toEqual(at(locales[language], key.global));
					rawChecks += leaves(actual).length;
					if (actual && typeof actual === 'object') {
						const dictionary = copyLocaleDictionary(actual);
						expect(dictionary).toEqual(at(locales[language], key.global));
						expect(Reflect.get(dictionary, '__unknown_permission_or_type__')).toBeUndefined();
						expect(Reflect.get(dictionary, 'constructor')).toBe(Object);
					}
					if (!key.formatter) continue;
					const messages = typeof actual === 'object' && actual !== null
						? ['remainingDays', 'remainingHours', 'remainingMinutes', 'remainingSeconds'].flatMap(name => leaves(at(actual, name)))
						: leaves(actual);
					for (const message of messages) {
						expect(message.replace(/\{[A-Za-z_$][\w$]*\}/g, '')).not.toContain('{');
						const names = [...message.matchAll(/\{([^}]*)\}/g)].map(match => match[1]);
						for (const value of [0, 1, -1, 25.5, NaN, Infinity, 'NAME', '$&', "a | b's {x}"]) {
							const values = Object.fromEntries(names.map((name, index) => [name, typeof value === 'number' ? value + index : value]));
							const legacy = new I18n({ message: message as ParameterizedString<string> }).tsx.message(values);
							expect(interpolateLocaleParameters(message, values)).toBe(legacy);
							expect(typeof interpolateLocaleParameters(message, values)).toBe('string');
							formatterChecks++;
						}
					}
				}
			}
		}
	}
	expect(rawChecks).toBe(49336);
	expect(formatterChecks).toBe(12096);
}, 30000);
