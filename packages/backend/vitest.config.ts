import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import backendTsconfig from './tsconfig.json' with { type: 'json' };
import sourcePaths from './tsconfig.paths.json' with { type: 'json' };

const dependencyAliases = Object.entries(sourcePaths.compilerOptions.paths)
	.filter(([name]) => !name.includes('*'))
	.map(([name, [target]]) => ({
		// Do not turn package subpaths into filesystem paths that bypass exports.
		find: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'),
		replacement: target.endsWith('.d.ts')
			? fileURLToPath(import.meta.resolve(name))
			: resolve(import.meta.dirname, target),
	}));

// Raise the global EventEmitter listener limit before Vitest wires CLI listeners.
EventEmitter.defaultMaxListeners = 20;

export const baseConfig = defineConfig({
	// Feature-owned backend sources use the same transforms as package-local sources.
	oxc: {
		decorator: {
			legacy: backendTsconfig.compilerOptions.experimentalDecorators,
			emitDecoratorMetadata: backendTsconfig.compilerOptions.emitDecoratorMetadata,
		},
		jsx: { runtime: 'automatic', importSource: backendTsconfig.compilerOptions.jsxImportSource },
	},
	test: {
		dir: import.meta.dirname,
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage',
			include: ['src/**/*.ts'],
			// 型定義ファイルは実行されるコードを持たないので、常に0%として混ざるのを防ぐ
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
		},
		restoreMocks: true,
		testTimeout: 60000,
		maxWorkers: 1,
		logHeapUsage: true,
		vmMemoryLimit: 1024,
		maxConcurrency: 32,
	},
	resolve: {
		alias: [
			...dependencyAliases,
			{ find: '@', replacement: resolve(import.meta.dirname, './src') },
			{ find: '@features', replacement: resolve(import.meta.dirname, '../features') },
		],
	},
});

export default baseConfig;
