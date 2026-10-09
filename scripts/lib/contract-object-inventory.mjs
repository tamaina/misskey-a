/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import ts from 'typescript';

const legacyNames = new Set(['looseObject', 'resultObject']);
const isLiteralKey = node => ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
const keyName = node => ts.isIdentifier(node) || isLiteralKey(node) ? node.text : undefined;
const isWrapper = node => ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node);

/** Track references and local alias provenance using lexical symbols; ignore comments/strings. */
export function collectLegacyReferences(sources) {
	const inventory = {};
	for (const [file, text] of sources) {
		if (!/looseObject|resultObject/.test(text)) continue;
		const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
		const options = { noLib: true, noResolve: true, allowJs: true };
		const host = ts.createCompilerHost(options);
		host.getSourceFile = name => name === file ? source : undefined;
		const checker = ts.createProgram([file], options, host).getTypeChecker();
		const aliases = new Map();
		const referenceSymbol = name => ts.isShorthandPropertyAssignment(name.parent) && name.parent.name === name
			? checker.getShorthandAssignmentValueSymbol(name.parent) : checker.getSymbolAtLocation(name);
		const nodes = [];
		function gather(node) { nodes.push(node); ts.forEachChild(node, gather); }
		gather(source);
		function bind(name, kinds) {
			if (!ts.isIdentifier(name) || kinds.size === 0) return false;
			const symbol = referenceSymbol(name);
			if (!symbol) return false;
			const existing = aliases.get(symbol) ?? new Set();
			let changed = false;
			for (const kind of kinds) {
				if (!existing.has(kind)) { existing.add(kind); changed = true; }
			}
			aliases.set(symbol, existing);
			return changed;
		}
		function resolveMemberKind(object, property, seen = new Set()) {
			if (legacyNames.has(property)) return new Set([property]);
			while (isWrapper(object)) object = object.expression;
			if (ts.isIdentifier(object)) {
				const symbol = referenceSymbol(object);
				if (!symbol || seen.has(symbol)) return new Set();
				seen.add(symbol);
				const declaration = symbol.valueDeclaration;
				if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) return resolveMemberKind(declaration.initializer, property, seen);
			}
			if (ts.isObjectLiteralExpression(object)) {
				const member = object.properties.find(member => member.name && keyName(member.name) === property);
				if (member && ts.isPropertyAssignment(member)) return resolveKind(member.initializer);
				if (member && ts.isShorthandPropertyAssignment(member)) return resolveKind(member.name);
			}
			return new Set();
		}
		function resolveKind(node) {
			while (isWrapper(node)) node = node.expression;
			if (ts.isIdentifier(node)) return aliases.get(referenceSymbol(node)) ?? new Set();
			if (ts.isPropertyAccessExpression(node)) return resolveMemberKind(node.expression, node.name.text);
			if (ts.isElementAccessExpression(node) && isLiteralKey(node.argumentExpression)) return resolveMemberKind(node.expression, node.argumentExpression.text);
			if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'bind') return resolveKind(node.expression.expression);
			return new Set();
		}
		for (const node of nodes) {
			if (ts.isImportSpecifier(node)) {
				const imported = node.propertyName?.text ?? node.name.text;
				if (legacyNames.has(imported)) bind(node.name, new Set([imported]));
			}
		}
		let changed;
		do {
			changed = false;
			for (const node of nodes) {
				if (ts.isVariableDeclaration(node) && node.initializer) {
					changed = bind(node.name, resolveKind(node.initializer)) || changed;
				}
				if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
					const property = keyName(node.propertyName ?? node.name);
					const declaration = node.parent.parent;
					if (ts.isVariableDeclaration(declaration) && declaration.initializer) changed = bind(node.name, resolveMemberKind(declaration.initializer, property)) || changed;
				}
				if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
					changed = bind(node.left, resolveKind(node.right)) || changed;
					if (ts.isObjectLiteralExpression(node.left)) {
						for (const member of node.left.properties) {
							if (ts.isPropertyAssignment(member)) changed = bind(member.initializer, resolveMemberKind(node.right, keyName(member.name))) || changed;
							if (ts.isShorthandPropertyAssignment(member)) changed = bind(member.name, resolveMemberKind(node.right, member.name.text)) || changed;
						}
					}
				}
			}
		} while (changed);
		for (const node of nodes) {
			let kinds = new Set();
			if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) kinds = resolveKind(node);
			if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
				const property = keyName(node.propertyName ?? node.name);
				if (legacyNames.has(property)) kinds.add(property);
			}
			if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && ts.isObjectLiteralExpression(node.parent) && ts.isBinaryExpression(node.parent.parent) && node.parent.parent.left === node.parent && node.parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) kinds = resolveMemberKind(node.parent.parent.right, keyName(node.name));
			if (ts.isExportSpecifier(node)) {
				const exported = node.propertyName?.text ?? node.name.text;
				if (legacyNames.has(exported)) kinds.add(exported);
			}
			if (ts.isIdentifier(node)
				&& !ts.isImportSpecifier(node.parent) && !ts.isExportSpecifier(node.parent)
				&& !(ts.isVariableDeclaration(node.parent) && node.parent.name === node)
				&& !ts.isBindingElement(node.parent)
				&& !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) kinds = resolveKind(node);
			if (kinds.size === 0) continue;
			let owner = node;
			while (owner.parent && !ts.isVariableDeclaration(owner) && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
			const name = owner.name?.getText(source) ?? '<anonymous>';
			let expression = node;
			while (isWrapper(expression.parent)) expression = expression.parent;
			if (ts.isCallExpression(expression.parent) && expression.parent.expression === expression) expression = expression.parent;
			const hash = createHash('sha256').update(expression.getText(source)).digest('hex');
			for (const kind of kinds) {
				const key = `${file}|${kind}|${name}|${hash}`;
				inventory[key] = (inventory[key] ?? 0) + 1;
			}
		}
	}
	return Object.fromEntries(Object.entries(inventory).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

export function assertShrinkingInventory(current, previous, exact = true) {
	for (const [key, count] of Object.entries(current)) {
		if (!Number.isInteger(count) || count < 1 || count > (previous[key] ?? 0)) throw new Error(`New legacy object usage: ${key}`);
	}
	if (exact && Object.entries(previous).some(([key, count]) => current[key] !== count)) throw new Error('Legacy object inventory is stale; update it after retiring existing references.');
}
