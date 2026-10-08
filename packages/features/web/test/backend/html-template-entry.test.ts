/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { Manifest } from 'vite';
import type { Config } from '@/config.js';
import type { MiMeta } from '@features/instance/backend/models/Meta.js';
import type { MetaEntityService } from '@features/instance/backend/serializers/MetaEntityService.js';
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
