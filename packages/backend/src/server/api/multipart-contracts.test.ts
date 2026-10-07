/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync, unlink } from 'node:fs';
import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { defineMultipartEndpointContract, getMultipartEndpointContractRegistration } from '@features/api/contract/multipart-endpoint.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { driveFilesCreateDefinition, driveFilesCreateInput, driveFilesCreateWireInput, driveFilesCreateOutput } from '@features/drive/contract/create-endpoint-definition.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@features/drive/contract/image-comment-limit.js';
import { EndpointImplementation as Upload, meta as uploadMeta, paramDef } from '@features/drive/backend/endpoints/drive/files/create.js';
import { EndpointImplementation as LegacyUpload, meta as legacyMeta, paramDef as legacyParams } from '../../../test/fixtures/multipart-drive-create-original.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { Config } from '@/config.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import documentedEndpoints from './endpoints.js';

vi.mock('./endpoints.js', () => ({ default: [] }));
vi.mock('node:fs', async () => ({
	...await vi.importActual<typeof import('node:fs')>('node:fs'),
	unlink: vi.fn((_path: string, callback: (error: Error | null) => void) => callback(null)),
}));

const projection = projectEndpointContract(driveFilesCreateDefinition);
const fileMeta = { requireFile: true } as const;
const jsonMeta = { requireCredential: false } as const;
const descriptor = { name: 'filename.txt', path: '/multipart-contract-test-file' };

test('factory owns frozen logical attributes, required public Blob and exact wire contract', () => {
	const attributes = { text: v.optional(v.string(), 'default') };
	const definition = defineMultipartEndpointContract({ path: '/multipart-proof' }, attributes, v.void());
	const registration = getMultipartEndpointContractRegistration(definition)!;
	expect(definition.input.entries).not.toBe(attributes);
	expect(Object.keys(definition.input.entries)).toEqual(['text']);
	expect(Object.keys(definition.wireInput.entries)).toEqual(['text', 'file']);
	expect(definition.wireInput.entries.text).toBe(definition.input.entries.text);
	expect(definition.wireInput.entries.file.type).toBe('blob');
	expect(definition.wireInput.entries.file.reference).toBe(v.blob);
	expect(definition.contract['~orpc'].inputSchema).toBe(definition.wireInput);
	expect(definition.contract['~orpc'].outputSchema).toBe(definition.output);
	for (const value of [definition, registration, definition.input, definition.input.entries, definition.wireInput, definition.wireInput.entries, registration.file]) expect(Object.isFrozen(value)).toBe(true);
	Reflect.set(attributes, 'text', v.optional(v.string(), 'changed'));
	expect(v.parse(definition.input, {}).text).toBe('default');
	expect(Reflect.set(definition.wireInput.entries, 'file', v.optional(v.blob()))).toBe(false);
	expect(Reflect.set(registration.file, 'type', 'optional')).toBe(false);
	expect(Reflect.set(definition, 'transport', undefined)).toBe(false);
});

test('reserved binary entries and non-map factory inputs fail rather than weaken file', () => {
	for (const file of [v.blob(), v.file(), v.optional(v.blob()), v.nullable(v.blob()), v.unknown()]) {
		// @ts-expect-error The factory owns file and forbids caller-defined binary entries.
		expect(() => defineMultipartEndpointContract({ path: '/bad' }, { file }, v.void())).toThrow(/reserved file/);
	}
	for (const attributes of [null, [], 'invalid']) {
		// @ts-expect-error JS callers are guarded against unsupported non-entry maps.
		expect(() => defineMultipartEndpointContract({ path: '/bad' }, attributes, v.void())).toThrow(/entry map/);
	}
});

test('mint-only registration rejects forged, spread and independently rebuilt multipart definitions', () => {
	for (const file of [undefined, v.optional(v.blob()), v.nullable(v.blob()), v.file(), v.unknown()]) {
		const wireInput = jsonObject(file === undefined ? {} : { file });
		const contract = defineEndpointContract({ path: '/forged' }, wireInput, v.void()).contract;
		const forged = { input: jsonObject({}), wireInput, output: v.void(), transport: 'multipart/form-data' as const, contract };
		expect(() => projectEndpointContract(forged)).toThrow(/exact factory-owned/);
	}
	expect(getMultipartEndpointContractRegistration({ ...driveFilesCreateDefinition })).toBeUndefined();
	expect(() => projectEndpointContract({ ...driveFilesCreateDefinition })).toThrow(/exact factory-owned/);
	// @ts-expect-error A tagged multipart definition cannot become JSON while retaining wireInput.
	expect(() => projectEndpointContract({ ...driveFilesCreateDefinition, transport: undefined })).toThrow(/Unsupported endpoint contract transport/);
});

test('even minted definitions reject later mutation of oRPC input or output identities', () => {
	for (const key of ['inputSchema', 'outputSchema'] as const) {
		const definition = defineMultipartEndpointContract({ path: '/identity-proof' }, {}, v.void());
		const old = definition.contract['~orpc'][key];
		Reflect.set(definition.contract['~orpc'], key, key === 'inputSchema' ? definition.input : v.string());
		expect(() => projectEndpointContract(definition)).toThrow(/schema identities cannot be changed/);
		Reflect.set(definition.contract['~orpc'], key, old);
		expect(() => projectEndpointContract(definition)).not.toThrow();
	}
	const ordinary = defineEndpointContract({ path: '/json-proof' }, jsonObject({}), v.void());
	Reflect.set(ordinary.contract['~orpc'], 'inputSchema', jsonObject({ file: v.blob() }));
	expect(() => projectEndpointContract(ordinary)).toThrow(/JSON contract schemas must match/);
});

test('requireFile and transport must agree in both directions before superclass AJV construction', () => {
	for (const absent of [{}, { requireFile: false }]) expect(() => new ContractEndpoint(absent, projection, async () => { throw new Error('unused'); })).toThrow(/requireFile metadata/);
	const json = projectEndpointContract(defineEndpointContract({ path: '/json' }, jsonObject({}), v.void()));
	expect(() => new ContractEndpoint(fileMeta, json, async () => { throw new Error('unused'); })).toThrow(/requireFile metadata/);
	expect(() => new ContractEndpoint({}, json, async () => { throw new Error('unused'); })).not.toThrow();
	expect(() => new ContractEndpoint(fileMeta, projection, async () => { throw new Error('unused'); })).not.toThrow();
});

test('wire accepts Blob and File with identity, defaults and unknown own keys while logical input stays attrs-only', () => {
	const unknown = JSON.parse('{"__proto__":{"kept":true},"constructor":{"kept":true},"future":{"kept":true}}');
	for (const file of [new Blob([]), new Blob(['content'], { type: 'text/plain' }), new File(['named'], 'named.txt')]) {
		const parsed = v.parse(driveFilesCreateWireInput, { file, ...unknown });
		expect(parsed.file).toBe(file);
		expect(parsed.folderId).toBeNull();
		expect(parsed.name).toBeNull();
		expect(parsed.comment).toBeNull();
		expect(parsed.force).toBe(false);
		expect(parsed.isSensitive).toBe(false);
		for (const key of Object.keys(unknown)) expect(Object.hasOwn(parsed, key)).toBe(true);
	}
	for (const file of [undefined, null, 'text', descriptor, 1, {}]) expect(v.safeParse(driveFilesCreateWireInput, { file }).success).toBe(false);
	expect(v.safeParse(driveFilesCreateWireInput, {}).success).toBe(false);
	expect(Object.hasOwn(driveFilesCreateInput.entries, 'file')).toBe(false);
	expect(() => toLegacyJsonSchema(driveFilesCreateWireInput)).toThrow(/blob/);
	expectTypeOf<v.InferInput<typeof driveFilesCreateWireInput>['file']>().toEqualTypeOf<Blob>();
	expectTypeOf<v.InferOutput<typeof driveFilesCreateInput>['force']>().toEqualTypeOf<boolean>();
});

test('attrs-only AJV projection, DB512 limit and all non-response metadata match the immutable original', () => {
	expect(JSON.parse(JSON.stringify(paramDef))).toEqual(legacyParams);
	expect(Object.keys(paramDef.properties!)).toEqual(Object.keys(legacyParams.properties));
	const { res: _newRes, ...newMeta } = uploadMeta;
	const { res: _oldRes, ...oldMeta } = legacyMeta;
	expect(newMeta).toEqual(oldMeta);
	expect(DB_MAX_IMAGE_COMMENT_LENGTH).toBe(512);
	const original = readFileSync(new URL('../../../test/fixtures/multipart-drive-create-original.ts', import.meta.url), 'utf8');
	const current = readFileSync(new URL('../../../../features/drive/backend/endpoints/drive/files/create.ts', import.meta.url), 'utf8');
	expect(current.slice(current.indexOf('async (ps, me, _, file, cleanup, ip, headers)'))).toBe(original.slice(original.indexOf('async (ps, me, _, file, cleanup, ip, headers)')));
	expect(current.slice(current.indexOf('\tconstructor('), current.indexOf('\t\tsuper('))).toBe(original.slice(original.indexOf('\tconstructor('), original.indexOf('\t\tsuper(')));
});

test('legacy and native bridge retain exact AJV outcomes, defaults, params identity and cleanup', async () => {
	const samples: unknown[] = [{}, { folderId: null, name: null, comment: null }, { folderId: 'id1', force: true, isSensitive: false }, { future: { retained: true } }, { name: undefined, comment: undefined, force: undefined }, [], null, true, 'text'];
	for (const key of ['folderId', 'name', 'comment', 'force', 'isSensitive']) for (const value of [null, undefined, '', 'id-1', true, false, 0, {}, []]) samples.push({ [key]: value });
	for (const text of ['x'.repeat(512), 'x'.repeat(513), '😀'.repeat(512), '😀'.repeat(513)]) samples.push({ comment: text });
	for (const sample of samples) {
		const before = structuredClone(sample), after = structuredClone(sample);
		let oldCalls = 0, newCalls = 0;
		const old = new Endpoint(fileMeta, legacyParams, async (params: unknown) => { oldCalls++; expect(params).toBe(before); return params; });
		const current = new ContractEndpoint<typeof fileMeta, typeof driveFilesCreateInput, v.GenericSchema, 'native', typeof driveFilesCreateWireInput>(fileMeta, projection, async params => { newCalls++; expect(params).toBe(after); return params; });
		const outcome = async (endpoint: { exec: (input: unknown, me: null, token: null, file: typeof descriptor) => Promise<unknown> }, input: unknown) => {
			try { expect(await endpoint.exec(input, null, null, descriptor)).toBe(input); return { valid: true }; } catch (error) {
				if (error === null || typeof error !== 'object') throw error;
				return { valid: false, code: Reflect.get(error, 'code'), id: Reflect.get(error, 'id'), info: Reflect.get(error, 'info') };
			}
		};
		vi.mocked(unlink).mockClear();
		const previous = await outcome(old, before);
		const oldCleanup = vi.mocked(unlink).mock.calls.length;
		vi.mocked(unlink).mockClear();
		expect(await outcome(current, after)).toEqual(previous);
		expect(vi.mocked(unlink).mock.calls.length).toBe(oldCleanup);
		expect(after).toEqual(before);
		expect(newCalls).toBe(oldCalls);
		const parsed = v.safeParse(driveFilesCreateInput, structuredClone(sample));
		expect(parsed.success).toBe(previous.valid);
		if (parsed.success) expect(parsed.output).toEqual(before);
	}
});

test('missing upload descriptor preserves FILE_REQUIRED before attrs validation or callback', async () => {
	const callback = vi.fn(async () => { throw new Error('unused'); });
	const endpoint = new ContractEndpoint(fileMeta, projection, callback);
	await expect(endpoint.exec({ force: 'invalid' }, null, null)).rejects.toMatchObject({ code: 'FILE_REQUIRED', id: '4267801e-70d1-416a-b011-4ee502885d8b' });
	expect(callback).not.toHaveBeenCalled();
});

test('actual old and new producers retain descriptor, filename, service args, logging, payload identity and cleanup', async () => {
	for (const logging of [false, true]) for (const name of [undefined, null, '', '  ', 'blob', ' custom.txt ']) {
		const outputs = [];
		for (const implementation of [LegacyUpload, Upload]) {
			const result = { unparsedPackedExtension: { retained: true } };
			const service = { addFile: vi.fn(async (_options: Record<string, unknown>) => ({ id: 'db-file' })) };
			const serializer = { validateFileName: vi.fn(() => true), pack: vi.fn(async () => result) };
			const endpoint = Reflect.construct(implementation, [{ enableIpLogging: logging }, serializer, service]);
			vi.mocked(unlink).mockClear();
			expect(await endpoint.exec({ name, force: true, isSensitive: true, folderId: 'folder1', comment: 'caption' }, { id: 'user1' }, null, descriptor, '192.0.2.1', { test: 'header' })).toBe(result);
			expect(unlink).toHaveBeenCalledExactlyOnceWith(descriptor.path, expect.any(Function));
			expect(serializer.pack).toHaveBeenCalledExactlyOnceWith({ id: 'db-file' }, { self: true });
			outputs.push(service.addFile.mock.calls);
		}
		expect(outputs[1]).toEqual(outputs[0]);
		expect(outputs[1][0][0].path).toBe(descriptor.path);
		expect(outputs[1][0][0].requestIp).toBe(logging ? '192.0.2.1' : null);
	}
});

test('actual producers preserve invalid filename timing and every business error mapping', async () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		for (const implementation of [LegacyUpload, Upload]) {
			const invalid = Reflect.construct(implementation, [{}, { validateFileName: () => false }, { addFile: vi.fn() }]);
			vi.mocked(unlink).mockClear();
			await expect(invalid.exec({}, { id: 'user1' }, null, descriptor)).rejects.toMatchObject(legacyMeta.errors.invalidFileName);
			expect(unlink).not.toHaveBeenCalled();
			for (const [id, expected] of [
				['282f77bf-5816-4f72-9264-aa14d8261a21', legacyMeta.errors.inappropriate],
				['c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6', legacyMeta.errors.noFreeSpace],
				['f9e4e5f3-4df4-40b5-b400-f236945f7073', legacyMeta.errors.maxFileSizeExceeded],
				['bd71c601-f9b0-4808-9137-a330647ced9b', legacyMeta.errors.unallowedFileType],
			] as const) {
				const endpoint = Reflect.construct(implementation, [{}, { validateFileName: () => true }, { addFile: async () => { throw new IdentifiableError(id); } }]);
				vi.mocked(unlink).mockClear();
				await expect(endpoint.exec({}, { id: 'user1' }, null, descriptor)).rejects.toMatchObject(expected);
				expect(unlink).toHaveBeenCalledExactlyOnceWith(descriptor.path, expect.any(Function));
			}
		}
	} finally { consoleError.mockRestore(); }
});

test('actual OpenAPI writer preserves the entire selected document and multipart/auth/error operation', () => {
	const saved = documentedEndpoints.slice();
	try {
		const config = { version: 'multipart-test', apiUrl: 'https://multipart.test/api' } as Config;
		documentedEndpoints.splice(0, documentedEndpoints.length, { name: 'drive/files/create', meta: legacyMeta, params: legacyParams });
		const before = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, { name: 'drive/files/create', meta: uploadMeta, params: paramDef });
		const after = genOpenapiSpec(config);
		expect(JSON.parse(JSON.stringify(after))).toEqual(JSON.parse(JSON.stringify(before)));
		expect(genOpenapiSpec(config)).toEqual(after);
		const operation = after.paths['/drive/files/create'].post;
		expect(Object.keys(operation.requestBody.content)).toEqual(['multipart/form-data']);
		expect(operation.requestBody.content['multipart/form-data'].schema.required).toEqual(['file']);
		expect(operation.requestBody.content['multipart/form-data'].schema.properties.file).toEqual({ type: 'string', format: 'binary', description: 'The file contents.' });
		expect(operation.security).toEqual([{ bearerAuth: [] }]);
	} finally { documentedEndpoints.splice(0, documentedEndpoints.length, ...saved); }
});

test('existing explicit project and constructor generic positions retain their meaning', () => {
	const ordinary = defineEndpointContract({ path: '/generic-regression' }, jsonObject({ name: v.optional(v.string(), 'default') }), v.void());
	const broad = projectEndpointContract<v.GenericSchema, v.GenericSchema>(ordinary);
	expect(() => new ContractEndpoint<typeof jsonMeta, v.GenericSchema, v.GenericSchema, 'legacy-declared'>(jsonMeta, broad, async () => { throw new Error('unused'); })).not.toThrow();
	expect(() => new ContractEndpoint<typeof fileMeta, typeof driveFilesCreateInput, typeof driveFilesCreateOutput, 'native', typeof driveFilesCreateWireInput>(fileMeta, projection, async () => { throw new Error('unused'); })).not.toThrow();
});
