/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { pluginVvi } from '../../../lib/vite-plugin-vvi.js';
import { languages } from 'i18n';

function hook(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected a callable Vite hook');
}

describe('VVI SFC subrequest guard', () => {
	test.each(['navigation', 'games/index'])('scans %s feature views before a locale module is first loaded', owner => {
		const root = mkdtempSync(join(tmpdir(), 'misskey-a-vvi-feature-'));
		try {
			mkdirSync(join(root, 'frontend'), { recursive: true });
			mkdirSync(join(root, `features/${owner}/frontend`), { recursive: true });
			const sfc = '<template><p>{{ $locale.sfc.title }}</p></template><locale locale="ja-JP" lang="json">{"title":"Fixture"}</locale>';
			writeFileSync(join(root, `features/${owner}/frontend/Page.vue`), sfc);
			const plugin = pluginVvi();
			hook(plugin.configResolved, { root: join(root, 'frontend'), command: 'serve', base: '/', build: { ssr: false } });
			hook(plugin.buildStart);
			const locale = hook(plugin.load, '\0virtual:vite-vue-internationalization/locale/ja-JP');
			expect(locale).toContain(`/features/${owner}/frontend/Page.vue`);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test.each(['serve', 'build'])('keeps complete dictionaries after style/template requests during %s', async command => {
		const root = mkdtempSync(join(tmpdir(), 'misskey-a-vvi-subrequest-'));
		try {
			const frontend = join(root, 'frontend');
			const components = join(root, 'features/ui/frontend/components');
			mkdirSync(frontend, { recursive: true });
			mkdirSync(components, { recursive: true });
			const id = join(components, 'Result.vue');
			writeFileSync(id, '<template><p>{{ $locale.sfc.text }}</p></template><locale locale="ja-JP" lang="json">{"text":"Result"}</locale>');
			writeFileSync(join(components, 'Error.vue'), '<template><p>{{ $locale.sfc.text }}</p></template><locale locale="ja-JP" lang="json">{"text":"Error"}</locale>');
			const plugin = pluginVvi();
			hook(plugin.configResolved, { root: frontend, command, base: '/', build: { ssr: false } });
			hook(plugin.buildStart);
			await hook(plugin.transform, readFileSync(id, 'utf8'), id);
			const localeId = '\0virtual:vite-vue-internationalization/locale/ja-JP';
			const before = hook(plugin.load, localeId);
			expect(before).toContain('/features/ui/frontend/components/Result.vue');
			expect(before).toContain('/features/ui/frontend/components/Error.vue');
			for (const query of ['?vue&type=style&index=0&lang.scss', '?vue&type=template', '?vue&type=script&setup=true&lang.ts']) {
				expect(await hook(plugin.transform, '/* compiled fragment without locale blocks */', id + query)).toBeNull();
				expect(hook(plugin.load, localeId)).toBe(before);
			}
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe('main/embed locale scan isolation', () => {
	test.each([false, true])('isolates embed=%s and retains its supported locale loaders', embed => {
		const root = mkdtempSync(join(tmpdir(), 'misskey-a-vvi-host-'));
		try {
			const host = embed ? 'frontend-embed' : 'frontend';
			mkdirSync(join(root, host), { recursive: true });
			mkdirSync(join(root, 'features/demo/frontend/embed'), { recursive: true });
			writeFileSync(join(root, 'features/demo/frontend/Main.vue'), '<locale locale="ja-JP" lang="json">{"main":"Main only"}</locale>');
			writeFileSync(join(root, 'features/demo/frontend/embed/Embed.vue'), '<locale locale="ja-JP" lang="json">{"embed":"Embed only"}</locale>');
			mkdirSync(join(root, 'features/games/index/frontend/embed'), { recursive: true });
			writeFileSync(join(root, 'features/games/index/frontend/Main.vue'), '<locale locale="ja-JP" lang="json">{"nested":"Nested main"}</locale>');
			writeFileSync(join(root, 'features/games/index/frontend/embed/Embed.vue'), '<locale locale="ja-JP" lang="json">{"private":"Nested embed"}</locale>');
			mkdirSync(join(root, 'features/games/test/frontend'), { recursive: true });
			writeFileSync(join(root, 'features/games/test/frontend/Fixture.vue'), '<locale locale="ja-JP" lang="json">{"test":"Test fixture only"}</locale>');
			const plugin = pluginVvi({ embed });
			hook(plugin.configResolved, { root: join(root, host), command: 'build', base: '/', build: { ssr: false } });
			hook(plugin.buildStart);
			const primary = hook(plugin.load, '\0virtual:vite-vue-internationalization/locale/ja-JP');
			expect(primary).toContain(embed ? 'Embed only' : 'Main only');
			expect(primary).not.toContain(embed ? 'Main only' : 'Embed only');
			expect(primary).not.toContain('Nested embed');
			expect(primary).not.toContain('Test fixture only');
			if (embed) expect(primary).not.toContain('Nested main');
			else expect(primary).toContain('Nested main');
			if (embed) {
				expect(languages).toHaveLength(28);
				for (const language of languages) {
					expect(hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`)).toEqual(expect.any(String));
				}
			}
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
