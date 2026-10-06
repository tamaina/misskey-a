/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import * as ts from 'typescript';
import * as endpointRegistry from './endpoint-list.js';
import { EndpointsModule } from './EndpointsModule.js';
import { featureTokens } from './feature-providers.js';

type EndpointModule = {
	EndpointImplementation?: unknown;
	createEndpoint?: unknown;
	default?: unknown;
	feature?: unknown;
	meta?: unknown;
	paramDef?: unknown;
};

type ProviderDefinition = {
	provide?: unknown;
	inject?: unknown[];
	useClass?: unknown;
	useFactory?: unknown;
};

const hostDefaultRoutes = new Set([
	'admin/federation/delete-all-files',
	'admin/federation/remove-all-following',
	'admin/send-email',
	'admin/show-users',
	'admin/update-proxy-account',
	'fetch-rss',
	'notes/mentions',
	'users/notes',
]);
const endpointModules = endpointRegistry as unknown as Record<string, EndpointModule>;
const sourceFile = fileURLToPath(new URL('./endpoint-list.ts', import.meta.url));
const source = readFileSync(sourceFile, 'utf8');
const ast = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true);
const routeSources = new Map<string, string>();
for (const statement of ast.statements) {
	if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.exportClause || !ts.isNamespaceExport(statement.exportClause)) continue;
	routeSources.set(statement.exportClause.name.text, statement.moduleSpecifier.text);
}
const routeFixturePath = fileURLToPath(new URL('../../../test/fixtures/backend-api-routes.json', import.meta.url));
const expectedRouteKeys = JSON.parse(readFileSync(routeFixturePath, 'utf8')) as string[];
const moduleProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, EndpointsModule) as ProviderDefinition[];

test('API endpoint route keys retain the published contract', () => {
	const routeKeys = Object.keys(endpointModules).sort();
	expect([...routeSources.keys()].sort()).toEqual(expectedRouteKeys);
	expect(routeKeys).toEqual(expectedRouteKeys);
});

test('API endpoint registry binds canonical classes and feature factories exactly once', () => {
	const defaultRoutes = new Set<string>();

	for (const [route, endpoint] of Object.entries(endpointModules)) {
		expect(endpoint.meta).toBeDefined();
		expect(endpoint.paramDef).toBeDefined();
		const shapeCount = Number('createEndpoint' in endpoint) + Number('EndpointImplementation' in endpoint) + Number('default' in endpoint);
		expect(shapeCount).toBe(1);

		const token = `ep:${route}`;
		const routeProviders = moduleProviders.filter(provider => provider != null && provider.provide === token);
		expect(routeProviders).toHaveLength(1);
		const [provider] = routeProviders;

		if ('createEndpoint' in endpoint) {
			expect(typeof endpoint.createEndpoint).toBe('function');
			expect(typeof endpoint.feature).toBe('string');
			expect(provider.useFactory).toBe(endpoint.createEndpoint);
			expect(provider.inject).toContain(featureTokens[endpoint.feature as keyof typeof featureTokens]);
			continue;
		}

		if ('EndpointImplementation' in endpoint) {
			expect(typeof endpoint.EndpointImplementation).toBe('function');
			expect(routeSources.get(route)).toMatch(/^\.{2}\/\.{2}\/\.{2}\/\.{2}\/features\/[^/]+\/backend\/endpoints\/.+\.js$/);
			expect(provider.useClass).toBe(endpoint.EndpointImplementation);
			continue;
		}

		defaultRoutes.add(route);
		expect(hostDefaultRoutes.has(route)).toBe(true);
		expect(typeof endpoint.default).toBe('function');
		expect(routeSources.get(route)).toMatch(/^\.\/endpoints\/.+\.js$/);
		expect(provider.useClass).toBe(endpoint.default);
	}

	expect(defaultRoutes).toEqual(hostDefaultRoutes);
});
