import { defineConfig } from 'rolldown';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sourcePaths from './tsconfig.paths.json' with { type: 'json' };
import { version as summalyVersion } from '@misskey-dev/summaly';
import type { Plugin, ExternalOption, InputOptions } from 'rolldown';
import { backendDevServerPlugin } from './lib/backend-dev-server.ts';
import { bullmqEsmPlugin } from './lib/bullmq-esm.ts';
import { esmShimPlugin } from './lib/esm-shim.ts';

export default defineConfig((args) => {
	const isWatchMode = args.watch != null && args.watch !== 'false';
	const isE2E = args.e2e != null && args.e2e !== 'false';

	// A successful bundle must not leave unresolved source aliases or JSX runtimes.
	const onLog: NonNullable<InputOptions['onLog']> = (level, log, defaultHandler) => {
		defaultHandler(log.code === 'UNRESOLVED_IMPORT' ? 'error' : level, log);
	};

	// 外部モジュールの判定に使う正規表現。`@/` で始まるものは内部モジュールとみなす
	const allExternalModulesRegex = /^(?!@\/|@features\/|\0)[^.\/](?!:[\/\\])/;

	// 通常のビルド時にexternalとするモジュール
	const externalModules: ExternalOption = [
		/^slacc-.*/,
		// Nest's ESM decorators need the native polyfill initialized before bundled feature imports.
		'reflect-metadata',
		'class-transformer',
		'class-validator',
		/^@sentry\/.*/,
		/^@sentry-internal\/.*/,
		// Misskey uses application contexts and its own Fastify server, not Nest's optional HTTP adapter.
		/^@nestjs\/(?:microservices|websockets|platform-express)(?:\/.*)?$/,
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		'ipaddr.js',
		'file-type',
		// バンドルするとSentryの自動計装が正しく行われなくなるため外しておく
		'pg',
	];

	// Resolve declaration-only aliases before Rolldown applies TypeScript paths.
	const declarationDependencies = new Map(Object.entries(sourcePaths.compilerOptions.paths)
		.filter(([name, [target]]) => !name.includes('*') && /\.d\.[cm]?ts$/.test(target))
		.map(([name]) => [name, fileURLToPath(import.meta.resolve(name))]));
	const declarationDependencyPlugin: Plugin = {
		name: 'backend-declaration-dependencies',
		resolveId(source) {
			return declarationDependencies.get(source) ?? null;
		},
	};

	const define: Record<string, string> = {
		// Summalyのバージョンを埋め込む
		'_SUMMALY_VERSION_': JSON.stringify(summalyVersion),
	};

	if (isE2E) {
		return {
			onLog,
			input: './test-server/entry.ts',
			platform: 'node',
			tsconfig: './test-server/tsconfig.json',
			plugins: [
				declarationDependencyPlugin,
				esmShimPlugin(),
			],
			transform: {
				define,
			},
			output: {
				keepNames: true,
				sourcemap: true,
				// メモリ使用量削減に貢献するが、関数や正規表現のソース文字列がエスケープ表記になる
				// それらに依存する処理が入った場合はここを疑うと良い
				// https://rolldown.rs/reference/Interface.OutputOptions#charset
				charset: 'ascii',
				dir: './built-test',
				cleanDir: true,
				format: 'esm',
			},
			experimental: {
				nativeMagicString: true,
			},
			// node_modulesまでバンドルしてしまうとカバレッジの収集に時間がかかるので全部外す
			external: allExternalModulesRegex,
		};
	} else {
		return {
			onLog,
			input: {
				entry: '../features/boot/backend/node/entry.mts',
				cli: '../features/boot/backend/node/cli.mts',
				config: './src/config.ts',
				postgres: '../features/persistence/backend/postgres.ts',
				'gen-spec': '../features/api/backend/transport/openapi/gen-spec.ts',
				'features/api/pilot': '../features/api/backend/pilot.ts',
				...Object.fromEntries([...globSync('../features/*/{backend,shared}/index.ts')].map(file => [
					file.replace('../', '').replace('/index.ts', ''), file,
				])),
			},
			platform: 'node',
			// Feature sources are outside this package; use the backend-owned transform and path settings.
			tsconfig: './tsconfig.json',
			plugins: [
				declarationDependencyPlugin,
				esmShimPlugin(),
				(isWatchMode ? backendDevServerPlugin() : undefined),
				(isWatchMode ? undefined : bullmqEsmPlugin()),
			],
			transform: {
				define,
			},
			output: {
				keepNames: true,
				minify: !isWatchMode,
				sourcemap: isWatchMode,
				// メモリ使用量削減に貢献するが、関数や正規表現のソース文字列がエスケープ表記になる
				// それらに依存する処理が入った場合はここを疑うと良い
				// https://rolldown.rs/reference/Interface.OutputOptions#charset
				charset: isWatchMode ? 'utf8' : 'ascii',
				dir: './built',
				cleanDir: !isWatchMode,
				format: 'esm',
			},
			watch: {
				include: ['src/**/*.{ts,mts,js,mjs,cjs,tsx,json}', '../features/*/{backend,contract,shared}/**/*.{ts,mts,js,mjs,cjs,tsx,json}'],
				clearScreen: false,
			},
			experimental: { nativeMagicString: true },
			// ビルドの高速化のために、watchモードのときは外部モジュールは全てバンドルしないようにする
			external: isWatchMode ? allExternalModulesRegex : externalModules,
		};
	}
});
