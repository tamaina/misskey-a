/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { baseParse, NodeTypes } from '@vue/compiler-core';
import type { ElementNode, TemplateChildNode } from '@vue/compiler-core';
import { parse } from 'vue/compiler-sfc';
import pluginVue from '@vitejs/plugin-vue';
import { build } from 'vite';
import { generateCssModuleName } from '../../lib/css-module-names.js';
import unwind from '../../lib/rollup-plugin-unwind-css-module-class-name.js';

// Independent historical oracles: pre-feature vite.config.ts hashes
// components/<component>-<key> (and pages/admin/settings-subCaption).
// These are semantic targets, not aliases for MkTextarea.textarea.
export const targets = [
	['notes/components/MkNotePreview', 'header', 'xct11', 'div'],
	['notes/components/MkPostForm', 'text', 'x8B0D', 'textarea'],
	['notes/components/MkNotePreview', 'main', 'xi18j', 'div'],
	['notes/components/MkNote', 'text', 'x48yH', 'div'],
	['notes/components/MkSubNoteContent', 'root', 'xpUJO', 'div'],
	['notes/components/MkNoteDetailed', 'noteContent', 'xFeJ0', 'div'],
	['notes/components/MkNote', 'cw', 'xmqJ1', 'p'],
	['notes/components/MkNoteSub', 'cw', 'xpfPt', 'p'],
	['notes/components/MkNote', 'collapsedRenoteTargetText', 'x7Nkr', 'Mfm'],
	['notes/components/MkNoteHeader', 'username', 'xBLVI', 'div'],
	['notifications/components/MkNotification', 'text', 'xi4PS', 'MkA'],
	['ui/components/MkSwitch', 'caption', 'xekRM', 'p'],
	['ui/components/MkInput', 'caption', 'x5HNp', 'div'],
	['instance/pages/admin/settings', 'subCaption', 'x8uN9', 'div'],
	['ui/components/MkSelect', 'caption', 'xlwzG', 'div'],
] as const;

export const frontendRoot = resolve(import.meta.dirname, '../..');
export const loaderCustomCss = readFileSync(resolve(frontendRoot, 'public/loader/boot.js'), 'utf8').split('\tif (!isSafeMode) {').at(-1)!.split('\n\tasync function addStyle')[0];
export const installCustomCss = `if (!isSafeMode) {${loaderCustomCss}`;

export function sourceFile(component: string): string {
	const [feature, ...rest] = component.split('/');
	return `../features/${feature}/frontend/${rest.join('/')}.vue`;
}

function elements(children: TemplateChildNode[]): ElementNode[] {
	return children.flatMap(node => node.type === NodeTypes.ELEMENT ? [node, ...elements(node.children)] : []);
}

/** Build real module styles and the actual target's class expression in isolation.
 * Unrelated setup, directives and child contents are excluded; Mfm/MkA are
 * rendered with attribute-forwarding stubs, matching their DOM root contract.
 */
export async function compileTargets(root: string) {
	const sources = new Map<string, string>();
	for (const component of new Set(targets.map(target => target[0]))) {
		const file = sourceFile(component);
		const { descriptor } = parse(readFileSync(resolve(frontendRoot, file), 'utf8'));
		const nodes = elements(baseParse(descriptor.template!.content, { isVoidTag: tag => ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag) }).children);
		const template = targets.filter(target => target[0] === component).map(([, key, selector, tag]) => {
			const node = nodes.find(node => node.tag === tag && node.props.some(prop => prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION && prop.arg.content === 'class' && prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION && new RegExp(`\\$style\\.${key}\\b`).test(prop.exp.content)));
			if (!node) throw new Error(`Missing actual ${component}.${key} binding on ${tag}`);
			const binding = node.props.find(prop => prop.type === NodeTypes.DIRECTIVE && prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION && prop.arg.content === 'class')!;
			return `<${tag} ${binding.loc.source} data-target="${selector}">${tag === 'textarea' ? '' : selector}</${tag}>`;
		}).join('\n');
		const styles = descriptor.styles.map(style => `<style${style.module ? ' module' : ''}${style.scoped ? ' scoped' : ''} lang="${style.lang ?? 'css'}">${style.content}</style>`).join('\n');
		sources.set(resolve(root, file), `<template>${template}</template><script setup>defineProps({ collapsed: Boolean, code: Boolean });</script>${styles}`);
	}
	const result = await build({
		configFile: false,
		root,
		cacheDir: resolve(root, '.vite-cache'),
		logLevel: 'silent',
		plugins: [{ name: 'actual-compatibility-targets', load(id) { return sources.get(id); } }, pluginVue(), unwind()],
		css: { modules: { generateScopedName: (name, filename) => generateCssModuleName(name, filename, root, true) } },
		build: {
			write: false,
			minify: true,
			cssMinify: 'lightningcss',
			lib: { entry: resolve(root, 'compatibility-entry.js'), formats: ['iife'], name: 'CompatFixtures', fileName: 'compatibility', cssFileName: 'compatibility' },
			rolldownOptions: { external: ['vue'], output: { globals: { vue: 'Vue' } }, plugins: [{
				name: 'compatibility-entry',
				resolveId(id) {
					if (id === resolve(root, 'compatibility-entry.js') || sources.has(id)) return id;
					return null;
				},
				load(id) {
					if (id !== resolve(root, 'compatibility-entry.js')) return;
					return [...sources.keys()].map((file, index) => `import C${index} from ${JSON.stringify(file)};`).join('\n') + `export default [${[...sources.keys()].map((_, index) => `C${index}`).join(',')}];`;
				},
			}] },
		},
	});
	const bundle = Array.isArray(result) ? result[0] : result;
	if (!('output' in bundle)) throw new Error('Unexpected watched build');
	const output = bundle.output;
	return {
		js: output.filter(item => item.type === 'chunk').map(item => item.code).join('\n'),
		css: output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n'),
	};
}
