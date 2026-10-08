/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import * as ts from 'typescript';
import documentedEndpoints, { endpoints as namedEndpoints } from '@features/index/backend/endpoints.js';
import * as endpointRegistry from '@features/index/backend/endpoint-list.js';
import { EndpointsModule } from '@features/boot/backend/assembly/EndpointsModule.js';
import { featureTokens } from '@features/index/backend/feature-providers.js';
import * as featureDefaultEndpoint0 from '@features/federation/backend/endpoints/admin/federation/delete-all-files.js';
import * as featureDefaultEndpoint1 from '@features/federation/backend/endpoints/admin/federation/remove-all-following.js';
import * as featureDefaultEndpoint2 from '@features/integrations/backend/endpoints/admin/send-email.js';
import * as featureDefaultEndpoint3 from '@features/moderation/backend/endpoints/admin/show-users.js';
import * as featureDefaultEndpoint4 from '@features/users/backend/endpoints/admin/update-proxy-account.js';
import * as featureDefaultEndpoint5 from '@features/integrations/backend/endpoints/fetch-rss.js';
import * as featureDefaultEndpoint6 from '@features/timelines/backend/endpoints/notes/mentions.js';
import * as featureDefaultEndpoint7 from '@features/timelines/backend/endpoints/users/notes.js';

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

const featureDefaultEndpoints = new Map<string, { owner: string; endpoint: EndpointModule }>([
	['admin/federation/delete-all-files', { owner: 'federation', endpoint: featureDefaultEndpoint0 }],
	['admin/federation/remove-all-following', { owner: 'federation', endpoint: featureDefaultEndpoint1 }],
	['admin/send-email', { owner: 'integrations', endpoint: featureDefaultEndpoint2 }],
	['admin/show-users', { owner: 'moderation', endpoint: featureDefaultEndpoint3 }],
	['admin/update-proxy-account', { owner: 'users', endpoint: featureDefaultEndpoint4 }],
	['fetch-rss', { owner: 'integrations', endpoint: featureDefaultEndpoint5 }],
	['notes/mentions', { owner: 'timelines', endpoint: featureDefaultEndpoint6 }],
	['users/notes', { owner: 'timelines', endpoint: featureDefaultEndpoint7 }],
]);
const endpointModules = endpointRegistry as unknown as Record<string, EndpointModule>;
const sourceFile = fileURLToPath(new URL('../../../../features/index/backend/endpoint-list.ts', import.meta.url));
const source = readFileSync(sourceFile, 'utf8');
const ast = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true);
const routeSources = new Map<string, string>();
for (const statement of ast.statements) {
	if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.exportClause || !ts.isNamespaceExport(statement.exportClause)) continue;
	// Compare canonical filesystem ownership independently of the import spelling.
	expect(statement.moduleSpecifier.text).toMatch(/^@features\/[^/]+\/backend\/endpoints\/.+\.js$/);
	routeSources.set(statement.exportClause.name.text, statement.moduleSpecifier.text.replace(/^@features\//, '../../../../features/'));
}
const routeFixturePath = fileURLToPath(new URL('../../../test/fixtures/backend-api-routes.json', import.meta.url));
const nativeNames = new Set(['server-info', 'notes/delete', 'drive/files/create']);
const expectedRouteKeys = JSON.parse(readFileSync(routeFixturePath, 'utf8')) as string[];
const expectedRouteOrder = JSON.parse(readFileSync(fileURLToPath(new URL('../../../test/fixtures/backend-api-registry-order.json', import.meta.url)), 'utf8')) as string[];
const legacyRouteKeys = expectedRouteKeys.filter(name => !nativeNames.has(name));
const expectedFeatureFactories = Object.fromEntries(Object.entries(JSON.parse(readFileSync(fileURLToPath(new URL('../../../test/fixtures/backend-api-feature-factories.json', import.meta.url)), 'utf8')) as Record<string, { source: string; feature: string }>).filter(([name]) => !nativeNames.has(name)));
const moduleProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, EndpointsModule) as ProviderDefinition[];

test('API endpoint route keys retain the published contract', () => {
	expect(namedEndpoints).toBe(documentedEndpoints);
	expect(namedEndpoints.map(endpoint => endpoint.name)).toEqual(Object.keys(endpointModules));
	const routeKeys = Object.keys(endpointModules).sort();
	expect([...routeSources.keys()].sort()).toEqual(legacyRouteKeys);
	expect([...routeSources.keys()]).toEqual(expectedRouteOrder.filter(name => !nativeNames.has(name)));
	expect(routeKeys).toEqual(legacyRouteKeys);
	expect([...routeKeys, ...nativeNames].sort()).toEqual(expectedRouteKeys);
});

test('API endpoint registry binds canonical classes and feature factories exactly once', () => {
	const defaultRoutes = new Set<string>();
	const factoryRoutes = new Set<string>();

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
			factoryRoutes.add(route);
			const expectedFactory = expectedFeatureFactories[route];
			expect(expectedFactory).toBeDefined();
			expect(routeSources.get(route)).toBe(expectedFactory.source);
			expect(endpoint.feature).toBe(expectedFactory.feature);
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
		const canonicalEndpoint = featureDefaultEndpoints.get(route);
		expect(canonicalEndpoint).toBeDefined();
		expect(typeof endpoint.default).toBe('function');
		expect(routeSources.get(route)).toBe(`../../../../features/${canonicalEndpoint!.owner}/backend/endpoints/${route}.js`);
		expect(endpoint.default).toBe(canonicalEndpoint!.endpoint.default);
		expect(endpoint.meta).toBe(canonicalEndpoint!.endpoint.meta);
		expect(endpoint.paramDef).toBe(canonicalEndpoint!.endpoint.paramDef);
		expect(provider.useClass).toBe(endpoint.default);
	}

	expect(defaultRoutes).toEqual(new Set(featureDefaultEndpoints.keys()));
	expect(factoryRoutes).toEqual(new Set(Object.keys(expectedFeatureFactories)));
});

test('feature-owned default endpoints have real implementations and no old-path bridges', () => {
	for (const [route, { owner }] of featureDefaultEndpoints) {
		const implementationPath = fileURLToPath(new URL(`../../../../features/${owner}/backend/endpoints/${route}.ts`, import.meta.url));
		const implementation = ts.createSourceFile(implementationPath, readFileSync(implementationPath, 'utf8'), ts.ScriptTarget.Latest, true);
		expect(implementation.statements.some(statement => ts.isClassDeclaration(statement) && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword))).toBe(true);
		expect(existsSync(fileURLToPath(new URL(`./endpoints/${route}.ts`, import.meta.url)))).toBe(false);
	}
});

test('feature-owned factories have real adapters and no old-path bridges', () => {
	for (const [route, { source }] of Object.entries(expectedFeatureFactories)) {
		expect(source).toMatch(/^\.{2}\/\.{2}\/\.{2}\/\.{2}\/features\/[^/]+\/backend\/endpoints\/.+\.js$/);
		const implementationPath = fileURLToPath(new URL(source.replace(/\.js$/, '.ts'), import.meta.url));
		const implementation = ts.createSourceFile(implementationPath, readFileSync(implementationPath, 'utf8'), ts.ScriptTarget.Latest, true);
		let hasFeatureFactory = false;
		const visit = (node: ts.Node) => {
			if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineFeatureEndpoint') hasFeatureFactory = true;
			ts.forEachChild(node, visit);
		};
		visit(implementation);
		expect(hasFeatureFactory).toBe(true);
		expect(existsSync(fileURLToPath(new URL(`./endpoints/${route}.ts`, import.meta.url)))).toBe(false);
	}
});

test('RSS named export preserves the default endpoint constructor identity', () => {
	expect(featureDefaultEndpoint5.FetchRssEndpoint).toBe(featureDefaultEndpoint5.default);
});
