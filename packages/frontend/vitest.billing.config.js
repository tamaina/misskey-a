/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { pluginFeatureDependencies } from './lib/vite-plugin-feature-dependencies.ts';
import { pluginVvi } from './lib/vite-plugin-vvi.ts';

// Focused form test with the existing SFC translation plugin; no server boot.
export default defineConfig({
	plugins: [pluginFeatureDependencies(fileURLToPath(new URL('.', import.meta.url)), fileURLToPath(new URL('../features', import.meta.url))), pluginVvi(), vue()],
	resolve: { alias: { '@features': fileURLToPath(new URL('../features', import.meta.url)), '@': fileURLToPath(new URL('./src', import.meta.url)), '@@': fileURLToPath(new URL('../frontend-shared', import.meta.url)) }, dedupe: ['vue', 'vite-vue-internationalization'] },
	cacheDir: '../backend/built/peer-vitest-cache',
	test: {
		setupFiles: ['../features/billing/test/frontend/setup.ts'],
		include: ['../features/billing/test/frontend/*.test.ts'],
		environment: 'happy-dom',
		pool: 'threads',
		maxWorkers: 1,
	},
});
