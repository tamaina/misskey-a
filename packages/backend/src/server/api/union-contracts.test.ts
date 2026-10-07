/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { addGlobalDefs, getGlobalDefs } from '@valibot/to-json-schema';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import { resultObject } from '@features/api/contract/result-object.js';
import { misskeyId } from '@features/api/contract/index.js';
import { misskeyIdOrIds, isMisskeyIdOrIds } from '@features/api/contract/misskey-id-or-ids.js';
import { legacyOutputOneOf, getLegacyOutputOneOfRegistration } from '@features/api/contract/legacy-output-one-of.js';
import { packedReference } from '@features/api/contract/packed-reference.js';
import { unionMetaDefinition, unionMetaInput } from '@features/instance/contract/union-endpoint-definitions.js';
import { unionUsersRelationDefinition, unionUsersRelationInput } from '@features/relationships/contract/union-endpoint-definitions.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { endpoints as documentedEndpoints } from '@features/index/backend/endpoints.js';
import type { Config } from '@/config.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import baseline from '../../../test/fixtures/union-contract-baseline.json' with { type: 'json' };
import { EndpointImplementation as MetaEndpoint, meta as metaMetadata } from '@features/instance/backend/endpoints/meta.js';
import { EndpointImplementation as RelationEndpoint, meta as relationMetadata } from '@features/relationships/backend/endpoints/users/relation.js';

vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));
vi.mock('../../../../features/instance/backend/serializers/MetaEntityService.js', () => ({ MetaEntityService: class {} }));
vi.mock('../../../../features/users/backend/serializers/UserEntityService.js', () => ({ UserEntityService: class {} }));

const definitions = { meta: unionMetaDefinition, 'users/relation': unionUsersRelationDefinition };
// This assertion types captured schema AST/transport metadata, never request or response payloads.
const rows = baseline.routes as unknown as { route: keyof typeof definitions; input: Schema; output: Schema; meta: IEndpointMeta; openapi: unknown }[];
const transportMeta = { requireCredential: false } as const;
const credentialMeta = { requireCredential: true, kind: 'read:account' } as const;
const me = { id: 'Me1' };
const canonical = (value: unknown) => JSON.parse(JSON.stringify(value));
const projectOutput = (output: v.GenericSchema) => projectEndpointContract(defineEndpointContract({ path: '/output-union-proof' }, jsonObject({}), output));

test('owned output union remains ordinary rather than exclusive and captures its tuple', () => {
	const first = resultObject({ a: v.string() });
	const second = resultObject({ b: v.string() });
	const options: [typeof first, typeof second] = [first, second];
	const schema = legacyOutputOneOf(options);
	options.reverse();
	const registration = getLegacyOutputOneOfRegistration(schema)!;
	expect(registration.options[0]).toBe(first);
	expect(Object.isFrozen(schema)).toBe(true);
	expect(Object.isFrozen(registration.options)).toBe(true);
	expect(Object.isFrozen(first)).toBe(true);
	expect(Object.isFrozen(second)).toBe(true);
	const overlap = { a: 'one', b: 'two', extra: true };
	expect(v.safeParse(schema, overlap).success).toBe(true);
	expect(projectOutput(schema).response?.oneOf).toHaveLength(2);
	expect(projectOutput(schema).response?.anyOf).toBeUndefined();
	expect(getLegacyOutputOneOfRegistration(v.config(schema, {}))).toBeUndefined();
});

test('root-object setting only accepts exact registered object packed references', () => {
	expect(projectOutput(legacyOutputOneOf([packedReference('MetaLite'), packedReference('MetaDetailed')], { legacyRootType: 'object' })).response?.type).toBe('object');
	for (const options of [[v.string(), v.array(v.string())], [resultObject({ a: v.string() }), resultObject({ b: v.string() })], [packedReference('MetaLite', { legacyOutputType: 'omit' }), packedReference('MetaDetailed')]]) {
		expect(() => Reflect.apply(legacyOutputOneOf, undefined, [options, { legacyRootType: 'object' }]))
			.toThrow('Legacy output oneOf object roots require registered object packed references');
	}
	expect(() => Reflect.apply(legacyOutputOneOf, undefined, [[v.string(), v.boolean()], { legacyRootType: 'array' }])).toThrow('supports only the object-root');
	for (const options of [[], [v.string()], new Array(2), [v.string(), null], [v.string(), v.customAsync(async value => typeof value === 'string')]]) {
		expect(() => Reflect.apply(legacyOutputOneOf, undefined, [options])).toThrow('at least two synchronous schema alternatives');
	}
});

test('output-only owned unions and direct copies reject throughout inputs', () => {
	const union = legacyOutputOneOf([resultObject({ a: v.string() }), v.array(v.string())]);
	for (const input of [union, v.config(union, {}), jsonObject({ value: union }), jsonObject({ values: v.array(union) }), jsonObject({ value: v.optional(v.nullable(union)) }), jsonObject({ value: v.pipe(union, v.metadata({ description: 'Forbidden input' })) })]) {
		expect(() => projectEndpointContract(defineEndpointContract({ path: '/input-proof' }, input, v.void())))
			.toThrow('Legacy input contracts cannot use output-only oneOf projections');
	}
	expect(() => projectEndpointContract(defineEndpointContract({ path: '/lazy-input-proof' }, jsonObject({ value: v.lazy(() => union) }), v.void()))).toThrow('Lazy input schemas require an explicit legacy projection');
});

test('output oneOf metadata is annotation-only across containing, shared and lazy pipelines', () => {
	const union = legacyOutputOneOf([v.string(), v.boolean()]);
	const containers = [union, v.array(union), v.nullable(union), resultObject({ value: union }), v.union([union, v.number()]), v.lazy(() => union), resultObject({ value: v.lazy(() => v.array(union)) })];
	containers.push(v.config(union, {}));
	for (const container of containers) {
		for (const metadata of [{ oneOf: [] }, { anyOf: [] }, { type: 'object' }, { items: {} }, { nullable: true }, { required: [] }, { $ref: '#/forged' }]) {
			expect(() => projectOutput(v.pipe(container, v.metadata(metadata)))).toThrow('Legacy output oneOf pipelines require annotation-only metadata');
		}
	}
	expect(projectOutput(v.pipe(v.array(union), v.metadata({ description: 'Preserved annotation' }))).response?.description).toBe('Preserved annotation');
	const shared = v.union([v.pipe(union, v.metadata({ description: 'First edge' })), v.pipe(v.lazy(() => union), v.metadata({ oneOf: [] }))]);
	expect(() => projectOutput(shared)).toThrow('annotation-only metadata');
	const sibling = resultObject({ union, label: v.pipe(v.string(), v.metadata({ format: 'id' })) });
	expect(projectOutput(sibling).response?.properties?.label).toMatchObject({ type: 'string', format: 'id' });
	const disguised = { ...v.metadata({ description: 'Disguised action' }), reference: v.check };
	expect(() => projectOutput(Reflect.apply(v.pipe, undefined, [union, disguised]))).toThrow('cannot use disguised metadata predicates');
});

test('global-definition and reference contexts cannot replace registered documentation', () => {
	const name = 'OutputOneOfGlobalProof';
	const union = legacyOutputOneOf([v.string(), v.boolean()]);
	const previous = getGlobalDefs()?.[name];
	try {
		addGlobalDefs({ [name]: union });
		expect(() => projectOutput(union)).toThrow('Referenced or tuple response schemas require an explicit legacy projection');
		expect(() => projectOutput(v.array(union))).toThrow('Referenced or tuple response schemas require an explicit legacy projection');
	} finally {
		const definitions = getGlobalDefs();
		if (definitions) {
			if (previous === undefined) delete definitions[name];
			else definitions[name] = previous;
		}
	}
	expect(projectOutput(union).response?.oneOf).toHaveLength(2);
	try {
		addGlobalDefs({ [name]: v.pipe(v.lazy(() => union), v.metadata({ oneOf: [] })) });
		expect(() => projectOutput(v.string())).toThrow('annotation-only metadata');
	} finally {
		const definitions = getGlobalDefs();
		if (definitions) {
			if (previous === undefined) delete definitions[name];
			else definitions[name] = previous;
		}
	}
});

test('closed identifier union owns exact disjoint string-first alternatives', () => {
	const union = misskeyIdOrIds();
	expect(isMisskeyIdOrIds(union)).toBe(true);
	expect(isMisskeyIdOrIds(v.config(union, {}))).toBe(false);
	expect(Object.isFrozen(union)).toBe(true);
	expect(Object.isFrozen(union.options)).toBe(true);
	expect(union.options[0]).toBe(misskeyId);
	expect(union.options[1].item).toBe(misskeyId);
	expect(Object.isFrozen(union.options[1])).toBe(true);
	const projection = projectEndpointContract(defineEndpointContract({ path: '/identifier-union-proof' }, jsonObject({ value: union }), v.void()));
	expect(projection.input.properties?.value).toEqual({ oneOf: [{ type: 'string', format: 'misskey:id' }, { type: 'array', items: { type: 'string', format: 'misskey:id' } }] });
	for (const input of [v.pipe(union, v.metadata({ oneOf: [] })), v.pipe(v.config(union, {}), v.metadata({ oneOf: [] })), v.pipe(jsonObject({ value: union }), v.metadata({ anyOf: [] }))]) {
		expect(() => projectEndpointContract(defineEndpointContract({ path: '/forged-identifier-union' }, input, v.void()))).toThrow('Misskey identifier-or-identifiers pipelines require annotation-only metadata');
	}
});

test('owned output alternatives reject lazy descendants without executing factories', () => {
	let calls = 0;
	const lazy = v.lazy(() => { calls++; return v.string(); });
	for (const option of [lazy, v.array(lazy), v.nullable(lazy), resultObject({ value: lazy }), v.union([v.string(), lazy])]) {
		expect(() => legacyOutputOneOf([option, v.boolean()])).toThrow('Legacy output oneOf alternatives cannot contain lazy schemas');
	}
	expect(calls).toBe(0);
	const model = resultObject({ value: v.string() });
	const owned = legacyOutputOneOf([model, v.boolean()]);
	expect(Reflect.set(model.entries, 'value', lazy)).toBe(true);
	expect(() => projectOutput(owned)).toThrow('Legacy output oneOf alternatives cannot contain lazy schemas');
	expect(calls).toBe(0);
	const ids = misskeyIdOrIds();
	expect(Reflect.set(ids.options[1], 'item', lazy)).toBe(false);
});

test('actual output getter boundary rejects changing owned returns and outside semantic metadata', () => {
	for (const outside of [false, true]) {
		const owned = legacyOutputOneOf([v.string(), v.boolean()]);
		let calls = 0;
		const lazy = v.lazy(() => ++calls === 1 ? v.string() : outside ? owned : v.pipe(owned, v.metadata({ oneOf: [] })));
		const output = outside ? v.pipe(lazy, v.metadata({ oneOf: [] })) : lazy;
		expect(() => projectOutput(output)).toThrow('Owned union projections cannot be returned from lazy schemas');
		expect(calls).toBeGreaterThan(1);
	}
});

test('actual direct getter boundary rejects changing identifier returns and outside semantic metadata', () => {
	for (const outside of [false, true]) {
		const owned = misskeyIdOrIds();
		let calls = 0;
		const lazy = v.lazy(() => ++calls === 1 ? v.string() : outside ? owned : v.pipe(owned, v.metadata({ oneOf: [] })));
		const schema = outside ? v.pipe(lazy, v.metadata({ oneOf: [] })) : lazy;
		expect(() => toLegacyJsonSchema(schema, { target: 'openapi-3.0', typeMode: 'ignore' })).toThrow('Owned union projections cannot be returned from lazy schemas');
		expect(calls).toBeGreaterThan(1);
	}
});

test('actual lazy returns reject owned unions or retained option copies at every public nesting point', () => {
	for (const owned of [misskeyIdOrIds(), legacyOutputOneOf([v.string(), v.boolean()])]) {
		const copy = v.config(owned, {});
		for (const returned of [owned, copy, v.array(copy), v.nullable(copy), resultObject({ value: copy }), jsonObject({ value: copy }), v.union([v.string(), copy])]) {
			expect(() => toLegacyJsonSchema(v.lazy(() => returned), { target: 'openapi-3.0' })).toThrow('Owned union projections cannot be returned from lazy schemas');
		}
		expect(() => toLegacyJsonSchema(v.lazy(() => v.lazy(() => v.array(copy))), { target: 'openapi-3.0' })).toThrow('Owned union projections cannot be returned from lazy schemas');
	}
});

test('shared changing lazy returns cannot hide owned copies in later containing contexts', () => {
	const owned = misskeyIdOrIds();
	let calls = 0;
	const shared = v.lazy(() => ++calls === 1 ? v.string() : v.config(owned, {}));
	const root = v.union([v.array(shared), jsonObject({ value: shared })]);
	expect(() => toLegacyJsonSchema(root, { target: 'openapi-3.0' })).toThrow('Owned union projections cannot be returned from lazy schemas');
	expect(calls).toBeGreaterThan(1);
});

test('actual global-definition lazy returns cannot hide the owned identifier union', () => {
	const name = 'ChangingLazyOwnedUnionProof';
	const previous = getGlobalDefs()?.[name];
	const owned = misskeyIdOrIds();
	let calls = 0;
	const lazy = v.lazy(() => ++calls === 1 ? v.string() : owned);
	try {
		addGlobalDefs({ [name]: lazy });
		expect(() => toLegacyJsonSchema(v.array(lazy), { target: 'openapi-3.0' })).toThrow('Owned union projections cannot be returned from lazy schemas');
		expect(calls).toBeGreaterThan(1);
	} finally {
		const definitions = getGlobalDefs();
		if (definitions) {
			if (previous === undefined) delete definitions[name];
			else definitions[name] = previous;
		}
	}
});

test('unrelated lazy schemas and annotation-only containing pipelines remain supported', () => {
	const ordinary = v.lazy(() => resultObject({ label: v.string() }));
	expect(() => toLegacyJsonSchema(v.pipe(v.array(ordinary), v.metadata({ description: 'Unrelated lazy schema' })), { target: 'openapi-3.0' })).not.toThrow();
	let calls = 0;
	const changingOrdinary = v.lazy(() => ++calls === 1 ? v.string() : v.boolean());
	expect(() => toLegacyJsonSchema(changingOrdinary, { target: 'openapi-3.0' })).not.toThrow();
});

describe('exact two-route request and response projection parity', () => {
	for (const row of rows) {
		test(row.route, () => {
			const definition = row.route === 'meta' ? unionMetaDefinition : unionUsersRelationDefinition;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			expect(canonical(projection.input)).toEqual(canonical(row.input));
			expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual(convertSchemaToOpenApiSchema(row.output, 'res', true));
		});
	}
});

test('the real OpenAPI writer preserves the complete two-route document and published paths', () => {
	const saved = documentedEndpoints.slice();
	try {
		const config = { version: 'union-test', apiUrl: 'https://union.test/api' } as Config;
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => ({ name: row.route, meta: row.meta, params: row.input })));
		const before = genOpenapiSpec(config);
		documentedEndpoints.splice(0, documentedEndpoints.length, ...rows.map(row => {
			const definition = row.route === 'meta' ? unionMetaDefinition : unionUsersRelationDefinition;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			return { name: row.route, meta: { ...row.meta, res: projection.response }, params: projection.input };
		}));
		const after = genOpenapiSpec(config);
		expect(canonical(after)).toEqual(canonical(before));
		for (const row of rows) expect(canonical(after.paths['/' + row.route])).toEqual(row.openapi);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('AJV errors, defaults and original request identity match the original transport', async () => {
	const opaque = JSON.parse('{"__proto__":{"retained":true},"constructor":false,"prototype":null,"future":{"retained":true}}');
	const cases = [
		['meta', [{}, { detail: undefined }, { detail: true }, { detail: false }, { detail: null }, { detail: 0 }, { detail: 'true' }, opaque, [], null]],
		['users/relation', [{ userId: 'Ab12' }, { userId: [] }, { userId: ['Ab12', 'Ab12'] }, { userId: '' }, { userId: 'Ab-12' }, { userId: null }, { userId: ['Ab12', 1] }, { userId: [[]] }, {}, { userId: undefined }, { ...opaque, userId: 'Ab12' }, []]],
	] as const;
	for (const [route, samples] of cases) {
		const row = rows.find(row => row.route === route)!;
		const definition = definitions[route];
		const before = new Endpoint(transportMeta, row.input, async (params: unknown) => params);
		const after = new ContractEndpoint(transportMeta, projectEndpointContract<v.GenericSchema, v.GenericSchema>(defineEndpointContract({ path: '/parity-proof' }, definition.input, v.unknown())), async params => params);
		for (const sample of samples) {
			const oldInput = structuredClone(sample), newInput = structuredClone(sample);
			const [oldResult, newResult] = await Promise.allSettled([before.exec(oldInput, null, null), after.exec(newInput, null, null)]);
			expect(newResult).toEqual(oldResult);
			expect(newInput).toEqual(oldInput);
			if (newResult.status === 'fulfilled') expect(newResult.value).toBe(newInput);
			const parsed = v.safeParse(definition.input, structuredClone(sample));
			expect(parsed.success).toBe(oldResult.status === 'fulfilled');
			if (parsed.success) expect(parsed.output).toEqual(oldInput);
		}
	}
});

test('actual meta producer retains defaults, detail selection and unparsed output identity', async () => {
	const lite = { retainedLite: true };
	const detailed = { retainedDetailed: true };
	expect(v.safeParse(unionMetaDefinition.output, detailed).success).toBe(false);
	const producer = { pack: vi.fn().mockResolvedValue(lite), packDetailed: vi.fn().mockResolvedValue(detailed) };
	const endpoint = Reflect.construct(MetaEndpoint, [producer]);
	expect(await endpoint.exec({}, null, null)).toBe(detailed);
	expect(await endpoint.exec({ detail: false }, null, null)).toBe(lite);
	expect(producer.packDetailed).toHaveBeenCalledOnce();
	expect(producer.pack).toHaveBeenCalledOnce();
	expect(metaMetadata.requireCredential).toBe(false);
	expect(v.safeParse(unionMetaInput, {}).output).toEqual({ detail: true });
});

test('actual relation producer retains scalar arrays, repeated-input semantics and response extras', async () => {
	const relation = { id: 'Ab12', isFollowing: false, hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false, isFollowed: true, isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false, following: null };
	const producer = { getRelation: vi.fn().mockResolvedValue(relation), getRelations: vi.fn().mockResolvedValue(new Map([['Ab12', relation]])) };
	const endpoint = Reflect.construct(RelationEndpoint, [producer]);
	const scalar = await endpoint.exec({ userId: 'Ab12' }, me, null);
	expect(scalar).toEqual([relation]);
	expect(scalar[0]).toBe(relation);
	expect(Object.hasOwn(scalar[0], 'following')).toBe(true);
	expect(producer.getRelation).toHaveBeenCalledExactlyOnceWith(me.id, 'Ab12');
	const array = await endpoint.exec({ userId: ['Ab12', 'Ab12'] }, me, null);
	expect(array).toEqual([relation]);
	expect(array[0]).toBe(relation);
	expect(producer.getRelations).toHaveBeenCalledExactlyOnceWith(me.id, ['Ab12', 'Ab12']);
	expect(v.safeParse(unionUsersRelationInput, { userId: [] }).success).toBe(true);
	expect(relationMetadata.requireCredential).toBe(credentialMeta.requireCredential);
	expect(relationMetadata.kind).toBe(credentialMeta.kind);
	for (const [route, metadata] of [['meta', metaMetadata], ['users/relation', relationMetadata]] as const) {
		const { res: _nativeRes, ...nativeMeta } = metadata;
		const { res: _legacyRes, ...legacyMeta } = rows.find(row => row.route === route)!.meta;
		expect(nativeMeta).toEqual(legacyMeta);
	}
});
