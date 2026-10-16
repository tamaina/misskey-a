/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { isCheckableDeclarationFile } from './check-dts.mjs';

const rootDir = '/repo';

test('detects repository-owned declaration files that should be checked', () => {
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/@types/theme.d.ts`, rootDir), true);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/src/utility/virtual.d.ts`, rootDir), true);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/backend/test/global.d.ts`, rootDir), true);
});

test('ignores declarations outside the repository-owned surface', () => {
	assert.equal(isCheckableDeclarationFile(`${rootDir}/node_modules/@types/node/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/node_modules/@types/foo/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/node_modules/.pnpm/typescript/lib/lib.dom.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/misskey-js/built/index.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend-shared/js-built/i18n.d.ts`, rootDir), false);
	assert.equal(isCheckableDeclarationFile(`${rootDir}/packages/frontend/src/theme.ts`, rootDir), false);
});

// Exercise the backend-owned lookup from an ESM feature consumer. The dependency
// declarations retain their CommonJS identity instead of an ambient ESM alias.
test('resolves backend CommonJS dependency declarations with their original signatures', () => {
	const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const backendDir = path.join(rootDir, 'packages/backend');
	const configPath = path.join(backendDir, 'tsconfig.json');
	const config = ts.readConfigFile(configPath, ts.sys.readFile);
	assert.equal(config.error, undefined);
	const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, backendDir);
	const fileName = path.join(backendDir, 'src/check-dts-import-consumer.mts');
	const source = `
import Link from 'http-link-header';
import * as nestedProperty from 'nested-property';
const link: Link = Link.parse('<https://example.test>; rel="next"');
const uri: string = link.refs[0].uri;
const exists: boolean = nestedProperty.has({ nested: { value: uri } }, 'nested.value');
nestedProperty.set({}, 'nested.value', exists);
// @ts-expect-error The dependency requires a string header.
Link.parse(123);
// @ts-expect-error The dependency requires a string property path.
nestedProperty.set({}, 123, true);
// @ts-expect-error Preserve the dependency's finite exported surface.
nestedProperty.missingMethod();
`;
	const options = { ...parsed.options, noEmit: true };
	const host = ts.createCompilerHost(options);
	const readSource = host.getSourceFile.bind(host);
	host.getSourceFile = (requested, languageVersion, onError, shouldCreateNewSourceFile) => {
		if (requested === fileName) return ts.createSourceFile(fileName, source, languageVersion);
		return readSource(requested, languageVersion, onError, shouldCreateNewSourceFile);
	};
	const program = ts.createProgram({ rootNames: [fileName], options, host });
	const diagnostics = ts.getPreEmitDiagnostics(program)
		.filter((diagnostic) => diagnostic.file?.fileName === fileName);
	assert.deepEqual(diagnostics.map((diagnostic) => ({
		code: diagnostic.code,
		message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
	})), []);
});
