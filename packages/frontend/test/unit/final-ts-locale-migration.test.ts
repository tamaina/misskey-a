/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, createComponentLocale, createComponentLocalizer, useLocale } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import type { ParameterizedString } from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import proof from './final-ts-locale-migration.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const hash = (source: string) => createHash('sha256').update(source).digest('hex');
function at(value: unknown, path: string[]): unknown {
	for (const key of path) {
		if (!value || typeof value !== 'object') throw new Error(`Missing path: ${path.join('.')}`);
		value = Reflect.get(value, key);
	}
	return value;
}
function leaves(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (!value || typeof value !== 'object') throw new Error('Expected dictionary');
	return Object.values(value).flatMap(leaves);
}
function hook(value: unknown, ...args: unknown[]): unknown {
	if (typeof value === 'function') return Reflect.apply(value, {}, args);
	if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
	throw new Error('Expected Vite hook');
}
const plugin = pluginVvi();
hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
hook(plugin.buildStart);
const owners = new Map<string, string>();
async function ownerScript(file: string): Promise<string> {
	const cached = owners.get(file);
	if (cached) return cached;
	const filename = resolve(root, file);
	const result = await hook(plugin.transform, readFileSync(filename, 'utf8'), filename);
	if (!result || typeof result !== 'object' || !('code' in result) || typeof result.code !== 'string') throw new Error('Expected transformed owner');
	const parsed = parse(result.code, { filename });
	expect(parsed.errors).toEqual([]);
	const script = compileScript(parsed.descriptor, { id: file, fs: { fileExists: existsSync, readFile: path => readFileSync(path, 'utf8') } }).content;
	owners.set(file, script);
	return script;
}
function evaluate(source: string, legacy?: I18n<typeof locales['ja-JP']>): Record<string, unknown> {
	const exports: Record<string, unknown> = {};
	const requireModule = (specifier: string): unknown => {
		if (specifier === 'vue') return { defineComponent: (value: unknown) => value, computed: (value: unknown) => value };
		if (specifier === 'virtual:vite-vue-internationalization') return { createComponentLocale, createComponentLocalizer, useLocale };
		if (specifier.endsWith('/i18n.js')) return { i18n: legacy };
		if (specifier.endsWith('/interpolate-locale-parameters.js')) return { interpolateLocaleParameters };
		if (specifier.startsWith('@features/') && specifier.endsWith('/ts-messages.vue')) {
			const script = owners.get(specifier.replace('@features/', 'packages/features/'));
			if (script === undefined) throw new Error('Owner must be transformed before synchronous module evaluation');
			return evaluate(script);
		}
		return {};
	};
	const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
	runInNewContext(code, { exports, require: requireModule });
	return exports;
}
function invoke(module: Record<string, unknown>, name: string, ...args: unknown[]): unknown {
	const fn = module[name];
	if (typeof fn !== 'function') throw new Error(`Expected callable export: ${name}`);
	return Reflect.apply(fn, undefined, args);
}

function generated(language: string): LocaleBundle {
	const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
	if (typeof source !== 'string') throw new Error('Expected generated locale loader');
	const payload: LocaleBundle = {};
	runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
	return payload;
}

test('all39 TS consumers reverse byte for byte and all17 owners retain exactly9100 effective strings', async () => {
	for (const file of proof.files) {
		let source = readFileSync(resolve(root, file.file), 'utf8');
		expect(hash(source)).toBe(file.migratedSha256);
		for (const edit of [...file.edits].reverse()) {
			expect(source.slice(edit.afterStart, edit.afterStart + edit.replacement.length)).toBe(edit.replacement);
			source = source.slice(0, edit.afterStart) + edit.source + source.slice(edit.afterStart + edit.replacement.length);
		}
		expect(source).toBe(file.originalSource);
		expect(hash(source)).toBe(file.originalSha256);
	}
	let strings = 0;
	for (const owner of proof.owners) {
		const source = readFileSync(resolve(root, owner.file), 'utf8');
		expect(hash(source)).toBe(owner.sha256);
		const blocks = parse(source, { filename: owner.file }).descriptor.customBlocks;
		expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
		for (const block of blocks) {
			const dictionary: unknown = JSON.parse(block.content);
			for (const path of owner.paths) expect(at(dictionary, path)).toEqual(at(locales[String(block.attrs.locale)], path));
			strings += leaves(dictionary).length;
		}
		await ownerScript(owner.file);
	}
	expect(proof.files).toHaveLength(39);
	expect(proof.owners).toHaveLength(17);
	expect(strings).toBe(9100);
}, 30000);

test.each(languages)('actual default owner exports preserve every access and formatter in %s', async language => {
	const payload = generated(language);
	expect(payload.global).toEqual({});
	const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } });
	await runtime.ready;
	await runtime.loadLocale(language);
	setActiveInternationalization(runtime);
	for (const file of proof.files) {
		const module = evaluate(await ownerScript(file.owner));
		const raw = at(module, ['default', '$locale']);
		for (const edit of file.edits) {
			if (!edit.path) continue;
			const value = at(raw, edit.path);
			expect(value).toEqual(at(locales[language], edit.path));
			if (!edit.formatter) continue;
			if (typeof value !== 'string') throw new Error('Expected parameterized message');
			const names = [...value.matchAll(/\{([^}]*)\}/g)].map(match => match[1]);
			for (const sample of [0, 1, -1, 25.5, NaN, Infinity, 'NAME', '$&', "a | b's {x}"]) {
				const values = Object.fromEntries(names.map((name, index) => [name, typeof sample === 'number' ? sample + index : sample]));
				expect(interpolateLocaleParameters(value, values)).toBe(new I18n({ message: value as ParameterizedString<string> }).tsx.message(values));
			}
		}
	}
}, 30000);

test.each(languages)('actual utility modules preserve branching, parameters and captured text in %s', async language => {
	for (const owner of proof.owners) await ownerScript(owner.file);
	const payload = generated(language);
	const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } });
	await runtime.ready;
	await runtime.loadLocale(language);
	setActiveInternationalization(runtime);
	const legacy = new I18n(locales[language]);
	for (const suffix of ['/page-editor/common.ts', '/filters/hms.ts', '/get-note-summary.ts']) {
		const file = proof.files.find(file => file.file.endsWith(suffix));
		if (!file) throw new Error('Missing utility proof');
		const current = evaluate(readFileSync(resolve(root, file.file), 'utf8'));
		const original = evaluate(file.originalSource, legacy);
		if (suffix.endsWith('/common.ts')) expect(invoke(current, 'getPageBlockList')).toEqual(invoke(original, 'getPageBlockList'));
		if (suffix.endsWith('/hms.ts')) for (const value of [0, 1, 999, 1000, 61001, 3661999, -1]) {
			for (const textFormat of ['colon', 'locale']) expect(invoke(current, 'hms', value, { textFormat, enableMs: true })).toBe(invoke(original, 'hms', value, { textFormat, enableMs: true }));
		}
		if (suffix.endsWith('/get-note-summary.ts')) for (const note of [null, { deletedAt: 'date' }, { isHidden: true }, { text: '$& {x}', files: [{}, {}], poll: {}, replyId: 'r', renoteId: 'n' }, { cw: 'CW', text: 'hidden', files: [], replyId: 'r', reply: { text: 'reply' } }]) {
			for (const options of [{}, { showFiles: false, showPoll: false, showReply: false, showRenote: false }]) expect(invoke(current, 'getNoteSummary', note, options)).toBe(invoke(original, 'getNoteSummary', note, options));
		}
	}
}, 30000);
