/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import * as ts from 'typescript';

const packagesRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function sources(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : [];
	});
}

test('JSON metadata no longer exports a payload type interpreter', () => {
	const source = readFileSync(new URL('../../../../features/api/backend/utility/json-schema.ts', import.meta.url), 'utf8');
	expect(source).not.toMatch(/\b(?:SchemaType|SchemaTypeDef|ObjType|ObjectSchemaTypeDef|UnionSchemaType)\b/);
	expect(source).toContain('export interface Schema');
	expect(source).toContain('export type Obj = Record<string, Schema>');
	expect(source).toContain('import type { packedSchemas }');
});

test('AJV transport requires explicit payload parameters without schema or broad defaults', () => {
	const source = readFileSync(new URL('../../../../features/api/backend/transport/endpoint-base.ts', import.meta.url), 'utf8');
	const ast = ts.createSourceFile('endpoint-base.ts', source, ts.ScriptTarget.Latest, true);
	const endpoint = ast.statements.find((node): node is ts.ClassDeclaration => ts.isClassDeclaration(node) && node.name?.text === 'Endpoint');
	expect(endpoint?.typeParameters?.map(parameter => parameter.name.text)).toEqual(['T', 'Input', 'Output']);
	expect(endpoint?.typeParameters?.every(parameter => parameter.default === undefined)).toBe(true);
	expect(source).toContain('paramDef: Schema');
	expect(source).toContain('ajv.compile<Input>(paramDef)');
});

test('production contracts contain no imports of the retired payload interpreter', () => {
	const files = [sources(join(packagesRoot, 'backend/src')), sources(join(packagesRoot, 'features'))].flat();
	const offenders: string[] = [];
	for (const file of files) {
		if (file.endsWith('.test.ts')) continue;
		const source = readFileSync(file, 'utf8');
		if (/\b(?:SchemaType|SchemaTypeDef|ObjType)\b/.test(source)) offenders.push(file);
	}
	expect(offenders).toEqual([]);
});

test('production transport construction has native witnesses or named compatibility boundaries', () => {
	const files = [sources(join(packagesRoot, 'backend/src')), sources(join(packagesRoot, 'features'))].flat();
	const allowedBases = new Set([
		join(packagesRoot, 'features/api/backend/transport/contract-endpoint.ts'),
		join(packagesRoot, 'features/roles/backend/legacy-role-consumer-endpoint.ts'),
		join(packagesRoot, 'features/auth/backend/legacy-webauthn-registration-consumer-endpoint.ts'),
		join(packagesRoot, 'features/moderation/backend/legacy-admin-user-producer-endpoint.ts'),
	]);
	const witness = join(packagesRoot, 'features/api/backend/transport/contract-transport-endpoint.ts');
	for (const file of files) {
		if (file.endsWith('.test.ts')) continue;
			const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

			function visit(node: ts.Node): void {
			if (ts.isNewExpression(node) && node.expression.getText(ast) === 'Endpoint') {
				expect(file).toBe(witness);
				expect(node.typeArguments).toHaveLength(3);
			}
			if (ts.isHeritageClause(node)) {
				for (const base of node.types) {
					if (base.expression.getText(ast) !== 'Endpoint') continue;
					expect(allowedBases.has(file), file).toBe(true);
					expect(base.typeArguments).toHaveLength(3);
				}
			}
				ts.forEachChild(node, visit);
			}

			visit(ast);
	}
});
