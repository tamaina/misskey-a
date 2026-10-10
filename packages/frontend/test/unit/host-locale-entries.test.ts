/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, test } from 'vitest';
import { pluginHostLocaleEntries } from '../../lib/vite-plugin-host-locale-entries.js';
import { parseLocaleEntryManifest } from '../../../features/web/shared/locale-entry-manifest.js';
import type { ResolvedConfig } from 'vite';

const directories: string[] = [];
afterEach(async () => {
	await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

test.each([false, true])('resolves supported VVI entry variants before the host projection (embed=%s)', async embed => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-host-entries-'));
	directories.push(directory);
	const root = join(directory, embed ? 'frontend-embed' : 'frontend');
	const outDir = join(directory, 'out');
	await mkdir(join(outDir, '.vite'), { recursive: true });
	for (const inline of [false, true]) {
		const entry = `${embed ? 'frontend-embed' : 'frontend'}/src/${embed ? 'boot' : '_boot_'}.ts`;
		const chunk = { file: 'scripts/entry.js', imports: [], dynamicImports: [], css: ['assets/entry.css'], ...(inline ? { locales: { 'ja-JP': { file: 'scripts/entry.ja-JP.js' }, 'fr-FR': { file: 'scripts/entry.fr-FR.js' } } } : {}) };
		await writeFile(join(outDir, '.vite/internationalization-manifest.json'), JSON.stringify({ version: 1, base: '/', primaryLocale: 'ja-JP', locales: ['ja-JP', 'fr-FR'], entries: { [entry]: chunk.file }, modules: {}, chunks: { [chunk.file]: chunk } }));
		const plugin = pluginHostLocaleEntries({ embed });
		if (typeof plugin.configResolved !== 'function' || typeof plugin.closeBundle !== 'function') throw new Error('Unexpected test hooks');
		plugin.configResolved.call({} as never, { root, build: { outDir } } as ResolvedConfig);
		await plugin.closeBundle.call({} as never);
		const result = parseLocaleEntryManifest(JSON.parse(await readFile(join(outDir, 'locale-entry-manifest.json'), 'utf8')));
		expect(result.entries['fr-FR']).toBe(`${embed ? 'scripts' : 'fr-FR'}/entry${inline ? '.fr-FR' : ''}.js`);
		expect(result.entries['ja-JP']).toBe(`${embed ? 'scripts' : 'ja-JP'}/entry${inline ? '.ja-JP' : ''}.js`);
	}
});

test.each([null, { version: 2, entries: {} }, { version: 1, entries: [] }, { version: 1, entries: { 'fr-FR': '../entry.js' } }, { version: 1, entries: { 'fr-FR': '/entry.js' } }, { version: 1, entries: { 'fr-FR': 'https://example.test/entry.js' } }])('rejects malformed host artifact: %j', value => {
	expect(() => parseLocaleEntryManifest(value)).toThrow();
});

test.each(['main', 'embed'])('real %s loader selects the resolved entry and preserves legacy fallback', async app => {
	const embed = app === 'embed';
	const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), `../../../${embed ? 'frontend-embed' : 'frontend'}/public/loader/boot.js`), 'utf8').replace('await import(', 'await importProbe(');
	for (const map of [undefined, { 'ja-JP': 'scripts/entry.ja-JP.js' }, { 'fr-FR': 'scripts/entry.fr-FR.js' }]) {
		const imports: string[] = [];
		const storage = new Map([['lang', 'fr-FR']]);
		const document = { readyState: 'complete', head: { children: [], appendChild() {} }, documentElement: { dir: 'rtl', style: { setProperty() {} }, classList: { add() {} } } };
		await runInNewContext(source, {
			URL, URLSearchParams, window: { document, location: { href: 'http://localhost/', search: '' } }, location: { search: '' }, document, navigator: { language: 'ja-JP' }, localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }, LANGS: ['ja-JP', 'fr-FR', 'en-US'], CLIENT_ENTRY: 'scripts/entry.ja-JP.js', ...(map ? { CLIENT_LOCALE_ENTRIES: map } : {}), console: { error() {} }, importProbe: async (href: string) => imports.push(href),
		});
		expect(imports).toEqual([`${embed ? '/embed_vite/' : '/vite/'}${map?.['fr-FR'] ?? (embed ? 'scripts/entry.ja-JP.js' : 'fr-FR/entry.ja-JP.js')}`]);
		expect(storage.get('lang')).toBe('fr-FR');
		expect(document.documentElement.dir).toBe('rtl');
	}
});
