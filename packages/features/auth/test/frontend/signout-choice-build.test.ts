/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { pluginVvi } from '../../../../frontend/lib/vite-plugin-vvi.js';
import { pluginNoLegacyLabels } from '../../../../frontend/lib/vite-plugin-no-legacy-labels.js';

const repository = resolve(process.cwd(), '../..');

test('actual signout choice builds with VVI labels and rejects a newly reachable legacy label', async () => {
	const temporary = await mkdtemp(resolve(tmpdir(), 'misskey-signout-vvi-proof-'));
	const root = resolve(temporary, 'packages/frontend');
	const component = resolve(temporary, 'packages/features/auth/frontend/components/MkSignoutChoice.vue');
	const runtime = resolve(temporary, 'packages/features/runtime/frontend/i18n.ts');
	try {
		await Promise.all([mkdir(root, { recursive: true }), mkdir(resolve(component, '..'), { recursive: true }), mkdir(resolve(runtime, '..'), { recursive: true })]);
		await symlink(resolve(repository, 'packages/frontend/node_modules'), resolve(temporary, 'node_modules'), 'dir');
		await writeFile(component, await readFile(resolve(repository, 'packages/features/auth/frontend/components/MkSignoutChoice.vue'), 'utf8'));
		await writeFile(runtime, 'export const i18n = { ts: { logout: "Legacy logout" } };');
		await writeFile(resolve(root, 'Dialog.vue'), '<template><section>{{ title }} {{ text }}<span v-for="item in select.items">{{ item.label }}</span></section></template><script setup>defineProps(["title", "text", "select"]);</script>');
		const entry = resolve(root, 'entry.ts');
		const vviEntry = `export { default as Choice } from '../features/auth/frontend/components/MkSignoutChoice.vue';`;
		await writeFile(entry, vviEntry);
		const config = {
			root, configFile: false as const, logLevel: 'silent' as const,
			plugins: [pluginVvi(), vue(), pluginNoLegacyLabels()],
			resolve: { alias: [
				{ find: '@features/ui/frontend/components/MkDialog.vue', replacement: resolve(root, 'Dialog.vue') },
				{ find: 'vue', replacement: resolve(repository, 'packages/frontend/node_modules/vue/dist/vue.runtime.esm-bundler.js') },
			] },
			build: { write: false, minify: false as const, rolldownOptions: { preserveEntrySignatures: 'strict' as const, input: { choice: entry, i18n: runtime } } },
		};
		await expect(build(config)).resolves.toBeDefined();
		await writeFile(entry, `${vviEntry}\nimport { i18n } from '../features/runtime/frontend/i18n.ts'; console.log(i18n.ts.logout);`);
		await expect(build(config)).rejects.toThrow('Legacy labels remain');
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}, 20_000);
