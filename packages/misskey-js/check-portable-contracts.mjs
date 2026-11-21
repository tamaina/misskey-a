import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function checkPortableContracts(features) {
	features = path.resolve(features) + path.sep;
	// Package-owned SDK helper and policy declarations are portable alongside the colocated schema graph.
	const portableHelpers = new Set([
		path.join(features, 'api/shared/api-routing.ts'),
		path.join(features, 'api/backend/transport/policy.types.ts'),
	]);
	const roots = [...fs.globSync('**/*.{contract,schema}.ts', { cwd: features }), ...fs.globSync('**/api.definition.ts', { cwd: features }), ...fs.globSync('api/backend/transport/policy.types.ts', { cwd: features }), 'api/shared/api-routing.ts'];
	const visited = new Set();
	const errors = [];

	function visit(file) {
		if (visited.has(file)) return;
		visited.add(file);
		const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
		function dependency(specifier) {
			if (!specifier.startsWith('.')) {
				if (!['@orpc/contract', 'valibot'].includes(specifier)) errors.push(`${file}: nonportable dependency ${specifier}`);
				return;
			}
			const resolved = path.resolve(path.dirname(file), specifier.replace(/\.js$/, '.ts'));
			if (!resolved.startsWith(features) || (!/(?:\.(contract|schema)|[/\\]api\.definition)\.ts$/.test(resolved) && !portableHelpers.has(resolved))) {
				errors.push(`${file}: imports implementation or undeclared portable module ${specifier}`);
				return;
			}
			if (!fs.existsSync(resolved)) errors.push(`${file}: missing portable dependency ${specifier}`);
			else visit(resolved);
		}
		function walk(node) {
			if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
				if (ts.isStringLiteral(node.moduleSpecifier)) dependency(node.moduleSpecifier.text);
			} else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
				dependency(node.argument.literal.text);
			} else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
				|| (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
				errors.push(`${file}: dynamic imports are forbidden in portable contracts`);
			}
			ts.forEachChild(node, walk);
		}
		walk(source);
	}

	for (const root of roots) visit(path.join(features, root));
	return { errors, modules: visited.size };

}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const { errors, modules } = checkPortableContracts(fileURLToPath(new URL('../features/', import.meta.url)));
	if (errors.length) {
		console.error(errors.join('\n'));
		process.exitCode = 1;
	} else {
		console.log(`Portable contracts: OK (${modules} modules, including type-only imports)`);
	}

}
