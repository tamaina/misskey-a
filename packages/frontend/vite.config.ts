import path from 'path';
import { createRequire } from 'node:module';
import pluginVue from '@vitejs/plugin-vue';
import { pluginHostLocaleEntries } from './lib/vite-plugin-host-locale-entries.js';
import { pluginNoLegacyLabels } from './lib/vite-plugin-no-legacy-labels.js';
import { pluginVvi } from './lib/vite-plugin-vvi.js';
import { pluginFeatureDependencies } from './lib/vite-plugin-feature-dependencies.js';
import pluginGlsl from 'vite-plugin-glsl';
import { replacePlugin } from 'rolldown/plugins';
import { visualizer } from 'rollup-plugin-visualizer';
import type { PluginOption, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { load as loadYaml } from 'js-yaml';
import { promises as fsp } from 'fs';

import locales from 'i18n';
import meta from '../../package.json';
import packageInfo from './package.json' with { type: 'json' };
import { generateCssModuleName, hash, toBase62 } from './lib/css-module-names.js';
export { hash, toBase62, BASE62_DIGITS } from './lib/css-module-names.js';
import pluginUnwindCssModuleClassName from './lib/rollup-plugin-unwind-css-module-class-name.js';
import pluginJson5 from './lib/vite-plugin-json5.js';
import { searchIndexes } from './lib/search-index-options.js';
export { searchIndexes } from './lib/search-index-options.js';
import pluginCreateSearchIndex from './lib/vite-plugin-create-search-index.js';
import pluginWatchLocales from './lib/vite-plugin-watch-locales.js';
import { pluginRemoveUnrefI18n } from '../frontend-builder/rollup-plugin-remove-unref-i18n.js';
import { Features } from 'lightningcss';

const fluentEmojiDirectory = path.dirname(createRequire(import.meta.url).resolve('@misskey-dev/emoji-assets/fluent-emoji/1f3c6.png'));
const frontendDependencyAliases = {
	buraha: createRequire(import.meta.url).resolve('buraha'),
};

const url = process.env.NODE_ENV === 'development' ? (loadYaml(await fsp.readFile('../../.config/default.yml', 'utf-8')) as any).url : null;
const host = url ? (new URL(url)).hostname : undefined;

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.json5', '.svg', '.sass', '.scss', '.css', '.vue'];

function getBundleVisualizerPlugin(): PluginOption[] {
	if (process.env.FRONTEND_BUNDLE_VISUALIZER !== 'true') return [];

	const visualizerOptions = {
		title: 'Misskey frontend bundle visualizer',
		gzipSize: true,
		brotliSize: true,
		projectRoot: path.resolve(__dirname, '../..'),
	};
	const plugins = [
		visualizer({
			...visualizerOptions,
			filename: process.env.FRONTEND_BUNDLE_VISUALIZER_FILE,
			template: 'raw-data',
		}) as PluginOption,
	];

	if (process.env.FRONTEND_BUNDLE_VISUALIZER_HTML_FILE != null) {
		plugins.push(visualizer({
			...visualizerOptions,
			filename: process.env.FRONTEND_BUNDLE_VISUALIZER_HTML_FILE,
			template: 'treemap',
		}) as PluginOption);
	}

	return plugins;
}

/**
 * Misskeyのフロントエンドにバンドルせず、CDNなどから別途読み込むリソースを記述する。
 * CDNを使わずにバンドルしたい場合、以下の配列から該当要素を削除orコメントアウトすればOK
 */
const externalPackages = [
	// shiki（コードブロックのシンタックスハイライトで使用中）はテーマ・言語の定義の容量が大きいため、それらはCDNから読み込む
	{
		name: 'shiki',
		match: /^shiki\/(?<subPkg>(langs|themes))$/,
		path(id: string, pattern: RegExp): string {
			const match = pattern.exec(id)?.groups;
			return match
				? `https://esm.sh/shiki@${packageInfo.dependencies.shiki}/${match['subPkg']}`
				: id;
		},
	},
];

export function getConfig(): UserConfig {
	const localesHash = toBase62(hash(JSON.stringify(locales)));

	return {
		base: '/vite/',

		// The console is shared with backend, so clearing the console will also clear the backend log.
		clearScreen: false,

		server: {
			// The backend allows access from any addresses, so vite also allows access from any addresses.
			host: '0.0.0.0',
			allowedHosts: host ? [host] : undefined,
			port: 5173,
			strictPort: true,
			hmr: {
				// バックエンド経由での起動時、Viteは5173経由でアセットを参照していると思い込んでいるが実際は3000から配信される
				// そのため、バックエンドのWSサーバーにHMRのWSリクエストが吸収されてしまい、正しくHMRが機能しない
				// クライアント側のWSポートをViteサーバーのポートに強制させることで、正しくHMRが機能するようになる
				clientPort: 5173,
			},
			headers: { // なんか効かない
				'X-Frame-Options': 'DENY',
			},
		},

		plugins: [
			pluginFeatureDependencies(__dirname, path.resolve(__dirname, '../features')),
			pluginHostLocaleEntries(),
			pluginVvi(),
			pluginWatchLocales(),
			...searchIndexes.map(options => pluginCreateSearchIndex({
				...options,
				// VVI scans from packages/ and uses it as the runtime SFC module-ID root.
				componentLocaleRoot: path.resolve(__dirname, '..'),
			})),
			pluginVue(),
			pluginRemoveUnrefI18n(),
			pluginNoLegacyLabels(),
			pluginUnwindCssModuleClassName(),
			pluginJson5(),
			pluginGlsl({ minify: true }),
			...process.env.NODE_ENV === 'production'
				? [
					replacePlugin({
						'isChromatic()': JSON.stringify(false),
					}, {
						preventAssignment: true,
					}),
				]
				: [],
			...getBundleVisualizerPlugin(),
		],

		resolve: {
			extensions,
			// Feature sources have no package manifests; use this consumer's runtime.
			dedupe: ['vue', 'i18n', 'vitest', 'vite-vue-internationalization'],
			alias: {
				...frontendDependencyAliases,
				'@/': __dirname + '/src/',
				'@@/': __dirname + '/../frontend-shared/',
				'@features/': __dirname + '/../features/',
				'/client-assets/': __dirname + '/assets/',
				'/static-assets/': __dirname + '/../backend/assets/',
				'/fluent-emoji/': fluentEmojiDirectory + '/',
			},
		},

		css: {
			lightningcss: {
				exclude: Features.LightDark,
			},
			modules: {
				generateScopedName(name, filename, _css): string {
					return generateCssModuleName(name, filename, __dirname, process.env.NODE_ENV === 'production');
				},
			},
		},

		define: {
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			__VUE_OPTIONS_API__: false,
			__VUE_PROD_DEVTOOLS__: false,
		},

		build: {
			target: [
				'chrome130',
				'firefox132',
				'safari18.2',
			],
			manifest: 'manifest.json',
			rolldownOptions: {
				experimental: {
					nativeMagicString: true,
				},
				input: {
					i18n: '../features/runtime/frontend/i18n.ts',
					entry: './src/_boot_.ts',
				},
				external: externalPackages.map(p => p.match),
				preserveEntrySignatures: 'allow-extension',
				output: {
					codeSplitting: {
						groups: [{
							name: 'vue',
							test: /node_modules[\\/]vue/,
						}, {
							// split i18n related module to distinct module
							name: 'i18n',
							includeDependenciesRecursively: false,
							test: /i18n\.ts|locale\.ts/,
						}],
					},
					entryFileNames: `scripts/${localesHash}-[hash:8].js`,
					chunkFileNames: `scripts/${localesHash}-[hash:8].js`,
					assetFileNames: `assets/${localesHash}-[hash:8][extname]`,
					paths(id) {
						for (const p of externalPackages) {
							if (p.match.test(id)) {
								return p.path(id, p.match);
							}
						}

						return id;
					},
				},
			},
			cssCodeSplit: true,
			outDir: __dirname + '/../../built/_frontend_vite_',
			assetsDir: '.',
			emptyOutDir: false,
			sourcemap: process.env.NODE_ENV === 'development',
			reportCompressedSize: false,

			// https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
			commonjsOptions: {
				include: [/misskey-js/, /misskey-reversi/, /misskey-bubble-game/, /node_modules/],
			},
		},

		worker: {
			format: 'es',
			rolldownOptions: {
				resolve: { alias: frontendDependencyAliases },
			},
		},
	};
}

const config = defineConfig(({ command, mode }) => getConfig());

export default config;
