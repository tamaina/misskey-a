/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { expect, test, vi } from 'vitest';
import { pluginFeatureDependencies } from '../../../lib/vite-plugin-feature-dependencies.js';

const root = resolve('host');
const features = resolve('features');

function setup() {
	const plugin = pluginFeatureDependencies(root, features);
	const hook = plugin.resolveId!;
	const handler = typeof hook === 'function' ? hook : hook.handler;
	const resolver = vi.fn(async () => ({ id: 'resolved-from-host' }));
	return {
		resolver,
		run: (source: string, importer: string | undefined) => handler.call({ resolve: resolver } as never, source, importer, { attributes: {}, isEntry: false }),
	};
}

test('feature bare dependencies resolve from the host and retain request attributes', async () => {
	const { run, resolver } = setup();
	expect(await run('@syuilo/aiscript/interpreter/value.js', `${features}/play/frontend/pages/flash.vue?vue&type=script`)).toEqual({ id: 'resolved-from-host' });
	expect(resolver).toHaveBeenCalledWith('@syuilo/aiscript/interpreter/value.js', resolve(root, 'package.json'), { attributes: {}, isEntry: false, skipSelf: true });
});

test('does not force host versions on transitive package imports', async () => {
	const { run, resolver } = setup();
	expect(await run('@syuilo/aiscript', `${root}/node_modules/legacy-package/index.js`)).toBeNull();
	expect(await run('vue', `${root}/src/app.ts`)).toBeNull();
	expect(await run('vue', undefined)).toBeNull();
	expect(resolver).not.toHaveBeenCalled();
});

test.each(['./child.vue', '/asset.png', '@/store.js', '@@/locale.js', '@features/ui/frontend', 'node:crypto', 'virtual:locales', 'https://example.test/module.js', '\0virtual'])('leaves non-package specifier %s to existing resolvers', async source => {
	const { run, resolver } = setup();
	expect(await run(source, `${features}/ui/frontend/example.ts`)).toBeNull();
	expect(resolver).not.toHaveBeenCalled();
});
