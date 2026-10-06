/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { pluginVvi } from '../../../lib/vite-plugin-vvi.js';

function hook(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected a callable Vite hook');
}

describe('VVI SFC subrequest guard', () => {
	test('scans sibling feature views before a locale module is first loaded', () => {
		const root = mkdtempSync(join(tmpdir(), 'misskey-a-vvi-feature-'));
		try {
			mkdirSync(join(root, 'frontend/src'), { recursive: true });
			mkdirSync(join(root, 'features/navigation/frontend'), { recursive: true });
			const sfc = '<template><p>{{ $locale.sfc.title }}</p></template><locale locale="ja-JP" lang="json">{"title":"Fixture"}</locale>';
			writeFileSync(join(root, 'frontend/src/Page.vue'), sfc);
			writeFileSync(join(root, 'features/navigation/frontend/Page.vue'), sfc);
			const plugin = pluginVvi();
			hook(plugin.configResolved, { root: join(root, 'frontend'), command: 'serve', base: '/' });
			hook(plugin.buildStart);
			const locale = hook(plugin.load, '\0virtual:vite-vue-internationalization/locale/ja-JP');
			expect(locale).toContain('/frontend/src/Page.vue');
			expect(locale).toContain('/features/navigation/frontend/Page.vue');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test.each(['serve', 'build'])('keeps complete dictionaries after style/template requests during %s', command => {
		const plugin = pluginVvi();
		const root = resolve(process.cwd());
		hook(plugin.configResolved, { root, command, base: '/' });
		hook(plugin.buildStart);
		const id = resolve(root, '../features/ui/frontend/components/global/MkResult.vue');
		hook(plugin.transform, readFileSync(id, 'utf8'), id);
		const localeId = '\0virtual:vite-vue-internationalization/locale/ja-JP';
		const before = hook(plugin.load, localeId);
		expect(before).toContain('/features/ui/frontend/components/global/MkResult.vue');
		expect(before).toContain('/features/ui/frontend/components/global/MkError.vue');
		for (const query of ['?vue&type=style&index=0&lang.scss', '?vue&type=template', '?vue&type=script&setup=true&lang.ts']) {
			expect(hook(plugin.transform, '/* compiled fragment without locale blocks */', id + query)).toBeNull();
			expect(hook(plugin.load, localeId)).toBe(before);
		}
	});
});
