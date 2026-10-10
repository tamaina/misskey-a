/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from 'vue';
import {
	createComponentLocale,
	createInternationalization as createTestInternationalization,
} from 'vite-vue-internationalization/runtime';
import { createInternationalization as createAppInternationalization } from 'virtual:vite-vue-internationalization';
import { expect, test } from 'vitest';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import { searchIndexes } from '../../../lib/search-index-options.js';
import { pluginVvi } from '../../../lib/vite-plugin-vvi.js';
import {
	collectFileMarkers,
	pluginCreateSearchIndexVirtualModule,
	MarkerIdAssigner,
} from '../../../lib/vite-plugin-create-search-index.js';

const allocations = readFileSync(resolve('../../docs/architecture/feature-file-allocation.tsv'), 'utf8')
	.trim().split('\n').slice(1).map(line => line.split('\t'));

const serverRulesFile = resolve('../features/instance/frontend/pages/admin/server-rules.vue');
const serverRulesModuleId = '/features/instance/frontend/pages/admin/server-rules.vue';
const serverRulesSource = readFileSync(serverRulesFile, 'utf8');

test('search markers preserve SFC locale references for the public VVI runtime', async () => {
	const componentLocaleRoot = resolve('..');
	const markers = collectFileMarkers(serverRulesFile, serverRulesSource, componentLocaleRoot);
	expect(markers).toMatchObject([{
		id: 'serverRules',
		label: "${createComponentLocale('/features/instance/frontend/pages/admin/server-rules.vue').serverRules}",
		texts: ["${createComponentLocale('/features/instance/frontend/pages/admin/server-rules.vue').description}"],
	}]);

	const vvi = pluginVvi();
	const configureVvi = vvi.configResolved;
	const transformVvi = vvi.transform;
	if (typeof configureVvi !== 'function' || !transformVvi || typeof transformVvi === 'function') {
		throw new Error('Expected VVI config and transform hooks');
	}
	await configureVvi.call({} as never, { root: resolve('.'), command: 'build', base: '/vite/', build: { ssr: false } } as never);
	const transformed = await transformVvi.handler.call({} as never, serverRulesSource, serverRulesFile);
	const transformedCode = typeof transformed === 'string' ? transformed : transformed?.code?.toString() ?? serverRulesSource;
	expect(transformedCode).not.toContain('<locale');
	expect(transformedCode).toContain('$locale.sfc.serverRules');

	const options = {
		...searchIndexes.find(item => item.mainVirtualModule === 'search-index:admin')!,
		componentLocaleRoot,
	};
	const assigner = new MarkerIdAssigner();
	assigner.processFile(serverRulesFile, transformedCode);
	const plugin = pluginCreateSearchIndexVirtualModule(options, assigner);
	const load = plugin.load;
	if (typeof load !== 'function') throw new Error('Expected a load hook');
	const generated = await load.call({ addWatchFile: () => {} } as never, `search-index-individual:${serverRulesFile}.ts`);
	expect(generated).toContain("import { createComponentLocale } from 'vite-vue-internationalization/runtime';");
	expect(generated).toContain("${createComponentLocale('/features/instance/frontend/pages/admin/server-rules.vue').serverRules}");
	expect(generated).toContain("import { i18n } from '@features/runtime/frontend/i18n.js';");
});

test.each([
	['ja-JP', 'サーバールール'],
	['en-US', 'Server rules'],
])('server-rules SFC locale resolves in %s after component locales are ready', async (locale, expected) => {
	const app = createApp({});
	await startComponentLocales(locale, createAppInternationalization, runtime => app.use(runtime));
	expect(createComponentLocale(serverRulesModuleId).serverRules).toBe(expected);
});

test('server-rules SFC locale falls back to the primary locale for a missing active key', async () => {
	const runtime = createTestInternationalization({
		primaryLocale: 'ja-JP',
		initialLocale: 'en-US',
		loaders: {
			'ja-JP': async () => ({ modules: { [serverRulesModuleId]: { serverRules: 'Primary server rules' } } }),
			'en-US': async () => ({ modules: { [serverRulesModuleId]: {} } }),
		},
	});
	await runtime.ready;
	await runtime.loadLocale('ja-JP');
	createApp({}).use(runtime);
	expect(createComponentLocale(serverRulesModuleId).serverRules).toBe('Primary server rules');
});

for (const section of ['settings', 'admin']) {
	test(`${section} search includes every relocated or retained view`, async () => {
		const options = searchIndexes.find(item => item.mainVirtualModule === `search-index:${section}`)!;
		const files = [...globSync(options.targetFilePaths)];
		const matched = new Set(files.map(file => resolve(file)));
		expect(matched.size).toBe(files.length);
		const expected = allocations.filter(([source]) => new RegExp(`^packages/frontend/src/pages/${section}/[^/]+\\.vue$`).test(source));
		expect(expected.length).toBeGreaterThan(0);
		for (const [, , target] of expected) {
			expect(existsSync(resolve('../../', target)), target).toBe(true);
			expect(matched.has(resolve('../../', target)), target).toBe(true);
		}
		for (const view of options.modulesToHmrOnUpdate) expect(existsSync(resolve(view))).toBe(true);
		const plugin = pluginCreateSearchIndexVirtualModule(options, new MarkerIdAssigner());
		const load = plugin.load;
		if (typeof load !== 'function') throw new Error('Expected a load hook');
		const generated = await load.call({} as never, `\0${options.mainVirtualModule}`);
		for (const file of files) expect(generated).toContain(resolve(file));
	});
}

test('privacy runtime labels do not discard static search markers', () => {
	const file = resolve('../features/users/frontend/pages/settings/privacy.vue');
	const assigned = new MarkerIdAssigner().processFile(file, readFileSync(file, 'utf8'))?.code;
	const markers = collectFileMarkers(file, assigned, resolve('..'));
	expect(markers.length).toBeGreaterThan(0);
	expect(markers.some(marker => marker.label.includes('followApprovalTitle'))).toBe(true);
	expect(markers.flatMap(marker => marker.texts).some(text => text.includes('setting.'))).toBe(false);
});

test('an unsupported label only skips that field and retains static labels and siblings', () => {
	const source = `<template><SearchMarker markerId="first" :label="$locale.sfc.title"><SearchLabel>{{ setting.label }}</SearchLabel><SearchText>{{ setting.caption }}</SearchText><SearchText>{{ $locale.sfc.description }}</SearchText></SearchMarker><SearchMarker markerId="second" label="Sibling" /></template>`;
	const markers = collectFileMarkers(serverRulesFile, source, resolve('..'));
	expect(markers).toMatchObject([
		{ id: 'first', label: "${createComponentLocale('/features/instance/frontend/pages/admin/server-rules.vue').title}", texts: ["${createComponentLocale('/features/instance/frontend/pages/admin/server-rules.vue').description}"] },
		{ id: 'second', label: 'Sibling' },
	]);
});

test('virtual VVI transform retains every settings/admin file containing search markers', async () => {
	const vvi = pluginVvi();
	if (typeof vvi.configResolved !== 'function' || !vvi.transform || typeof vvi.transform === 'function') throw new Error('Expected VVI hooks');
	await vvi.configResolved.call({} as never, { root: resolve('.'), command: 'build', base: '/vite/', build: { ssr: false } } as never);
	let checked = 0;
	for (const options of searchIndexes) {
		for (const file of globSync(options.targetFilePaths)) {
			const id = resolve(file);
			const source = readFileSync(id, 'utf8');
			if (!source.includes('<SearchMarker')) continue;
			const transformed = await vvi.transform.handler.call({} as never, source, id);
			const code = typeof transformed === 'string' ? transformed : transformed?.code?.toString() ?? source;
			const assigned = new MarkerIdAssigner().processFile(id, code)?.code;
			expect(collectFileMarkers(id, assigned, resolve('..')).length, file).toBeGreaterThan(0);
			checked++;
		}
	}
	expect(checked).toBeGreaterThanOrEqual(29);
});
