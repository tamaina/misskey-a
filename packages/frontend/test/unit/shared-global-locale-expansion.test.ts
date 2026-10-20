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
import { historicalRawLocale, flattenCatalog, verifyCatalogHistory } from './catalog-history.js';
import history from './catalog-history.json';
import retention from '../../../i18n/catalog-retention.json';
import { locales, valueAt, verifyPrunedGlobalLocale } from './pruned-global-locale-baseline.js';
import { restoreChannelFederationSourceBaseline } from './channel-federation-source-rebase.js';

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
	for (const reference of source.matchAll(/globalLocale(?:\.value)?\.env\.(\w+)/g)) expect(Object.hasOwn(productionLocales['ja-JP'], reference[1])).toBe(true);
	const transformed = await hook(plugin.transform, source, filename) as { code: string };
	const parsed = parse(transformed.code, { filename });
	expect(parsed.errors).toEqual([]);
	expect(compileScript(parsed.descriptor, { id: owner.file, inlineTemplate: true }).content).toContain('useLocale');
});

test('deleted keys are absent from every source catalog and the effective production catalogs', () => {
	expect(pruning.mappings).toHaveLength(1391);
	for (const language of languages) {
		for (const [path] of pruning.mappings) {
			if ((history.promoted as string[]).includes(String(path))) expect(typeof valueAt(productionLocales[language], String(path))).toBe('string');
			else expect(valueAt(productionLocales[language], String(path))).toBeUndefined();
		}
	}
	for (const file of readdirSync(resolve(root, 'locales')).filter(file => file.endsWith('.yml'))) {
		const raw = load(readFileSync(resolve(root, 'locales', file), 'utf8').replaceAll('\b', ''));
		for (const [path] of pruning.mappings) if (!(history.promoted as string[]).includes(String(path))) expect(valueAt(raw, String(path))).toBeUndefined();
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
		const raw = historicalRawLocale(file.slice(0, -4));
		const pairs = flatten(raw ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
		expect(pairs).toHaveLength(original.after);
		expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe(original.sha256);
	}
});

test('production catalogs contain only documented runtime paths and preserve their historical values', () => {
	for (const file of Object.keys(retained)) {
		const language = file.slice(0, -4);
		const current = (load(readFileSync(resolve(root, 'locales', file), 'utf8').replaceAll('\b', '')) ?? {}) as Parameters<typeof flattenCatalog>[0];
		for (const [path] of flattenCatalog(current)) expect(retention.retainedPaths).toContain(path);
		const promoted = flattenCatalog(current).filter(([path]) => (history.promoted as string[]).includes(path)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
		const expected = Reflect.get(history.promotedRawHashes, language) as { count: number; sha256: string };
		expect(promoted).toHaveLength(expected.count);
		expect(createHash('sha256').update(JSON.stringify(promoted)).digest('hex')).toBe(expected.sha256);
		verifyCatalogHistory(language, flattenCatalog(historicalRawLocale(language)));
	}
	for (const language of languages) {
		for (const path of retention.retainedPaths) expect(valueAt(productionLocales[language], path)).toBe(valueAt(locales[language], path));
	}
	expect(retention.unconfirmedKeys).toEqual([]);
	expect(Object.keys(history.deletedRaw)).toHaveLength(42);
});

test('historical raw fixtures cannot approve changed values or language inventories', () => {
	const pairs = flattenCatalog(historicalRawLocale('ja-JP'));
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += '!';
	expect(() => verifyCatalogHistory('ja-JP', changed)).toThrow('Historical catalog differs');
	expect(() => verifyCatalogHistory('ja-JP', pairs.slice(1))).toThrow('Historical catalog differs');
	expect(() => verifyCatalogHistory('unknown', pairs)).toThrow('Historical catalog differs');
});

test('runtime AST paths including dynamic tails match the documented complete callsite inventory', () => {
	const uses: { file: string; line: number; path: string }[] = [];
	for (const file of ['packages/sw/src/sw.ts', 'packages/sw/src/scripts/create-notification.ts', 'packages/features/notifications/backend/services/NotificationService.ts']) {
		const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
		const chain = (node: ts.Node): string[] | null => {
			if (ts.isIdentifier(node)) return node.text === 'i18n' ? [] : null;
			if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
				const prefix = chain(node.expression);
				if (!prefix) return null;
				return [...prefix, ts.isPropertyAccessExpression(node) ? node.name.text : ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : '*'];
			}
			return null;
		};
		const visit = (node: ts.Node): void => {
			if (ts.isIdentifier(node) && node.text === 'i18n') {
				let outer: ts.Node = node;
				while ((ts.isPropertyAccessExpression(outer.parent) || ts.isElementAccessExpression(outer.parent)) && outer.parent.expression === outer) outer = outer.parent;
				const parts = chain(outer);
				if (parts && ['ts', 'tsx'].includes(parts[0]) && parts.length > 1) uses.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, path: parts.slice(1).join('.') });
			}
			if (ts.isCallExpression(node) && node.expression.getText(source) === 'i18n.t') {
				const argument = node.arguments[0];
				if (!ts.isStringLiteral(argument)) throw new Error(`Unreviewed dynamic locale path: ${file}`);
				uses.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, path: argument.text });
			}
			ts.forEachChild(node, visit);
		};
		visit(source);
	}
	expect(uses).toEqual(retention.runtimeUses);
	expect(uses.some(use => use.path === '_achievements._types.*.title')).toBe(true);
	for (const use of uses) {
		const matches = retention.retainedPaths.filter(path => {
			const actual = path.split('.');
			const expected = use.path.split('.');
			return actual.length === expected.length && actual.every((part, index) => expected[index] === '*' || expected[index] === part);
		});
		expect(matches.length, use.path).toBeGreaterThan(0);
		for (const language of languages) for (const path of matches) expect(valueAt(productionLocales[language], path)).toBe(valueAt(locales[language], path));
	}
	for (const use of retention.sharedUses) {
		const current = readFileSync(resolve(root, use.file), 'utf8');
		const source = use.file === 'packages/features/channels/frontend/pages/channels.vue' ? restoreChannelFederationSourceBaseline(use.file, current) : current;
		expect(source.split('\n')[use.line - 1]).toContain(`.env.${use.path}`);
	}
});
