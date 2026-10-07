/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import * as ts from 'typescript';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');
const backendSourceRoot = testDirectory;
const featureRoot = path.resolve(repositoryRoot, 'packages/features');
const endpointRegistryPath = path.resolve(backendSourceRoot, 'server/api/endpoint-list.ts');
const expectedRouteOrder = JSON.parse(readFileSync(path.resolve(testDirectory, '../test/fixtures/backend-api-registry-order.json'), 'utf8')) as string[];
const removedBridgePaths = JSON.parse(readFileSync(path.resolve(testDirectory, '../test/fixtures/backend-feature-bridge-removal.json'), 'utf8')) as string[];
const removedBridgeStems = new Set(removedBridgePaths.map(bridgePath => path.resolve(repositoryRoot, bridgePath).replace(/\.tsx?$/, '')));

type ModuleReference = { specifier: string; line: number };

function sourceFilesIn(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (['.git', 'node_modules', 'built', 'dist', 'frontend'].includes(entry.name)) return [];
			return sourceFilesIn(fullPath);
		}
		return /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(entry.name) ? [fullPath] : [];
	});
}

function moduleReferences(file: string): ModuleReference[] {
	const source = readFileSync(file, 'utf8');
	const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
	const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
	const references: ModuleReference[] = [];
	const record = (specifier: string, node: ts.Node) => {
		references.push({ specifier, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
	};
	const visit = (node: ts.Node) => {
		if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
			record(node.moduleSpecifier.text, node.moduleSpecifier);
		} else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteralLike(node.argument.literal)) {
			record(node.argument.literal.text, node.argument.literal);
		} else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
			record(node.arguments[0].text, node.arguments[0]);
		} else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
			record(node.arguments[0].text, node.arguments[0]);
		} else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteralLike(node.moduleReference.expression)) {
			record(node.moduleReference.expression.text, node.moduleReference.expression);
		}
		ts.forEachChild(node, visit);
	};
	visit(ast);
	return references;
}

function resolvedModuleStem(importer: string, specifier: string): string | null {
	let resolved: string;
	if (specifier.startsWith('@features/')) resolved = path.resolve(featureRoot, specifier.slice('@features/'.length));
	else if (specifier.startsWith('@/')) resolved = path.resolve(backendSourceRoot, specifier.slice(2));
	else if (specifier.startsWith('packages/backend/src/')) resolved = path.resolve(repositoryRoot, specifier);
	else if (specifier.startsWith('./') || specifier.startsWith('../')) resolved = path.resolve(path.dirname(importer), specifier);
	else return null;
	return resolved.replace(/\.(?:tsx?|mts?|cts?|jsx?|mjs|cjs)$/, '');
}

function resolveExistingModule(importer: string, specifier: string): string | null {
	const stem = resolvedModuleStem(importer, specifier);
	if (stem == null) return null;
	const candidates = [stem, `${stem}.ts`, `${stem}.tsx`, `${stem}.js`, `${stem}.mjs`, `${stem}.cjs`, path.join(stem, 'index.ts')];
	return candidates.find(candidate => existsSync(candidate)) ?? null;
}

// The host composition registry is not a one-to-one compatibility forwarder.
// Recognize its exact namespace contract, never a general barrel/path exemption.
function isCanonicalEndpointRegistry(file: string, ast: ts.SourceFile): boolean {
	return path.resolve(file) === endpointRegistryPath
		&& ast.statements.length === expectedRouteOrder.length
		&& ast.statements.every((statement, index) => ts.isExportDeclaration(statement)
			&& !statement.isTypeOnly
			&& statement.moduleSpecifier != null
			&& ts.isStringLiteralLike(statement.moduleSpecifier)
			&& statement.exportClause != null
			&& ts.isNamespaceExport(statement.exportClause)
			&& statement.exportClause.name.text === expectedRouteOrder[index]);
}

function isFeatureReexportBridge(file: string, source = readFileSync(file, 'utf8')): boolean {
	const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
	const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
	if (isCanonicalEndpointRegistry(file, ast)) return false;
	if (ast.statements.length === 0 || !ast.statements.every(statement => ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteralLike(statement.moduleSpecifier))) return false;
	return ast.statements.every(statement => {
		if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteralLike(statement.moduleSpecifier)) return false;
		const target = resolveExistingModule(file, statement.moduleSpecifier.text);
		return target != null && path.resolve(target).startsWith(`${featureRoot}${path.sep}`);
	});
}

const sourceFiles = [...new Set([
	...sourceFilesIn(path.resolve(repositoryRoot, 'packages/backend')),
	...sourceFilesIn(featureRoot),
])];

test('removed backend feature bridge paths stay absent and unreferenced', () => {
	const existing = removedBridgePaths.filter(bridgePath => existsSync(path.resolve(repositoryRoot, bridgePath)));
	expect(existing).toEqual([]);

	const references = sourceFiles.flatMap(file => moduleReferences(file).map(reference => ({ file, ...reference })))
		.filter(reference => {
			const stem = resolvedModuleStem(reference.file, reference.specifier);
			return stem != null && removedBridgeStems.has(stem);
		});
	expect(references).toEqual([]);
});

test('backend source has no export-only forwarders into feature modules', () => {
	const bridges = sourceFilesIn(backendSourceRoot).filter(file => isFeatureReexportBridge(file)).map(file => path.relative(repositoryRoot, file));
	expect(bridges).toEqual([]);
});

test('only the complete ordered host namespace registry is a composition exception', () => {
	const source = readFileSync(endpointRegistryPath, 'utf8');
	const parse = (text: string) => ts.createSourceFile(endpointRegistryPath, text, ts.ScriptTarget.Latest, true);
	const ast = parse(source);
	expect(isCanonicalEndpointRegistry(endpointRegistryPath, ast)).toBe(true);
	expect(isCanonicalEndpointRegistry(path.join(backendSourceRoot, 'barrel.ts'), ast)).toBe(false);

	const namespaceExports = expectedRouteOrder.map(route => `export * as '${route}' from './owner.js';`);
	const invalidSources = [
		namespaceExports.slice(1).join('\n'),
		[...namespaceExports].reverse().join('\n'),
		[namespaceExports[0], ...namespaceExports.slice(0, -1)].join('\n'),
		source.replace('export * as', 'export type * as'),
		`export { default } from './owner.js';\n${namespaceExports.slice(1).join('\n')}`,
		`${source}\nconst extra = true;`,
	];
	for (const invalidSource of invalidSources) {
		expect(isCanonicalEndpointRegistry(endpointRegistryPath, parse(invalidSource))).toBe(false);
	}
});

test('feature leaf aliases cannot hide export-only bridges', () => {
	const importer = path.join(backendSourceRoot, 'alias-bridge.ts');
	const specifier = '@features/users/backend/models/User.js';
	expect(resolveExistingModule(importer, specifier)).toBe(path.join(featureRoot, 'users/backend/models/User.ts'));
	expect(resolveExistingModule(importer, '@features/users/backend/missing.js')).toBeNull();
	expect(isFeatureReexportBridge(importer, `export { MiUser } from '${specifier}';`)).toBe(true);
	expect(isFeatureReexportBridge(importer, `export type { MiUser } from '${specifier}';`)).toBe(true);
	expect(isFeatureReexportBridge(importer, `export * as users from '${specifier}';`)).toBe(true);
});
