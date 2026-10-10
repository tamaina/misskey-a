/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { resolveLocaleAssets } from 'vite-vue-internationalization/ssr';
import { localeEntryManifestFile, parseLocaleEntryManifest } from '../../features/web/shared/locale-entry-manifest.js';
import type { LocaleAssetManifest } from 'vite-vue-internationalization/ssr';
import type { Plugin, ResolvedConfig } from 'vite';

/** Keep the backend independent of VVI's runtime and manifest representation. */
export function pluginHostLocaleEntries(options: { embed?: boolean } = {}): Plugin {
	let config: ResolvedConfig;
	return {
		name: 'misskey-host-locale-entries',
		apply: 'build',
		configResolved(resolved) {
			config = resolved;
		},
		async closeBundle() {
			// VVI emits its manifest in writeBundle; closeBundle runs after all writers.
			const outDir = resolve(config.root, config.build.outDir);
			const manifest: LocaleAssetManifest = JSON.parse(await readFile(resolve(outDir, '.vite/internationalization-manifest.json'), 'utf8'));
			const entry = `${basename(config.root)}/src/${options.embed ? 'boot' : '_boot_'}.ts`;
			const entries: Record<string, string> = {};
			let stylesheets: string[] | undefined;
			for (const locale of manifest.locales) {
				const assets = resolveLocaleAssets(manifest, { locale, entry });
				const css = assets.stylesheets.map(asset => asset.file).sort();
				if (stylesheets && JSON.stringify(css) !== JSON.stringify(stylesheets)) throw new Error('Host templates require locale-independent initial CSS');
				stylesheets = css;
				if (!assets.entry.file.startsWith('scripts/')) throw new Error('Unexpected host entry directory');
				// Main's existing LocaleInliner copies scripts into language directories.
				entries[locale] = options.embed ? assets.entry.file : `${locale}/${assets.entry.file.slice('scripts/'.length)}`;
			}
			await writeFile(resolve(outDir, localeEntryManifestFile), JSON.stringify(parseLocaleEntryManifest({ version: 1, entries })));
		},
	};
}
