/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'vue/compiler-sfc';
import * as Vue from 'vue';
import { afterEach, describe, expect, test } from 'vitest';
import { generateCssModuleName } from '../../lib/css-module-names.js';
import { compileTargets, frontendRoot, installCustomCss, sourceFile, targets } from './legacy-css-fixtures.js';

const apps: Vue.App[] = [];
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); window.document.head.innerHTML = ''; window.document.body.innerHTML = ''; });

describe('real legacy style targets', () => {
	test.each(['/tmp/css-release/packages/frontend', '/tmp/日本語/العربية/css-release/packages/frontend'])('compiles and renders all 15 targets at %s', async root => {
		const { js, css } = await compileTargets(root);
		const components = new Function('Vue', `${js}; return CompatFixtures;`)(Vue);
		for (const component of components) {
			const host = window.document.createElement('div');
			window.document.body.append(host);
			const app = Vue.createApp(component);
			// Existing global Mfm name is required by the actual note template.
			// eslint-disable-next-line vue/multi-word-component-names
			app.component('Mfm', Vue.defineComponent({ setup(_props, { attrs, slots }) { return () => Vue.h('span', attrs, slots.default?.()); } }));
			app.component('MkA', Vue.defineComponent({ setup(_props, { attrs, slots }) { return () => Vue.h('a', attrs, slots.default?.()); } }));
			apps.push(app);
			app.mount(host);
		}
		for (const [component, key, selector, tag] of targets) {
			const node = window.document.querySelector(`[data-target="${selector}"]`)!;
			expect(node?.classList.contains(selector), `${component}.${key}`).toBe(true);
			expect(node?.tagName.toLowerCase()).toBe(tag === 'Mfm' ? 'span' : tag === 'MkA' ? 'a' : tag);
			expect(css).toMatch(new RegExp(`\\.${selector}(?=[\\s,{.:#>+~\\[])`));
			for (const other of targets.filter(target => target[2] !== selector)) expect(node.classList.contains(other[2])).toBe(false);
			for (const windows of [false, true]) {
				const filename = resolve(root, sourceFile(component)) + '?vue&type=style&index=0&module=true';
				expect(generateCssModuleName(key, windows ? filename.replaceAll('/', '\\') : filename, windows ? root.replaceAll('/', '\\') : root, true)).toBe(selector);
			}
		}
	}, 30000);

	test('MkTextarea retains its own textarea identity rather than gaining a composer alias', () => {
		const file = sourceFile('ui/components/MkTextarea');
		const source = readFileSync(resolve(frontendRoot, file), 'utf8');
		expect(source).toContain('$style.textarea');
		expect(generateCssModuleName('textarea', resolve(frontendRoot, file), frontendRoot, true)).not.toBe('x8B0D');
	});
});

test('loader retains saved custom CSS after late styles and stylesheet links without an observer loop', async () => {
	const storage = { getItem: () => '.x8B0D { font-family: GenEiAntique-w; font-weight: 500; }' };
	new Function('isSafeMode', 'localStorage', installCustomCss)(false, storage);
	const custom = window.document.head.lastElementChild!;
	const lateStyle = window.document.createElement('style');
	lateStyle.textContent = '.x8B0D { font-family: inherit; }';
	window.document.head.append(lateStyle);
	await new Promise(resolve => window.setTimeout(resolve, 20));
	expect(window.document.head.lastElementChild).toBe(custom);
	const link = window.document.createElement('link');
	window.document.head.append(link);
	link.rel = 'stylesheet';
	await new Promise(resolve => window.setTimeout(resolve, 20));
	expect(window.document.head.lastElementChild).toBe(custom);
	const script = window.document.createElement('script');
	window.document.head.append(script);
	await new Promise(resolve => window.setTimeout(resolve, 20));
	expect(window.document.head.lastElementChild).toBe(script);
	custom.remove();
	await new Promise(resolve => window.setTimeout(resolve, 20));
	expect(window.document.head.contains(custom)).toBe(false);
});

test.each([[true, 'body { color: red; }'], [false, ''], [false, null]])('loader respects safe mode and absent custom CSS (%s, %s)', (safe, css) => {
	new Function('isSafeMode', 'localStorage', installCustomCss)(safe, { getItem: () => css });
	expect(window.document.head.querySelector('style')).toBeNull();
});

// Audit every main-client SFC module, including new sources outside the frozen
// path table. An unrelated class must never acquire any of these 15 hashes.
// Parsing every localized SFC exceeds the default 5s under coverage; keep a
// bounded 30s budget for this exhaustive audit without reducing its scope.
test('reported selectors have one actual module owner across the main frontend', () => {
	const owners = new Map<string, Set<string>>(targets.map(target => [target[2], new Set()]));
	for (const base of [resolve(frontendRoot, 'src'), resolve(frontendRoot, '../features')]) {
		for (const file of readdirSync(base, { recursive: true }).map(String).filter(file => file.endsWith('.vue') && !file.includes('/embed/'))) {
			const filename = resolve(base, file);
			const { descriptor } = parse(readFileSync(filename, 'utf8'));
			for (const style of descriptor.styles.filter(style => style.module)) {
				for (const key of new Set([...style.content.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(match => match[1]))) {
					const selector = generateCssModuleName(key, filename, frontendRoot, true);
					owners.get(selector)?.add(`${filename}.${key}`);
				}
			}
		}
	}
	for (const [component, key, selector] of targets) expect([...owners.get(selector)!]).toEqual([`${resolve(frontendRoot, sourceFile(component))}.${key}`]);
}, 30000);
