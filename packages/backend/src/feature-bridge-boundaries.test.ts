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
	if (specifier.startsWith('@/')) resolved = path.resolve(backendSourceRoot, specifier.slice(2));
	else if (specifier.startsWith('packages/backend/src/')) resolved = path.resolve(repositoryRoot, specifier);
	else if (specifier.startsWith('./') || specifier.startsWith('../')) resolved = path.resolve(path.dirname(importer), specifier);
	else return null;
	return resolved.replace(/\.(?:tsx?|mts?|cts?|jsx?|mjs|cjs)$/, '');
}

function resolveExistingModule(importer: string, specifier: string): string | null {
	if (specifier.startsWith('@features/')) {
		const featurePath = specifier.slice('@features/'.length).split('/');
		const mappedPath = path.join(featureRoot, ...featurePath, 'index.ts');
		const directPath = path.join(featureRoot, ...featurePath);
		const candidates = [mappedPath, directPath, `${directPath}.ts`, `${directPath}.tsx`, `${directPath}.js`, path.join(directPath, 'index.ts')];
		return candidates.find(candidate => existsSync(candidate)) ?? null;
	}
	const stem = resolvedModuleStem(importer, specifier);
	if (stem == null) return null;
	const candidates = [stem, `${stem}.ts`, `${stem}.tsx`, `${stem}.js`, `${stem}.mjs`, `${stem}.cjs`, path.join(stem, 'index.ts')];
	return candidates.find(candidate => existsSync(candidate)) ?? null;
}

function isFeatureReexportBridge(file: string): boolean {
	const source = readFileSync(file, 'utf8');
	const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
	const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
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
	const bridges = sourceFilesIn(backendSourceRoot).filter(isFeatureReexportBridge).map(file => path.relative(repositoryRoot, file));
	expect(bridges).toEqual([]);
});
