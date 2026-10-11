/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { pluginVvi } from './lib/vite-plugin-vvi.ts';

// Focused form test with the existing SFC translation plugin; no server boot.
export default defineConfig({
	plugins: [pluginVvi(), vue()],
	resolve: { dedupe: ['vue', 'vite-vue-internationalization'] },
	cacheDir: '../backend/built/billing-vitest-cache',
	test: {
		include: ['../features/billing/test/frontend/*.test.ts'],
		environment: 'happy-dom',
		pool: 'threads',
		maxWorkers: 1,
	},
});
