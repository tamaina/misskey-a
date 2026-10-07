/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { remainingIRegistryGetDefinition, remainingIRegistryKeysDefinition, remainingIRegistrySetDefinition } from '../../../../features/preferences/contract/remaining-inline-endpoint-definitions.js';
import { remainingUsernameAvailableDefinition } from '../../../../features/auth/contract/remaining-inline-endpoint-definitions.js';
import { remainingRetentionDefinition } from '../../../../features/statistics/contract/remaining-inline-endpoint-definitions.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { Endpoint } from './endpoint-base.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';

const legacyRegistryInput = {
	type: 'object',
	properties: {
		key: { type: 'string' },
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: '^[a-zA-Z0-9_]+$',
		} },
		domain: { type: 'string', nullable: true },
	},
	required: ['key', 'scope'],
} as const;

const registryProjection = projectEndpointContract(remainingIRegistryGetDefinition);

test('registry contracts retain the required scope declaration and both static default paths', async () => {
	expect(registryProjection.input).toEqual(legacyRegistryInput);
	expect(v.parse(remainingIRegistryGetDefinition.input, { key: 'setting' }).scope).toEqual([]);
	const response = { future: { preserved: true } };
	const oldParams = { key: 'setting', future: true };
	const newParams = { key: 'setting', future: true };
	const oldEndpoint = new Endpoint({}, legacyRegistryInput, async (input: { key: string; scope: string[]; domain?: string | null }) => {
		expect(input).toBe(oldParams);
		expect(input.scope).toEqual([]);
		return response;
	});
	const newEndpoint = new ContractEndpoint({}, registryProjection, async input => {
		expect(input).toBe(newParams);
		expect(input.scope).toEqual([]);
		return response;
	});
	expect(await oldEndpoint.exec(oldParams, null, null)).toBe(response);
	expect(await newEndpoint.exec(newParams, null, null)).toBe(response);
	expect(newParams).toEqual(oldParams);
	expect(newParams).toEqual({ key: 'setting', scope: [], future: true });
});

test('registry scope boundaries retain real AJV errors and callback suppression', async () => {
	let oldCalls = 0;
	let newCalls = 0;
	const oldEndpoint = new Endpoint({}, legacyRegistryInput, async (_params: unknown) => { oldCalls++; return {}; });
	const newEndpoint = new ContractEndpoint({}, registryProjection, async () => { newCalls++; return {}; });
	for (const scope of [['letters_123'], []]) {
		await expect(oldEndpoint.exec({ key: 'setting', scope }, null, null)).resolves.toEqual({});
		await expect(newEndpoint.exec({ key: 'setting', scope }, null, null)).resolves.toEqual({});
	}
	for (const scope of [[''], ['hyphen-name'], ['é'], ['valid\n'], [1], null]) {
		await expect(oldEndpoint.exec({ key: 'setting', scope }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(newEndpoint.exec({ key: 'setting', scope }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
	await expect(newEndpoint.exec({ key: 'setting', scope: ['hyphen-name'] }, null, null)).rejects.toMatchObject({
		code: 'INVALID_PARAM',
		id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		info: { param: '#/properties/scope/items/pattern', reason: 'must match pattern "^[a-zA-Z0-9_]+$"' },
	});
	expect(oldCalls).toBe(2);
	expect(newCalls).toBe(2);
});

test('registry set retains a required opaque value without filtering payloads', async () => {
	const projection = projectEndpointContract(remainingIRegistrySetDefinition);
	const value = { arbitrary: [null, false, 1, 'text'] };
	const params = { key: 'setting', value, extension: true };
	let calls = 0;
	const endpoint = new ContractEndpoint({}, projection, async input => {
		calls++;
		expect(input).toBe(params);
		expect(input.value).toBe(value);
		expect(input.scope).toEqual([]);
	});
	await expect(endpoint.exec({ key: 'setting' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	await expect(endpoint.exec(params, null, null)).resolves.toBeUndefined();
	expect(calls).toBe(1);
	expect(projection.response).toBeUndefined();
});

test('registry get preserves opaque scalar, null, array and object responses without parsing', async () => {
	for (const response of [42, null, ['opaque'], { undeclared: true }]) {
		const endpoint = new ContractEndpoint({}, registryProjection, async () => response);
		expect(await endpoint.exec({ key: 'setting' }, null, null)).toBe(response);
	}
	expect(convertSchemaToOpenApiSchema(registryProjection.response!, 'res', true)).toEqual({ type: 'object' });
	const keysProjection = projectEndpointContract(remainingIRegistryKeysDefinition);
	expect(convertSchemaToOpenApiSchema(keysProjection.response!, 'res', true)).toEqual({ type: 'array', items: { type: 'string' } });
});

test('username availability keeps the source constant regex boundaries', async () => {
	const projection = projectEndpointContract(remainingUsernameAvailableDefinition);
	expect(projection.input).toEqual({ type: 'object', properties: { username: { type: 'string', pattern: '^\\w{1,20}$' } }, required: ['username'] });
	let calls = 0;
	const endpoint = new ContractEndpoint({}, projection, async () => { calls++; return { available: true }; });
	for (const username of ['a', 'valid_name123', 'a'.repeat(20)]) {
		await expect(endpoint.exec({ username }, null, null)).resolves.toEqual({ available: true });
	}
	for (const username of ['', 'a'.repeat(21), 'hyphen-name', 'é', '😀', 'valid\n']) {
		await expect(endpoint.exec({ username }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
	expect(calls).toBe(3);
});

test('retention keeps its one-branch map documentation and response identity', async () => {
	const projection = projectEndpointContract(remainingRetentionDefinition);
	expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				createdAt: { type: 'string', format: 'date-time' },
				users: { type: 'number' },
				data: { type: 'object', additionalProperties: { anyOf: [{ type: 'number' }] } },
			},
			required: ['createdAt', 'users', 'data'],
		},
	});
	const response = [{ createdAt: '2026-01-01T00:00:00.000Z', users: 1, data: { '1': 1 }, future: true }];
	const endpoint = new ContractEndpoint({}, projection, async () => response);
	expect(await endpoint.exec({}, null, null)).toBe(response);
});
