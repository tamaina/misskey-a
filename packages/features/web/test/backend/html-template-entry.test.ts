/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { Manifest } from 'vite';
import type { Config } from '@/config.js';
import type { MiMeta } from '@features/instance/backend/models/Meta.js';
import type { MetaEntityService } from '@features/instance/backend/serializers/MetaEntityService.js';
import type { CommonData } from '../../backend/templates/_.js';
import { BasePage } from '../../backend/templates/base.js';
import { BaseEmbed } from '../../backend/templates/base-embed.js';
import { HtmlTemplateService } from '../../backend/http/HtmlTemplateService.js';

function collect(manifest: Manifest, entrySource: 'src/_boot_.ts' | 'src/boot.ts'): unknown {
	const service = new HtmlTemplateService(mockDeep<Config>({ rootDir: '/synthetic' }), mockDeep<MiMeta>(), mockDeep<MetaEntityService>());
	return Reflect.apply(Reflect.get(service, 'collectViteAssetFiles'), service, [manifest, entrySource]);
}

for (const entrySource of ['src/_boot_.ts', 'src/boot.ts'] as const) {
	for (const i18nFirst of [true, false]) {
		test(`${entrySource} selects its application entry with i18nFirst=${i18nFirst}`, () => {
			const i18n = ['../features/runtime/frontend/i18n.ts', { file: 'scripts/i18n.js', src: '../features/runtime/frontend/i18n.ts', isEntry: true, css: ['assets/i18n.css'] }] as const;
			const application = [entrySource, { file: 'scripts/application.js', src: entrySource, isEntry: true, imports: ['shared'], css: ['assets/application.css'] }] as const;
			const manifest: Manifest = Object.fromEntries(i18nFirst ? [i18n, application] : [application, i18n]);
			manifest.shared = { file: 'scripts/shared.js', css: ['assets/shared.css'] };
			expect(collect(manifest, entrySource)).toEqual({ entryJs: 'scripts/application.js', css: ['assets/application.css', 'assets/shared.css'], modulePreloads: ['scripts/shared.js'] });
		});
	}
	for (const requested of [undefined, { file: 'scripts/not-entry.js', isEntry: false }]) {
		test(`${entrySource} has no application entry when requested entry is ${requested === undefined ? 'missing' : 'not an entry'}`, () => {
			const manifest: Manifest = { i18n: { file: 'scripts/i18n.js', isEntry: true } };
			if (requested !== undefined) manifest[entrySource] = requested;
			expect(collect(manifest, entrySource)).toEqual({ entryJs: null, css: [], modulePreloads: [] });
		});
	}
}

for (const artifact of ['present', 'absent', 'malformed'] as const) {
	test(`loads real main/embed manifests with a ${artifact} host locale artifact`, async () => {
		const rootDir = await mkdtemp(join(tmpdir(), 'misskey-html-entries-'));
		try {
			for (const [directory, entrySource, entry] of [
				['_frontend_vite_', 'src/_boot_.ts', 'fr-FR/main.fr-FR.js'],
				['_frontend_embed_vite_', 'src/boot.ts', 'scripts/embed.fr-FR.js'],
			]) {
				const output = join(rootDir, 'built', directory);
				await mkdir(output, { recursive: true });
				await writeFile(join(output, 'manifest.json'), JSON.stringify({ [entrySource]: { file: 'scripts/primary.js', isEntry: true, css: ['assets/shared.css'] } }));
				if (artifact !== 'absent') await writeFile(join(output, 'locale-entry-manifest.json'), JSON.stringify({ version: artifact === 'malformed' ? 2 : 1, entries: { 'fr-FR': entry } }));
			}
			const service = new HtmlTemplateService(mockDeep<Config>({ rootDir, frontendManifestExists: true, frontendEmbedManifestExists: true }), mockDeep<MiMeta>(), mockDeep<MetaEntityService>());
			const prepare = () => Reflect.apply(Reflect.get(service, 'prepareFrontendAssets'), service, []);
			if (artifact === 'malformed') {
				await expect(prepare()).rejects.toThrow('Invalid host locale entry manifest');
				// A failed read must not cache a partial fallback for later requests.
				await expect(prepare()).rejects.toThrow('Invalid host locale entry manifest');
			} else {
				await prepare();
				expect(service.frontendViteFiles?.localeEntries).toEqual(artifact === 'present' ? { 'fr-FR': 'fr-FR/main.fr-FR.js' } : undefined);
				expect(service.frontendEmbedViteFiles?.localeEntries).toEqual(artifact === 'present' ? { 'fr-FR': 'scripts/embed.fr-FR.js' } : undefined);
				expect(service.frontendViteFiles?.css).toEqual(['assets/shared.css']);
				expect(service.frontendViteFiles?.entryJs).toBe('scripts/primary.js');
			}
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
}

for (const template of [BasePage, BaseEmbed]) {
	test(`${template.name} serializes locale entry JSON in the existing bootstrap script`, async () => {
		const files = { entryJs: 'scripts/entry.js', css: ['assets/shared.css'], modulePreloads: [] };
		const data: CommonData = { version: 'test', config: mockDeep<Config>({ url: 'http://localhost' }), langs: ['ja-JP'], instanceName: 'Synthetic', icon: null, appleTouchIcon: null, themeColor: null, serverErrorImageUrl: '/fixture.png', infoImageUrl: '/fixture.png', notFoundImageUrl: '/fixture.png', instanceUrl: 'http://localhost', now: 0, federationEnabled: false, frontendViteFiles: files, frontendEmbedViteFiles: files, frontendBootloaderJs: null, frontendEmbedBootloaderJs: null, frontendBootloaderCss: null, frontendEmbedBootloaderCss: null };
		const baseline = await template(data);
		const value = '</script><script>example</script>\u2028&';
		const mapped = await template({ ...data, frontendViteFiles: { ...files, localeEntries: { 'fr-FR': value } }, frontendEmbedViteFiles: { ...files, localeEntries: { 'fr-FR': value } } });
		expect(mapped).not.toContain(value);
		expect(mapped.match(/<script(?: |>)/g)?.length).toBe(baseline.match(/<script(?: |>)/g)?.length);
		expect(mapped.match(/<link rel="stylesheet"[^>]+>/g)).toEqual(baseline.match(/<link rel="stylesheet"[^>]+>/g));
		const serialized = mapped.match(/const CLIENT_LOCALE_ENTRIES = ([^;]+);/)?.[1];
		expect(JSON.parse(serialized ?? 'null')).toEqual({ 'fr-FR': value });
	});
}
