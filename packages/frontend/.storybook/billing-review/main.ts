/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import glsl from 'vite-plugin-glsl';
import { mergeConfig } from 'vite';
import { pluginFeatureDependencies } from '../../lib/vite-plugin-feature-dependencies.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import json5 from '../../lib/vite-plugin-json5.js';
import base from '../main.js';
import type { StorybookConfig } from '@storybook/vue3-vite';

// Isolate billing review from legacy manager addons and the backend config.
export default {
	...base,
	stories: ['../../../features/billing/frontend/{ResidenceSettings,WalletSettings,ServiceSubscriptions,PeerPayments,BillingPurchasePolicy}.stories.ts'],
	staticDirs: [{ from: '../../assets', to: '/client-assets' }, { from: '../../../icons-subsetter/node_modules/@tabler/icons-webfont/dist', to: '/review-icons' }],
	addons: [],
	async viteFinal(config) {
		const root = process.cwd();
		return mergeConfig(config, {
			configFile: false,
			root,
			cacheDir: resolve(root, '../../.codex-local/storybook-vite'),
			plugins: [{ name: 'billing-review-search', resolveId: id => id.startsWith('search-index:') ? `\0${id}` : undefined, load: id => id.startsWith('\0search-index:') ? 'export const searchIndexes = [];' : undefined }, pluginFeatureDependencies(root, resolve(root, '../features')), pluginVvi(), vue(), json5(), glsl()],
			resolve: {
				alias: { '@features': resolve(root, '../features'), '@': resolve(root, 'src'), '@@': resolve(root, '../frontend-shared') },
				dedupe: ['vue', 'i18n', 'vite-vue-internationalization'],
			},
			define: { _VERSION_: JSON.stringify('billing-review'), _LANGS_: JSON.stringify([['ja-JP', '日本語']]), _ENV_: JSON.stringify('development'), _DEV_: true, _PERF_PREFIX_: JSON.stringify('Misskey:') },
			server: { host: '127.0.0.1' },
		});
	},
} satisfies StorybookConfig;
