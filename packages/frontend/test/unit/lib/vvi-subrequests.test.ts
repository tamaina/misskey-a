/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { pluginVvi } from '../../../lib/vite-plugin-vvi.js';

function hook(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected a callable Vite hook');
}

describe('VVI SFC subrequest guard', () => {
	test.each(['serve', 'build'])('keeps complete dictionaries after style/template requests during %s', command => {
		const plugin = pluginVvi();
		const root = resolve(process.cwd());
		hook(plugin.configResolved, { root, command, base: '/' });
		hook(plugin.buildStart);
		const id = `${root}/src/components/global/MkResult.vue`;
		hook(plugin.transform, readFileSync(id, 'utf8'), id);
		const localeId = '\0virtual:vite-vue-internationalization/locale/ja-JP';
		const before = hook(plugin.load, localeId);
		expect(before).toContain('/src/components/global/MkResult.vue');
		expect(before).toContain('/src/components/global/MkError.vue');
		for (const query of ['?vue&type=style&index=0&lang.scss', '?vue&type=template', '?vue&type=script&setup=true&lang.ts']) {
			expect(hook(plugin.transform, '/* compiled fragment without locale blocks */', id + query)).toBeNull();
			expect(hook(plugin.load, localeId)).toBe(before);
		}
	});
});
