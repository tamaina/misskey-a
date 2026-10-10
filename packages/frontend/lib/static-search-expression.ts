/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ts from 'typescript';

/** Only literals and static locale paths are meaningful in a build-time search index. */
export function evaluateStaticSearchExpression(expression: string, componentLocaleModuleId?: string): unknown {
	const source = `(${expression})`;
	const { diagnostics } = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext } });
	if (diagnostics?.length) return undefined;
	const file = ts.createSourceFile('search-expression.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	if (file.statements.length !== 1) return undefined;
	const statement = file.statements[0];
	if (!ts.isExpressionStatement(statement)) return undefined;

	function memberPath(node: ts.Expression): string[] | undefined {
		if (ts.isParenthesizedExpression(node)) return memberPath(node.expression);
		if (ts.isIdentifier(node)) return [node.text];
		if (ts.isPropertyAccessExpression(node) && !node.questionDotToken) {
			const parent = memberPath(node.expression);
			return parent && [...parent, node.name.text];
		}
		if (ts.isElementAccessExpression(node) && !node.questionDotToken && ts.isStringLiteral(node.argumentExpression)) {
			const parent = memberPath(node.expression);
			return parent && [...parent, node.argumentExpression.text];
		}
		return undefined;
	}

	function quote(value: string): string {
		return "'" + value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029') + "'";
	}

	function evaluate(node: ts.Expression): unknown {
		if (ts.isParenthesizedExpression(node)) return evaluate(node.expression);
		if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
		if (ts.isNumericLiteral(node)) return Number(node.text);
		if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
		if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
		if (node.kind === ts.SyntaxKind.NullKeyword) return null;
		if (ts.isArrayLiteralExpression(node)) {
			const values = node.elements.map(element => ts.isSpreadElement(element) ? undefined : evaluate(element));
			return values.includes(undefined) ? undefined : values;
		}
		const path = memberPath(node);
		let root: string;
		let keys: string[];
		if (path?.[0] === 'i18n' && path.length > 1) {
			root = 'i18n';
			keys = path.slice(1);
		} else if (path?.[0] === '$locale' && path[1] === 'sfc' && path.length > 2 && componentLocaleModuleId != null) {
			root = `createComponentLocale(${quote(componentLocaleModuleId)})`;
			keys = path.slice(2);
		} else {
			return undefined;
		}
		const reference = keys.reduce((previous, key) => /^[a-z][0-9a-z]*$/i.test(key) ? `${previous}.${key}` : `${previous}[${quote(key)}]`, root);
		return '${' + reference + '}';
	}

	return evaluate(statement.expression);
}
