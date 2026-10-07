/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { listingAdminDriveFilesDefinition, listingDriveFilesDefinition, listingDriveStreamDefinition } from '@features/drive/contract/drive-listing-endpoint-definitions.js';
import type { Packed } from '@features/index/contract/packed.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';

const legacyDriveStreamInput = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		type: { type: 'string', pattern: '^[a-zA-Z\\/\\-*]+$' },
	},
	required: [],
} as const;

const transportMeta = { requireCredential: false } as const;
const definitions = [listingAdminDriveFilesDefinition, listingDriveFilesDefinition, listingDriveStreamDefinition];
const projections = [
	projectEndpointContract(listingAdminDriveFilesDefinition),
	projectEndpointContract(listingDriveFilesDefinition),
	projectEndpointContract(listingDriveStreamDefinition),
];

test('drive listings retain native defaults and open AJV input objects', async () => {
	const expected = [{ limit: 10, origin: 'local', hostname: null }, { limit: 10, folderId: null }, { limit: 10 }];
	for (const [index, definition] of definitions.entries()) {
		const projection = projections[index];
		const params = { future: { preserved: true } };
		const response: Packed<'DriveFile'>[] = [];
		const endpoint = new ContractEndpoint<typeof transportMeta, v.GenericSchema, typeof listingDriveFilesDefinition.output>(transportMeta, projection, async input => {
			expect(input).toBe(params);
			expect(input).toEqual({ future: { preserved: true }, ...expected[index] });
			return response;
		});
		expect(await endpoint.exec(params, null, null)).toBe(response);
		expect(v.parse(definition.input, { future: { preserved: true } })).toEqual({ future: { preserved: true }, ...expected[index] });
	}
});

test('drive stream projection and real AJV regex errors remain exact', async () => {
	const projection = projectEndpointContract(listingDriveStreamDefinition);
	expect(projection.input).toEqual(legacyDriveStreamInput);
	let oldCalls = 0;
	let newCalls = 0;
	const legacy = new Endpoint({}, legacyDriveStreamInput, async (_params: unknown) => { oldCalls++; return []; });
	const current = new ContractEndpoint({}, projection, async () => { newCalls++; return []; });
	for (const type of ['image/png', 'image/*', 'A-Z/*']) {
		await expect(legacy.exec({ type }, null, null)).resolves.toEqual([]);
		await expect(current.exec({ type }, null, null)).resolves.toEqual([]);
	}
	for (const type of ['', 'image/png9', 'image:png', 'image/png\n', null]) {
		await expect(legacy.exec({ type }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(current.exec({ type }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
	await expect(current.exec({ type: 'image:png' }, null, null)).rejects.toMatchObject({
		code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		info: { param: '#/properties/type/pattern', reason: 'must match pattern "^[a-zA-Z\\/\\-*]+$"' },
	});
	expect(oldCalls).toBe(3);
	expect(newCalls).toBe(3);
});

test('admin drive regex accepts digits while personal drive rejects them', async () => {
	const admin = new ContractEndpoint({}, projectEndpointContract(listingAdminDriveFilesDefinition), async () => []);
	const personal = new ContractEndpoint({}, projectEndpointContract(listingDriveFilesDefinition), async () => []);
	await expect(admin.exec({ type: 'application/x-7z' }, null, null)).resolves.toEqual([]);
	await expect(personal.exec({ type: 'application/x-7z' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	await expect(admin.exec({ type: null }, null, null)).resolves.toEqual([]);
	await expect(personal.exec({ type: null }, null, null)).resolves.toEqual([]);
});

test('drive listing limits and identifier validators preserve their bounds', async () => {
	for (const projection of projections) {
		const endpoint = new ContractEndpoint<typeof transportMeta, v.GenericSchema, typeof listingDriveFilesDefinition.output>(transportMeta, projection, async () => []);
		for (const limit of [1, 100]) await expect(endpoint.exec({ limit }, null, null)).resolves.toEqual([]);
		for (const limit of [0, 101, 1.5]) await expect(endpoint.exec({ limit }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		await expect(endpoint.exec({ sinceId: 'valid123' }, null, null)).resolves.toEqual([]);
		await expect(endpoint.exec({ sinceId: 'invalid-id' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
});

test('nullable drive sort retains null in the enum and native validation', async () => {
	const projection = projectEndpointContract(listingDriveFilesDefinition);
	expect(projection.input.properties?.sort).toEqual({
		type: 'string', nullable: true,
		enum: ['+createdAt', '-createdAt', '+name', '-name', '+size', '-size', null],
	});
	const endpoint = new ContractEndpoint<typeof transportMeta, v.GenericSchema, typeof listingDriveFilesDefinition.output>(transportMeta, projection, async () => []);
	for (const sort of [null, '+name', '-size']) {
		await expect(endpoint.exec({ sort }, null, null)).resolves.toEqual([]);
		expect(v.safeParse(listingDriveFilesDefinition.input, { sort }).success).toBe(true);
	}
	await expect(endpoint.exec({ sort: 'unknown' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(v.safeParse(listingDriveFilesDefinition.input, { sort: 'unknown' }).success).toBe(false);
});

test('drive outputs retain canonical packed types, references and payload identity', async () => {
	expectTypeOf<v.InferOutput<typeof listingDriveFilesDefinition.output>>().toEqualTypeOf<Packed<'DriveFile'>[]>();
	const projection = projectEndpointContract(listingDriveFilesDefinition);
	expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual({ type: 'array', items: { $ref: '#/components/schemas/DriveFile' } });
	const response: Packed<'DriveFile'>[] = [];
	const endpoint = new ContractEndpoint({}, projection, async () => response);
	expect(await endpoint.exec({}, null, null)).toBe(response);
});
