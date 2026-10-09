/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createAnnouncementsRouter } from '@features/announcements/backend/api.router.js';
import { isContractProcedure } from '@orpc/contract';
import * as v from 'valibot';
import { pilotContract } from '@features/index/backend/api.contract.js';
import { createApiTestRouter } from '@features/index/backend/api.test-fixture.js';
import { requestRoutes } from '@features/api/shared/api-routing.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';

const expected = v.parse(v.array(v.string()), JSON.parse(readFileSync(new URL('../../../test/fixtures/backend-api-routes.json', import.meta.url), 'utf8')));
const routes = requestRoutes(pilotContract);
const router: unknown = createApiTestRouter();

function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function atPath(root: unknown, path: readonly string[]): unknown {
	let node = root;
	for (const key of path) { if (!isRecord(node)) throw new Error('Missing native router branch'); node = node[key]; }
	return node;
}

test('every published request name has exactly one canonical native POST binding', () => {
	const names = routes.map(route => route.name);
	expect(new Set(names).size).toBe(names.length);
	expect(names.filter(name => expected.includes(name)).sort()).toEqual([...expected].sort());
	for (const route of routes) {
		expect(route.httpPath).toBe(`/${route.name}`);
		const contract = atPath(pilotContract, route.path);
		const procedure = atPath(router, route.path);
		expect(isContractProcedure(contract)).toBe(true);
		expect(isContractProcedure(procedure)).toBe(true);
		if (!isContractProcedure(contract) || !isContractProcedure(procedure)) throw new Error('Missing native procedure');
		expect(procedure['~orpc'].route).toEqual(contract['~orpc'].route);
		expect(procedure['~orpc'].meta).toEqual(contract['~orpc'].meta);
		expect(procedure['~orpc'].inputSchema).toBe(contract['~orpc'].inputSchema);
		expect(procedure['~orpc'].outputSchema).toBe(contract['~orpc'].outputSchema);
	}
});

test('native router topology matches contract ownership and retired backend endpoint bridges stay absent', () => {
	expect(Object.keys(createApiTestRouter()).sort()).toEqual(Object.keys(pilotContract).sort());
	for (const name of expected) expect(existsSync(new URL(`./endpoints/${name}.ts`, import.meta.url))).toBe(false);
	expect(existsSync(new URL('../../../../features/index/backend/endpoint-list.ts', import.meta.url))).toBe(false);
	expect(existsSync(new URL('../../../../features/boot/backend/assembly/EndpointsModule.ts', import.meta.url))).toBe(false);
});
