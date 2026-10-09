/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, useLocale, createComponentLocale, createComponentLocalizer } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import proof from './eager-ts-locales.json';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

function ownerMessages(file: string): Record<string, unknown> {
	return Object.fromEntries(parse(readFileSync(resolve(root, file), 'utf8')).descriptor.customBlocks.map(block => [block.attrs.locale, JSON.parse(block.content)]));
}

const driveMessages = ownerMessages(proof.owners.drive.dictionary);
const navbarMessages = ownerMessages(proof.owners.navigation.dictionary);
const transformedOwners = new Map<string, string>();

async function ownerScript(filename: string): Promise<string> {
	const cached = transformedOwners.get(filename);
	if (cached !== undefined) return cached;

	const plugin = pluginVvi();
	hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'serve', base: '/', build: { ssr: false } });
	hook(plugin.buildStart);
	const transformed = await hook(plugin.transform, readFileSync(filename, 'utf8'), filename);
	if (!transformed || typeof transformed !== 'object' || !('code' in transformed) || typeof transformed.code !== 'string') throw new Error('Expected transformed owner SFC');
	const script = compileScript(parse(transformed.code, { filename }).descriptor, { id: filename }).content;
	transformedOwners.set(filename, script);
	return script;
}

function hook(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected a callable Vite hook');
}

function atPath(value: unknown, path: string): string {
	let current = value;
	for (const part of path.split('.')) {
		if (!current || typeof current !== 'object') throw new Error(`Missing dictionary path: ${path}`);
		current = Reflect.get(current, part);
	}
	if (typeof current !== 'string') throw new Error(`Expected raw string: ${path}`);
	return current;
}

function labels(value: unknown, prefix = ''): Record<string, string> {
	if (typeof value === 'string') return { [prefix]: value };
	if (!value || typeof value !== 'object') return {};
	return Object.fromEntries(Object.entries(value).flatMap(([key, nested]) => Object.entries(labels(nested, `${prefix}.${key}`))));
}

/** Execute actual TS source, substituting only browser/GL dependencies. */
function evaluate(source: string, filename: string, legacy?: I18n<typeof locales['ja-JP']>) {
	const result = { exports: {} };
	const menus: unknown[] = [];
	const requireModule = (specifier: string): unknown => {
		if (specifier === 'virtual:vite-vue-internationalization') return { useLocale, createComponentLocale, createComponentLocalizer };
		if (specifier === 'vue') return { reactive: (value: unknown) => value, computed: (value: unknown) => value, defineComponent: (value: unknown) => value };
		if (specifier.endsWith('/i18n.js')) return { i18n: legacy };
		if (specifier.endsWith('.glsl')) return { default: 'shader' };
		if (specifier.endsWith('/ImageCompositor.js')) return { defineImageCompositorFunction: (value: unknown) => value };
		if (specifier.endsWith('/os.js')) return { popupMenu: (value: unknown) => menus.push(value) };
		if (specifier.endsWith('/i.js')) return { $i: null };
		if (specifier.endsWith('/config.js')) return { ui: null };
		if (specifier.startsWith('./') && specifier.endsWith('.vue')) {
			const dependency = resolve(dirname(filename), specifier);
			const script = transformedOwners.get(dependency);
			if (script === undefined) throw new Error('Owner must be transformed before synchronous module evaluation');
			return evaluate(script, dependency).exports;
		}
		if (specifier.startsWith('./') && /locale(?:-host)?\.js$/.test(specifier)) {
			const dependency = resolve(dirname(filename), specifier.replace(/\.js$/, '.ts'));
			return evaluate(readFileSync(dependency, 'utf8'), dependency).exports;
		}
		return {};
	};
	const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
	runInNewContext(code, { exports: result.exports, require: requireModule, window: { location: {} } });
	if ('navbarItemDef' in result.exports) {
		runInNewContext('exports.navbarItemDef.ui.action({ currentTarget: null, target: null });', { exports: result.exports });
	}
	return { exports: result.exports, menus, invokeMenu() {
		if ('navbarItemDef' in result.exports) {
			runInNewContext('exports.navbarItemDef.ui.action({ currentTarget: null, target: null });', { exports: result.exports });
		}
	} };
}

const generatedPlugins = new Map<boolean, ReturnType<typeof pluginVvi>>();

function generated(language: string, embed = false): LocaleBundle {
	let plugin = generatedPlugins.get(embed);
	if (!plugin) {
		plugin = pluginVvi({ embed });
		hook(plugin.configResolved, { root: resolve(root, embed ? 'packages/frontend-embed' : 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
		hook(plugin.buildStart);
		generatedPlugins.set(embed, plugin);
	}
	const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
	if (typeof source !== 'string') throw new Error('Expected generated locale source');
	const payload: LocaleBundle = {};
	runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
	return payload;
}

test('owner dictionaries and reversible source proof contain only the existing eager consumer paths', () => {
	expect(proof.files).toHaveLength(19);
	expect(proof.owners.drive.keys).toHaveLength(60);
	expect(proof.owners.navigation.keys).toHaveLength(25);
	for (const owner of Object.values(proof.owners)) {
		expect(sha256(readFileSync(resolve(root, owner.dictionary), 'utf8'))).toBe(owner.dictionarySha256);
	}
	for (const messages of [driveMessages, navbarMessages]) expect(Object.keys(messages).sort()).toEqual([...languages].sort());
	for (const file of proof.files) {
		let source = readFileSync(resolve(root, file.file), 'utf8');
		expect(source).not.toContain('i18n.ts');
		source = source.replace(file.newImport, file.oldImport).replace(file.setup, '');
		for (const [before, after] of file.rewrites) source = source.split(after).join(before);
		expect(source).toBe(file.originalSource);
		expect(sha256(source)).toBe(file.originalSha256);
	}
});

test.each(languages)('actual generated owner modules and all 19 eager consumers preserve raw bytes in %s', async language => {
	const payload = generated(language);
	expect(payload.global).toEqual({});
	expect(payload.modules?.[proof.owners.drive.host]).toEqual(driveMessages[language]);
	expect(payload.modules?.[proof.owners.navigation.host]).toEqual(navbarMessages[language]);
	const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } });
	await runtime.ready;
	await runtime.loadLocale(language);
	setActiveInternationalization(runtime);
	for (const owner of Object.values(proof.owners)) {
		const raw = useLocale(owner.host).value.sfc;
		for (const path of owner.keys) expect(Buffer.from(atPath(raw, path))).toEqual(Buffer.from(atPath(locales[language], path)));
	}
	// Async SFC transforms must finish before the synchronous CommonJS require shim.
	for (const owner of Object.values(proof.owners)) await ownerScript(resolve(root, owner.dictionary));
	const captured = proof.files.map(file => {
		const filename = resolve(root, file.file);
		const current = evaluate(readFileSync(filename, 'utf8'), filename);
		const original = evaluate(file.originalSource, filename, new I18n(locales[language]));
		expect(labels(current.exports)).toEqual(labels(original.exports));
		expect(labels(current.menus)).toEqual(labels(original.menus));
		return { current, labels: labels(current.exports) };
	});
	const replacement = createInternationalization({ primaryLocale: 'ja-JP', loaders: { 'ja-JP': async () => ({ modules: {} }) } });
	await replacement.ready;
	setActiveInternationalization(replacement);
	for (const entry of captured) {
		expect(labels(entry.current.exports)).toEqual(entry.labels);
		entry.current.invokeMenu();
		if (entry.current.menus.length > 0) expect(labels(entry.current.menus[1])).toEqual(labels(entry.current.menus[0]));
	}
}, 30_000);

test('embed loaders keep eager main owner dictionaries isolated', () => {
	const payload = generated('ja-JP', true);
	for (const owner of Object.values(proof.owners)) expect(payload.modules).not.toHaveProperty(owner.host);
});

test('activation gate delays actual owner access until its payload is successfully loaded', async () => {
	let release!: () => void;
	const blocked = new Promise<void>(resolve => { release = resolve; });
	let loaded = false;
	let evaluated = false;
	const payload = generated('ja-JP');
	for (const owner of Object.values(proof.owners)) await ownerScript(resolve(root, owner.dictionary));
	const started = startComponentLocales('ja-JP', () => createInternationalization({ primaryLocale: 'ja-JP', loaders: { 'ja-JP': async () => { await blocked; loaded = true; return payload; } } }), runtime => {
		expect(loaded).toBe(true);
		setActiveInternationalization(runtime);
		const file = proof.files[0];
		evaluate(readFileSync(resolve(root, file.file), 'utf8'), resolve(root, file.file));
		evaluated = true;
	});
	await Promise.resolve();
	expect(evaluated).toBe(false);
	release();
	await started;
	expect(evaluated).toBe(true);
});
