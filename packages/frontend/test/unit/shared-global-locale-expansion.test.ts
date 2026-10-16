/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { parse, compileScript } from 'vue/compiler-sfc';
import { load } from 'js-yaml';
import ts from 'typescript';
import { expect, test } from 'vitest';
import { languages, locales as productionLocales } from 'i18n';
import { createInternationalization, setActiveInternationalization, useLocale } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import expansion from './shared-global-locale-expansion.json';
import pruning from './pruned-global-locale-baseline.json';
import retained from './pruned-global-locale-retained.json';
import { locales, valueAt, verifyPrunedGlobalLocale } from './pruned-global-locale-baseline.js';

const root = resolve(import.meta.dirname, '../../../..');

function hook(value: unknown, ...args: unknown[]): unknown {
	if (typeof value === 'function') return Reflect.apply(value, {}, args);
	if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
	throw new Error('Expected VVI hook');
}

const plugin = pluginVvi();
hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
hook(plugin.buildStart);

test('expanded owners resolve the independently frozen original labels in all 28 languages', async () => {
	const bundles = new Map<string, LocaleBundle>();
	for (const language of languages) {
		const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
		if (typeof source !== 'string') throw new Error('Missing locale module');
		const result: LocaleBundle = {};
		runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'result.global = global; result.modules = modules;'), { result });
		bundles.set(language, result);
	}
	const pairs: string[][] = [];
	for (const owner of expansion.owners) {
		for (const language of languages) {
			const bundle = bundles.get(language)!;
			const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => bundle } });
			await runtime.ready;
			setActiveInternationalization(runtime);
			const { sfc, env } = useLocale(owner.file.replace('packages/', '/')).value;
			for (const key of owner.keys) {
				expect(sfc).not.toHaveProperty(key);
				pairs.push([owner.file, language, key, String(env[key])]);
			}
		}
	}
	expect(pairs).toHaveLength(expansion.count);
	expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe(expansion.sha256);
});

test.each(expansion.owners)('$file compiles its real shared template and script references', async owner => {
	const filename = resolve(root, owner.file);
	const source = readFileSync(filename, 'utf8');
	for (const key of owner.keys) expect(source).not.toMatch(new RegExp(`\\$locale(?:\\.value)?\\.sfc\\.${key}\\b`));
	for (const reference of source.matchAll(/globalLocale(?:\.value)?\.env\.(\w+)/g)) expect(owner.keys).toContain(reference[1]);
	const transformed = await hook(plugin.transform, source, filename) as { code: string };
	const parsed = parse(transformed.code, { filename });
	expect(parsed.errors).toEqual([]);
	expect(compileScript(parsed.descriptor, { id: owner.file, inlineTemplate: true }).content).toContain('useLocale');
});

test('deleted keys are absent from every source catalog and the effective production catalogs', () => {
	expect(pruning.mappings).toHaveLength(1391);
	for (const language of languages) {
		for (const [path] of pruning.mappings) expect(valueAt(productionLocales[language], String(path))).toBeUndefined();
	}
	for (const file of readdirSync(resolve(root, 'locales')).filter(file => file.endsWith('.yml'))) {
		const raw = load(readFileSync(resolve(root, 'locales', file), 'utf8').replaceAll('\b', ''));
		for (const [path] of pruning.mappings) expect(valueAt(raw, String(path))).toBeUndefined();
	}
});

test('historical reconstruction rejects changed text, keys and languages', () => {
	const pairs = pruning.mappings.map(([path]): [string, string] => [String(path), String(valueAt(locales['ja-JP'], String(path)))]);
	expect(() => verifyPrunedGlobalLocale('ja-JP', pairs)).not.toThrow();
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += '!';
	expect(() => verifyPrunedGlobalLocale('ja-JP', changed)).toThrow('Pruned global historical text differs');
	expect(() => verifyPrunedGlobalLocale('ja-JP', pairs.slice(1))).toThrow('Pruned global key inventory differs');
	expect(() => verifyPrunedGlobalLocale('unknown', pairs)).toThrow('Pruned global historical text differs');
});

test('all 42 catalogs retain the independently frozen values outside the deleted paths', () => {
	const flatten = (dictionary: unknown, prefix = ''): [string, unknown][] => {
		if (!dictionary || typeof dictionary !== 'object') return [[prefix, dictionary]];
		return Object.entries(dictionary).flatMap(([key, value]) => flatten(value, prefix ? `${prefix}.${key}` : key));
	};
	for (const [file, original] of Object.entries(retained)) {
		const raw = load(readFileSync(resolve(root, 'locales', file), 'utf8').replaceAll('\b', ''));
		const pairs = flatten(raw ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
		expect(pairs).toHaveLength(original.after);
		expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe(original.sha256);
	}
});

test('SW dynamic achievements, notification actions, email and boot catalogs remain available', () => {
	const scopes = ['_achievements', '_notification', '_email', '_bootErrors', '_offlineScreen', '_selfXssPrevention'];
	const actions = ['_lang_', 'reload', 'accept', 'reject', 'antennas', 'blockedUsers', 'clips', 'customEmojis', 'favorites', 'following', 'mutedUsers', 'notes', 'lists', 'markAllAsRead', 'notificationSettings'];
	for (const language of languages) {
		for (const scope of scopes) expect(productionLocales[language][scope]).toEqual(locales[language][scope]);
		for (const action of actions) expect(typeof productionLocales[language][action]).toBe('string');
	}
});

test('all static paths and dynamic prefixes used by SW and email survive catalog pruning', () => {
	const paths = new Set<string>();
	for (const file of ['packages/sw/src/sw.ts', 'packages/sw/src/scripts/create-notification.ts', 'packages/features/notifications/backend/services/NotificationService.ts']) {
		const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
		const visit = (node: ts.Node): void => {
			if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
				const match = node.getText(source).match(/^i18n\.tsx?\??\.([\w$]+(?:\.[\w$]+)*)/);
				if (match) paths.add(match[1]);
			}
			if (ts.isCallExpression(node) && node.expression.getText(source) === 'i18n.t') {
				const argument = node.arguments[0];
				if (!ts.isStringLiteral(argument)) throw new Error(`Unreviewed dynamic email locale path: ${file}`);
				paths.add(argument.text);
			}
			ts.forEachChild(node, visit);
		};
		visit(source);
	}
	expect(paths.has('_achievements._types')).toBe(true);
	// Backend email helpers are currently commented out; their catalog is retained conservatively.
	expect(paths.has('_notification.youWereFollowed')).toBe(true);
	for (const language of languages) for (const path of paths) expect(valueAt(productionLocales[language], path), `${language}:${path}`).toBeDefined();
});
