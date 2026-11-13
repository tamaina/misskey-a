/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseAst } from 'rolldown/parseAst';
import { walk } from 'oxc-walker';
import { assertNever } from '../utils.js';
import type { ESTree } from 'rolldown/utils';
import type { Logger } from '../logger.js';

interface LegacyI18nContext {
	i18nFileName: string;
	i18nSymbol: string;
}

export interface LegacyLabelReference {
	type: 'localized' | 'parameterized-function';
	begin: number;
	end: number;
	localizationKey: string[];
}

/** Collect legacy label references for build validation without rewriting code. */
export function collectModifications(sourceCode: string, fileLogger: Logger, context: LegacyI18nContext): LegacyLabelReference[] {
	if (sourceCode === '') return [];
	let programNode: ESTree.Program;
	try {
		programNode = parseAst(sourceCode);
	} catch (err) {
		fileLogger.error(`Failed to parse source code: ${err}`);
		return [];
	}
	if (programNode.sourceType !== 'module') {
		fileLogger.error('Source code is not a module.');
		return [];
	}

	const importSpecifierResult = findImportSpecifier(programNode, context.i18nFileName, context.i18nSymbol);

	switch (importSpecifierResult.type) {
		case 'no-import':
		case 'no-specifiers':
			return [];
		case 'unexpected-specifiers':
			fileLogger.error(`Importing ${context.i18nFileName} found but with unexpected specifiers. Cannot validate legacy labels.`);
			return [];
		case 'specifier':
			fileLogger.debug(`Found import i18n as ${importSpecifierResult.localI18nIdentifier}`);
			break;
	}

	const i18nImport = importSpecifierResult.importNode;
	const localI18nIdentifier = importSpecifierResult.localI18nIdentifier;

	fileLogger.debug(`imports ${context.i18nSymbol} /*i18n*/ as ${localI18nIdentifier}`);

	const codeModifications: LegacyLabelReference[] = [];

	const toSkip = new Set();
	toSkip.add(i18nImport);
	walk(programNode, {
		enter(this, node, parent, ctx) {
			if (toSkip.has(node)) {
				// This is the import specifier, skip processing it
				this.skip();
				return;
			}

			const property = ctx.key;

			// We don't care original name part of the import declaration
			if (node.type === 'ImportDeclaration') this.skip();

			if (node.type === 'Identifier') {
				if (parent == null) throw new Error();
				if (parent.type === 'Property' && !parent.computed && property === 'key') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'MemberExpression' && !parent.computed && property === 'property') return; // we don't care 'id' part of { id: expr }
				if (parent.type === 'ExportSpecifier' && property === 'exported') return; // we don't care 'id' part of { id: expr }
				if (node.name === localI18nIdentifier) {
					// the use of identifier is either direct reference to i18n, or unsupported conflict of the identifier, which should report error.
					fileLogger.error(`${lineCol(sourceCode, node)}: Using i18n identifier "${localI18nIdentifier}" directly. Cannot validate legacy labels.`);
				}
			} else if (node.type === 'MemberExpression') {
				const i18nPath = parseI18nPropertyAccess(node);
				if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] === 'ts') {
					if (parent != null && parent.type === 'CallExpression' && property === 'callee') return; // we don't want to process `i18n.ts.property.stringBuiltinMethod()`
					if (i18nPath.at(-1)?.startsWith('_')) fileLogger.debug(`found i18n grouped property access ${i18nPath.join('.')}`);
					else fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n property access ${i18nPath.join('.')}`);
					// it's i18n.ts.propertyAccess
					// i18n.ts.* will always be resolved to string or object containing strings
					codeModifications.push({
						type: 'localized',
						begin: node.start,
						end: node.end,
						localizationKey: i18nPath.slice(1), // remove 'ts' prefix
					});
					this.skip();
				} else if (i18nPath != null && i18nPath.length >= 2 && i18nPath[0] === 'tsx') {
					// Detect formatter references as well as calls (`i18n.tsx.property(parameters)`).
					fileLogger.debug(`${lineCol(sourceCode, node)}: found i18n function access (object) ${i18nPath.join('.')}`);
					codeModifications.push({
						type: 'parameterized-function',
						begin: node.start,
						end: node.end,
						localizationKey: i18nPath.slice(1), // remove 'tsx' prefix
					});
					this.skip();
				}
			}

			// Scope check
			if (node.type === 'FunctionDeclaration'
				|| node.type === 'FunctionExpression'
				|| node.type === 'ArrowFunctionExpression') {
				// if i18n is introduced as the Named Function Expression, interior of the function does not matter
				if (node.id?.name === localI18nIdentifier) this.skip();
				// If there is 'i18n' in the parameters, we care interior of the function
				if (node.params.flatMap(param => declsOfPattern(param)).includes(localI18nIdentifier)) this.skip();

				// We find var declation inside the function and if there are
				if (findFunctionScopeDecls(node).includes(localI18nIdentifier)) this.skip();
			}

			if (node.type === 'BlockStatement') {
				// We find block-scope declaration inside the block, or from parent node if the block is part of for statement or catch clause
				if (findBlockScopeDecls(node).includes(localI18nIdentifier)) this.skip();
			}

			// statements and clauses introduces new variables in variable scope
			if (node.type === 'CatchClause') {
				if (node.param != null) {
					if (declsOfPattern(node.param).includes(localI18nIdentifier)) this.skip();
				}
			} else if (node.type === 'ForStatement') {
				if (node.init?.type === 'VariableDeclaration') {
					if (node.init.declarations.flatMap(x => declsOfPattern(x.id)).includes(localI18nIdentifier)) this.skip();
				}
			} else if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
				if (node.left.type === 'VariableDeclaration') {
					if (node.left.declarations.flatMap(x => declsOfPattern(x.id)).includes(localI18nIdentifier)) this.skip();
				} else {
					if (declsOfPattern(node.left).includes(localI18nIdentifier)) this.skip();
				}
			}
		},
	});

	function parseI18nPropertyAccess(node: ESTree.Expression | ESTree.Super): string[] | null {
		if (node.type === 'Identifier' && node.name === localI18nIdentifier) return []; // i18n itself
		if (node.type !== 'MemberExpression') return null;
		// super.*
		if (node.object.type === 'Super') return null;

		// i18n?.property is not supported
		if (node.optional) return null;

		let id: string | null = null;
		if (node.computed) {
			if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
				id = node.property.value;
			}
			if (node.property.type === 'TemplateLiteral' && node.property.quasis.length === 1) {
				id = node.property.quasis[0].value.cooked;
			}
		} else {
			if (node.property.type === 'Identifier') {
				id = node.property.name;
			}
		}
		// non-constant property access
		if (id == null) return null;

		const parentAccess = parseI18nPropertyAccess(node.object);
		if (parentAccess == null) return null;
		return [...parentAccess, id];
	}

	return codeModifications;
}

function declsOfPattern(pattern: ESTree.BindingPattern | ESTree.ParamPattern | ESTree.ArrayAssignmentTarget | ESTree.ObjectAssignmentTarget | ESTree.AssignmentTargetMaybeDefault | ESTree.AssignmentTargetRest | null): string[] {
	if (pattern == null) return [];
	switch (pattern.type) {
		case 'Identifier':
			return [pattern.name];
		case 'ObjectPattern':
			return pattern.properties.flatMap(prop => {
				switch (prop.type) {
					case 'Property':
						return declsOfPattern(prop.value);
					case 'RestElement':
						return declsOfPattern(prop.argument);
					default:
						assertNever(prop);
				}
			});
		case 'ArrayPattern':
			return pattern.elements.flatMap(p => declsOfPattern(p));
		case 'RestElement':
			return declsOfPattern(pattern.argument);
		case 'AssignmentPattern':
			return declsOfPattern(pattern.left);
		case 'MemberExpression':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
		case 'TSTypeAssertion':
		case 'TSNonNullExpression':
			return []; // not introducing new symbol
		case 'TSParameterProperty':
			throw new Error();
		default:
			assertNever(pattern);
	}
}

function lineCol(sourceCode: string, node: ESTree.Node): string {
	const leading = sourceCode.slice(0, node.start);
	const lines = leading.split('\n');
	const line = lines.length;
	const col = lines[lines.length - 1].length + 1; // +1 for 1-based index
	return `(${line}:${col})`;
}

function findFunctionScopeDecls(fn: ESTree.Function | ESTree.ArrowFunctionExpression): string[] {
	if (fn.body == null) return [];
	const decls: string[] = [];
	walk(fn.body, {
		enter(node) {
			// The only function-scoped symbol declaration in strict mode is 'var'
			// If it's non-strict mode, function declaration will also in function scope.
			if (node.type === 'VariableDeclaration' && node.kind === 'var') {
				decls.push(...node.declarations.flatMap(x => declsOfPattern(x.id)));
			}

			if (node.type === 'FunctionDeclaration'
				|| node.type === 'FunctionExpression'
				|| node.type === 'ArrowFunctionExpression') {
				// The function makes new inner scope
				this.skip();
			}
		},
	});
	return decls;
}

function findBlockScopeDecls(block: ESTree.BlockStatement): string[] {
	const decls: string[] = [];

	for (const body of block.body) {
		walk(body, {
			enter(node) {
				if (node.type === 'VariableDeclaration' && node.kind !== 'var') {
					decls.push(...node.declarations.flatMap(x => declsOfPattern(x.id)));
				} else if (node.type === 'FunctionDeclaration') {
					if (node.id != null) decls.push(node.id.name);
				} else if (node.type === 'ClassDeclaration') {
					if (node.id != null) decls.push(node.id.name);
				}

				if (
					node.type === 'FunctionDeclaration'
					|| node.type === 'FunctionExpression'
					|| node.type === 'ArrowFunctionExpression'
					|| node.type === 'BlockStatement'
					|| node.type === 'CatchClause'
					|| node.type === 'ForStatement'
					|| node.type === 'ForInStatement'
					|| node.type === 'ForOfStatement'
				) {
					// The function makes new inner scope
					this.skip();
				}
			},
		});
	}
	return decls;
}

type SpecifierResult =
	| { type: 'no-import' }
	| { type: 'no-specifiers', importNode: ESTree.ImportDeclaration }
	| { type: 'unexpected-specifiers', importNode: ESTree.ImportDeclaration }
	| { type: 'specifier', localI18nIdentifier: string, importNode: ESTree.ImportDeclaration }
	;

function findImportSpecifier(programNode: ESTree.Program, i18nFileName: string, i18nSymbol: string): SpecifierResult {
	const imports = programNode.body.filter(x => x.type === 'ImportDeclaration');
	const importNode = imports.find(x => x.source.value === `./${i18nFileName}`);
	if (!importNode) return { type: 'no-import' };

	if (importNode.specifiers.length === 0) {
		return { type: 'no-specifiers', importNode };
	}

	// Imports of other exports from a shared i18n chunk are not i18n uses.
	if (importNode.specifiers.some(specifier => specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier')) {
		return { type: 'unexpected-specifiers', importNode };
	}
	const i18nImportSpecifier = importNode.specifiers.find(specifier => specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === i18nSymbol);
	if (!i18nImportSpecifier || i18nImportSpecifier.type !== 'ImportSpecifier') return { type: 'no-import' };
	const localI18nIdentifier = i18nImportSpecifier.local.name;
	return { type: 'specifier', localI18nIdentifier, importNode };
}
