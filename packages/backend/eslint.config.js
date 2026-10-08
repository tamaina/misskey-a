import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import sharedConfig from '../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		ignores: ['**/node_modules', 'built', '@types/**/*', 'migration'],
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
				project: ['./tsconfig.json', './test/tsconfig.json', './test-federation/tsconfig.json'],
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'import/order': ['warn', {
				groups: [
					'builtin',
					'external',
					'internal',
					'parent',
					'sibling',
					'index',
					'object',
					'type',
				],
				pathGroups: [{
					pattern: '@/**',
					group: 'external',
					position: 'after',
				}],
			}],
			'no-restricted-globals': ['error', {
				name: '__dirname',
				message: 'Not in ESModule. Use `import.meta.url` instead.',
			}, {
				name: '__filename',
				message: 'Not in ESModule. Use `import.meta.url` instead.',
			}],
		},
	},
	{
		files: ['**/contract/**/*.ts', '**/shared/**/*.ts', '**/*.contract.ts', '**/*.schema.ts'],
		rules: {
			'no-restricted-imports': ['error', {
				paths: [{ name: 'punycode' }],
				// Colocated contracts are portable; the SDK AST check validates their transitive imports.
				patterns: [
					{ group: ['node:*'], message: 'Portable contracts/shared code cannot import Node APIs.' },
					{ regex: '(?:^|/)backend/(?!.*\\.(?:contract|schema)\\.js$)', message: 'Portable modules can import only colocated contracts/schemas, not server implementation.' },
				],
			}],
		},
	},
];
