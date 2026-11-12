/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/vue3-vite';
import { type PluginOption, mergeConfig } from 'vite';
import turbosnap from 'vite-plugin-turbosnap';

const require = createRequire(import.meta.url);

function hasPluginName(plugin: PluginOption, name: string): boolean {
	return !!plugin && typeof plugin === 'object' && !Array.isArray(plugin) && 'name' in plugin && plugin.name === name;
}

const config = {
	stories: [
		'./index.mdx',
		'../../features/*/frontend/**/*.mdx',
		'../../features/*/frontend/**/*.stories.@(js|jsx|ts|tsx)',
	],
	staticDirs: [{ from: '../assets', to: '/client-assets' }, '../public'],
	addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-links')],
	framework: {
		name: getAbsolutePath('@storybook/vue3-vite') as '@storybook/vue3-vite',
		options: {},
	},
	core: {
		disableTelemetry: true,
	},
	async viteFinal(config) {
		const replacePluginForIsChromatic = config.plugins?.findIndex(plugin => hasPluginName(plugin, 'replace')) ?? -1;
		if (~replacePluginForIsChromatic) {
			config.plugins?.splice(replacePluginForIsChromatic, 1);
		}

		//pluginsからcreateSearchIndexを削除、複数あるかもしれないので全て削除
		config.plugins = config.plugins?.filter(plugin => plugin && !hasPluginName(plugin, 'createSearchIndex')) ?? [];

		return mergeConfig(config, {
			resolve: { alias: { '@storybook/test': 'storybook/test' } },
			plugins: [
				{
					// XXX: https://github.com/IanVS/vite-plugin-turbosnap/issues/8
					...(turbosnap as any as typeof turbosnap['default'])({
						rootDir: config.root ?? process.cwd(),
					}),
					name: 'fake-turbosnap',
				},
			],
			build: {
				target: [
					'chrome108',
					'firefox109',
					'safari16',
				],
			},
		});
	},
} satisfies StorybookConfig;
export default config;

function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, 'package.json')));
}
