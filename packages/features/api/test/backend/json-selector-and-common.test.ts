/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { test } from 'vitest';
import * as v from 'valibot';
import * as _Ajv from 'ajv';
import { jsonString, misskeyId } from '@features/api/contract/index.js';
import { jsonNumber } from '@features/api/contract/json-number.js';
import { jsonObject } from '@features/api/contract/json-object.js';
import {
	uniqueStringArray, getUniqueStringArrayBaseSchema, getUniqueStringArraySchemaRegistration,
} from '@features/api/contract/unique-string-array.js';
import {
	jsonSelectorUnion, jsonSelectorAndCommon,
	getJsonSelectorAndCommonSchemaRegistration, getJsonSelectorUnionRegistration,
	getJsonSelectorUnionOptionsRegistration,
} from '@features/api/contract/json-selector-and-common.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';

const Ajv = _Ajv.default;
const first = jsonObject({ userId: misskeyId });
const second = jsonObject({ username: v.string(), host: v.nullable(v.pipe(v.string(), v.metadata({ description: 'The local host is null.' }))) });
const selector = jsonSelectorUnion([first, second]);
const common = jsonObject({
	limit: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.optional(misskeyId),
	flag: v.optional(v.nullable(v.boolean()), null),
	names: v.optional(v.array(v.string())),
});
const input = jsonSelectorAndCommon(selector, common);
const expected = {
	allOf: [
		{ anyOf: [
			{ type: 'object', properties: { userId: { type: 'string', format: 'misskey:id' } }, required: ['userId'] },
			{ type: 'object', properties: { username: { type: 'string' }, host: { type: 'string', nullable: true, description: 'The local host is null.' } }, required: ['username', 'host'] },
		] },
		{ type: 'object', properties: {
			limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
			sinceId: { type: 'string', format: 'misskey:id' },
			flag: { type: 'boolean', nullable: true, default: null },
			names: { type: 'array', items: { type: 'string' } },
		} },
	],
};
const definition = defineEndpointContract({ method: 'POST', path: '/selector-common-proof' }, input, v.void());
const projected = projectEndpointContract(definition).input;

function validator(schema: object) {
	const ajv = new Ajv({ useDefaults: true });
	ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
	return ajv.compile(schema);
}

test('selector/common projection retains exact order, omission, annotations and defaults', () => {
	assert.deepEqual(projected, expected);
	assert.equal('type' in projected, false);
	assert.equal(Object.hasOwn(projected.allOf![1], 'required'), false);
	assert.equal(getJsonSelectorUnionRegistration(selector)!.options[0], first);
	assert.equal(getJsonSelectorUnionRegistration(selector)!.options[1], second);
});

test('native own-JSON acceptance/defaults match the exact projected AJV schema', () => {
	const validate = validator(projected);
	const cases: unknown[] = [
		{}, { userId: 'a' }, { username: 'name', host: null }, { username: 'name', host: 'remote' },
		{ userId: 'a', username: 7 }, { userId: 'bad-id', username: 'name', host: null },
		{ userId: 'a', username: 'name', host: null }, { username: 'name' },
		{ userId: null }, { userId: 'a', limit: 1 }, { userId: 'a', limit: 100 },
		{ userId: 'a', limit: 0 }, { userId: 'a', limit: 101 }, { userId: 'a', limit: 1.5 },
		{ userId: 'a', limit: null }, { userId: 'a', limit: '7' },
		{ userId: 'a', flag: null }, { userId: 'a', flag: true }, { userId: 'a', flag: 1 },
		{ userId: 'a', names: ['same', 'same'] }, { userId: 'a', names: [1] },
		null, [], 'x', false, 3,
	];
	for (const value of cases) {
		const nativeInput = structuredClone(value); const before = structuredClone(value); const transport = structuredClone(value);
		const native = v.safeParse(input, nativeInput); const valid = validate(transport);
		assert.equal(native.success, valid, JSON.stringify(value));
		assert.deepEqual(nativeInput, before);
		if (native.success) assert.deepEqual(native.output, transport);
	}
});

test('native explicit undefined common defaults win over opaque selector copies', () => {
	const value = { userId: 'a', limit: undefined, flag: undefined, sinceId: undefined };
	const parsed = v.parse(input, value);
	assert.equal(parsed.limit, 10); assert.equal(parsed.flag, null);
	assert.equal(Object.hasOwn(parsed, 'sinceId'), true); assert.equal(parsed.sinceId, undefined);
	assert.equal(Object.hasOwn(value, 'limit'), true); assert.equal(value.limit, undefined);
	assert.equal(v.safeParse(input, { userId: undefined }).success, false);
});

test('native parsing accepts both branches and invalid inactive extras without exclusivity', () => {
	assert.equal(v.safeParse(input, { userId: 'a', username: 7, host: false }).success, true);
	assert.equal(v.safeParse(input, { userId: 'bad-id', username: 'name', host: null }).success, true);
	assert.equal(v.safeParse(input, { userId: 'a', username: 'name', host: null }).success, true);
});

test('native spread retains poison keys and opaque identity with a plain safe output', () => {
	const value = JSON.parse('{"userId":"a","constructor":"opaque","prototype":"opaque","__proto__":{"poison":true}}');
	const opaque = { circular: undefined as unknown }; opaque.circular = opaque;
	const fn = () => 'opaque'; value.opaque = opaque; value.fn = fn; value.undef = undefined;
	const parsed = v.parse(input, value);
	assert.equal(parsed.constructor, 'opaque'); assert.equal(parsed.prototype, 'opaque');
	assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
	assert.equal(Object.hasOwn(parsed, '__proto__'), true); assert.equal(parsed.__proto__, value.__proto__);
	assert.equal(parsed.opaque, opaque); assert.equal(parsed.fn, fn); assert.equal(Object.hasOwn(parsed, 'undef'), true);
});

test('native common parsing reads inherited values from the same original input', () => {
	for (const [inherited, output] of [[7, 7], [undefined, 10]] as const) {
		const value = Object.create({ userId: 'a', limit: inherited, inheritedUnknown: 'ignored' });
		const parsed = v.parse(input, value);
		assert.equal(parsed.limit, output); assert.equal(parsed.userId, 'a');
		assert.equal(Object.hasOwn(parsed, 'inheritedUnknown'), false);
		assert.equal(Object.hasOwn(value, 'limit'), false);
	}
	assert.equal(v.safeParse(input, Object.create({ userId: 'a', limit: 'bad' })).success, false);
});

test('selector failure never invokes common validation or defaults', () => {
	const value = { limit: 'bad' }; let reads = 0;
	Object.defineProperty(value, 'limit', { enumerable: false, get: () => { reads++; return 'bad'; } });
	assert.equal(v.safeParse(input, value).success, false);
	assert.equal(reads, 0);
});

test('original/projected AJV retain complete errors and success/failure mutation timing', () => {
	const before = validator(expected); const after = validator(projected);
	for (const value of [{}, { userId: 'a' }, { userId: 'a', sinceId: 1 }, { userId: 'a', limit: 101 }, { username: 'name' }]) {
		const oldInput = structuredClone(value); const newInput = structuredClone(value);
		assert.equal(after(newInput), before(oldInput));
		assert.deepEqual(after.errors, before.errors); assert.deepEqual(newInput, oldInput);
	}
});

test('actual Endpoint preserves the original object/prototype and presence-based handler values', async () => {
	const received: unknown[] = [];
	const endpoint = new ContractEndpoint({ tags: ['proof'] }, projectEndpointContract(definition), async value => { received.push(value); });
	const value = Object.create({ userId: 'a', limit: 7 }); value.username = 42;
	await endpoint.exec(value, null, null);
	assert.equal(received[0], value); assert.equal(value.limit, 7); assert.equal(value.username, 42);
	await assert.rejects(endpoint.exec({}, null, null), error => error instanceof Error && 'code' in error && error.code === 'INVALID_PARAM');
	assert.equal(received.length, 1);
});

test('selector/common supports nested string arrays without duplicate rejection and code-point strings', () => {
	const nested = jsonSelectorAndCommon(jsonSelectorUnion([
		jsonObject({ tag: jsonString({ minLength: 1, maxLength: 2 }) }),
		jsonObject({ query: v.pipe(v.array(v.pipe(v.array(jsonString({ minLength: 1 })), v.minLength(1))), v.minLength(1)) }),
	]), jsonObject({ flag: v.optional(v.boolean(), false) }));
	for (const value of [{ tag: '😀😀' }, { query: [['same', 'same'], ['same']] }]) assert.equal(v.safeParse(nested, value).success, true);
	for (const value of [{ tag: '😀😀😀' }, { query: [[]] }, { query: [] }]) assert.equal(v.safeParse(nested, value).success, false);
});

test('three original selectors retain ordered anyOf, exact unique IDs and overlapping acceptance', () => {
	const ids = jsonObject({ userIds: uniqueStringArray(misskeyId) });
	const username = jsonObject({ username: v.string() });
	const supplied: [typeof first, typeof ids, typeof username] = [first, ids, username];
	const three = jsonSelectorUnion(supplied);
	const shared = jsonObject({ host: v.optional(v.pipe(v.nullable(v.string()), v.description('The local host is represented with `null`.'))) });
	const native = jsonSelectorAndCommon(three, shared);
	const projection = projectEndpointContract(defineEndpointContract({ method: 'POST', path: '/three-selector-proof' }, native, v.void())).input;
	assert.deepEqual(projection, {
		allOf: [
			{ anyOf: [
				{ type: 'object', properties: { userId: { type: 'string', format: 'misskey:id' } }, required: ['userId'] },
				{ type: 'object', properties: { userIds: { type: 'array', items: { type: 'string', format: 'misskey:id' }, uniqueItems: true } }, required: ['userIds'] },
				{ type: 'object', properties: { username: { type: 'string' } }, required: ['username'] },
			] },
			{ type: 'object', properties: { host: { type: 'string', nullable: true, description: 'The local host is represented with `null`.' } } },
		],
	});
	const registration = getJsonSelectorUnionRegistration(three)!;
	assert.notEqual(registration.options, supplied);
	supplied.reverse();
	assert.deepEqual(registration.options, [first, ids, username]);
	assert.equal(three.options, registration.options);
	assert.ok(Object.isFrozen(three)); assert.ok(Object.isFrozen(three.options));
	const validate = validator(projection);
	const cases: readonly [unknown, boolean][] = [
		[{}, false], [{ userId: 'Ab12' }, true], [{ userIds: [] }, true], [{ username: '' }, true],
		[{ userIds: ['Ab12', 'ab12'] }, true], [{ userIds: ['Ab12', 'Ab12'] }, false],
		[{ userIds: ['bad-id'] }, false], [{ userIds: [1] }, false],
		[{ username: 42 }, false], [{ userId: 'Ab12', username: 42, userIds: [1] }, true],
		[{ userId: 'bad-id', username: '' }, true], [{ userIds: ['Ab12', 'Ab12'], username: '' }, true],
		[{ userId: 'Ab12', userIds: ['Ab12'], username: '' }, true],
		[{ username: '', host: null }, true], [{ username: '', host: 'remote' }, true],
		[{ userId: 'Ab12', host: false }, false], [null, false], [[], false],
	];
	for (const [value, success] of cases) {
		const suppliedValue = structuredClone(value); const transport = structuredClone(value);
		const parsed = v.safeParse(native, suppliedValue);
		assert.equal(parsed.success, success, JSON.stringify(value));
		assert.equal(validate(transport), success, JSON.stringify(value));
		assert.deepEqual(suppliedValue, value);
		if (parsed.success) assert.deepEqual(parsed.output, transport);
	}
	const absent = v.parse(native, { userIds: [] });
	assert.equal(Object.hasOwn(absent, 'host'), false);
	const explicit = v.parse(native, { userIds: [], host: undefined });
	assert.equal(Object.hasOwn(explicit, 'host'), true); assert.equal(explicit.host, undefined);
});

test('selector unions admit only two or three options and validate every original option', () => {
	// @ts-expect-error The public tuple requires two or three alternatives.
	assert.throws(() => jsonSelectorUnion([]), /exactly two or three/);
	// @ts-expect-error A single selector is outside the bounded public API.
	assert.throws(() => jsonSelectorUnion([first]), /exactly two or three/);
	// @ts-expect-error Four selectors are outside the bounded public API.
	assert.throws(() => jsonSelectorUnion([first, second, first, second]), /exactly two or three/);
	const username = jsonObject({ username: v.string() });
	assert.throws(() => jsonSelectorUnion([first, username, v.looseObject({ userIds: v.array(misskeyId) })]), /original registered JSON-object/);
	assert.throws(() => jsonSelectorUnion([first, username, jsonObject({ userIds: v.pipe(v.array(misskeyId), v.check(() => true)) })]), /unsupported validation/);
	const three = jsonSelectorUnion([first, jsonObject({ userIds: uniqueStringArray(misskeyId) }), username]);
	assert.throws(() => jsonSelectorAndCommon(three, jsonObject({ username: v.optional(v.string()) })), /disjoint/);
});

test('exact unique helpers retain reviewed strings, outer annotations and array bounds', () => {
	const original = uniqueStringArray(jsonString({ minLength: 1, maxLength: 2 }));
	const values = v.pipe(v.pipe(original, v.minLength(1)), v.maxLength(2), v.metadata({ description: 'Unique choices' }));
	const native = jsonSelectorAndCommon(jsonSelectorUnion([jsonObject({ values }), jsonObject({ alternate: v.string() })]), jsonObject({ extra: v.optional(uniqueStringArray(v.string())) }));
	const projected = projectEndpointContract(defineEndpointContract({ method: 'POST', path: '/unique-wrapper-proof' }, native, v.void())).input;
	assert.deepEqual(projected.allOf![0].anyOf![0].properties!.values, {
		type: 'array', items: { type: 'string', minLength: 1, maxLength: 2 }, uniqueItems: true,
		minItems: 1, maxItems: 2, description: 'Unique choices',
	});
	const validate = validator(projected);
	for (const [value, success] of [
		[{ values: ['😀😀', 'ab'], extra: ['same', 'Same'] }, true],
		[{ values: [] }, false], [{ values: ['a', 'b', 'c'] }, false],
		[{ values: ['a', 'a'] }, false], [{ values: ['😀😀😀'] }, false],
		[{ values: ['a'], extra: ['same', 'same'] }, false],
	] as const) {
		assert.equal(v.safeParse(native, value).success, success);
		assert.equal(validate(structuredClone(value)), success);
	}
	const registration = getUniqueStringArraySchemaRegistration(original)!;
	assert.equal(registration.schema, original); assert.equal(registration.pipe, original.pipe);
	assert.equal(registration.array, original.pipe[0]); assert.equal(registration.action, original.pipe[1]);
	assert.equal(getUniqueStringArrayBaseSchema(registration.action), registration.array);
	assert.ok([original, original.pipe, registration, registration.array, registration.action, original.item].every(Object.isFrozen));
	assert.equal(Reflect.set(original, 'item', v.string()), false);
	assert.equal(Reflect.set(original.pipe, '1', v.check(() => true)), false);
	assert.equal(Reflect.set(registration.array, 'item', v.string()), false);
});

test('selector uniqueness rejects copied pipelines, copied checks, copied arrays and detached actions', () => {
	const original = uniqueStringArray(v.string());
	const [array, action] = original.pipe;
	const copied = { ...original };
	assert.equal(getUniqueStringArraySchemaRegistration(copied), undefined);
	assert.equal(getUniqueStringArrayBaseSchema({ ...action }), undefined);
	for (const field of [
		copied, { ...original, pipe: [...original.pipe] },
		v.pipe(array, action), v.pipe({ ...array }, action), v.pipe(v.array(v.string()), action),
		v.pipe(array, { ...action }), v.pipe(array, { ...action, requirement: () => true }),
		v.pipe(array, v.description('separated'), action), v.pipe(array, action, action),
		v.pipe(copied, v.description('copied base')), v.pipe(v.array(v.string()), v.check(() => true)),
	]) {
		assert.throws(() => jsonSelectorUnion([jsonObject({ values: field }), jsonObject({ alternate: v.string() })]), /original helper|unsupported validation/);
		assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ values: v.optional(field) })), /original helper|unsupported validation/);
	}
});

test('selector uniqueness cannot hide transforms, semantic metadata or nested unique arrays', () => {
	// @ts-expect-error Unique-string helpers do not accept array-valued items.
	const nestedHelper = uniqueStringArray(v.array(v.string()));
	for (const field of [
		nestedHelper, v.array(uniqueStringArray(v.string())),
		uniqueStringArray(v.pipe(v.string(), v.transform(value => value.toLowerCase()))),
		uniqueStringArray(v.pipe(v.string(), v.check(() => true))),
		v.pipe(uniqueStringArray(v.string()), v.transform(value => value)),
		v.pipe(uniqueStringArray(v.string()), v.check(() => true)),
		v.pipe(uniqueStringArray(v.string()), v.metadata({ uniqueItems: true })),
		uniqueStringArray(v.pipe(v.string(), v.metadata({ type: 'number' }))),
	]) assert.throws(() => jsonSelectorUnion([jsonObject({ values: field }), jsonObject({ alternate: v.string() })]));
	const original = uniqueStringArray(v.string());
	const native = jsonSelectorAndCommon(jsonSelectorUnion([jsonObject({ values: original }), jsonObject({ alternate: v.string() })]), jsonObject({}));
	assert.throws(() => toLegacyJsonSchema(v.object({ native, sibling: v.pipe(original.item, v.metadata({ type: 'number' })) })), /annotation-only/);
});

test('three-selector copied options retain eager-only provenance under every lazy ancestor', () => {
	const three = jsonSelectorUnion([first, jsonObject({ userIds: uniqueStringArray(misskeyId) }), jsonObject({ username: v.string() })]);
	const copied = { ...three };
	assert.equal(getJsonSelectorUnionRegistration(copied), undefined);
	assert.equal(getJsonSelectorUnionOptionsRegistration(copied.options), getJsonSelectorUnionRegistration(three));
	assert.equal(getJsonSelectorUnionOptionsRegistration([...copied.options]), undefined);
	for (const schema of [three, copied, v.union(three.options), v.looseObject({ nested: copied })]) {
		assert.throws(() => toLegacyJsonSchema(v.lazy(() => schema)), /cannot appear in lazy/);
		assert.throws(() => toLegacyJsonSchema(v.pipe(v.lazy(() => schema), v.metadata({ type: 'number' }))), /cannot appear in lazy/);
	}
});

test('construction rejects stock/copied unions and stock/copied object wrappers', () => {
	for (const union of [v.union([first, second]), { ...selector }]) assert.throws(() => jsonSelectorAndCommon(union, common), /original registered selector union/);
	for (const object of [v.looseObject({ userId: misskeyId }), { ...first }]) assert.throws(() => jsonSelectorUnion([object, second]), /original registered JSON-object/);
	assert.throws(() => jsonSelectorAndCommon(selector, { ...common }), /original registered JSON-object/);
});

test('construction rejects optional/defaulted selectors, required common fields and overlap', () => {
	for (const field of [v.optional(v.string()), v.optional(v.string(), 'default'), v.nullable(v.string(), null)]) {
		assert.throws(() => jsonSelectorUnion([jsonObject({ userId: field }), second]), /unsupported|default-free/);
	}
	assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ limit: v.string() })), /outer optional/);
	assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ userId: v.optional(v.string()) })), /disjoint/);
});

test('construction rejects transforms, checks, unregistered custom, nested defaults and unsupported trees', () => {
	const fields = [
		v.pipe(v.string(), v.transform(value => value)), v.pipe(v.string(), v.check(() => true)),
		v.custom<string>(() => true), v.lazy(() => v.string()), v.fallback(v.string(), 'default'),
		v.nullable(v.string(), 'default'), v.optional(v.string()), v.object({ nested: v.string() }),
		v.record(v.string(), v.string()), v.tuple([v.string()]), v.array(v.array(v.array(v.string()))),
		v.array(v.number()), v.pipe(v.string(), v.minLength(1)), v.pipe(v.string(), v.maxLength(5)),
	];
	for (const field of fields) assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ bad: v.optional(field) })));
	for (const fallback of [() => 1, [], {}, Infinity, NaN]) {
		// Deliberately erased schema fixtures exercise runtime construction boundaries.
		const field: v.GenericSchema = v.optional(v.unknown(), fallback);
		assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ bad: field })), /static JSON scalars|unsupported/);
	}
});

test('helper, captured options, admitted field actions and metadata boundaries are frozen', () => {
	const registration = getJsonSelectorAndCommonSchemaRegistration(input)!;
	assert.ok([input, registration, registration.guard, registration.parser, selector, getJsonSelectorUnionRegistration(selector)!.options].every(Object.isFrozen));
	assert.equal(Reflect.set(selector, 'options', []), false);
	assert.equal(Reflect.set(common.entries.limit, 'default', 99), false);
	assert.equal(Reflect.set(first.entries.userId, 'reference', v.string), false);
	const pipe = second.entries.host.wrapped.pipe;
	assert.ok(Object.isFrozen(pipe)); assert.ok(Object.isFrozen(pipe[1])); assert.ok(Object.isFrozen(pipe[1].metadata));
});

test('outer official annotations survive but semantic/disguised metadata fail at every occurrence', () => {
	assert.equal(toLegacyJsonSchema(v.pipe(input, v.metadata({ description: 'outer' }))).description, 'outer');
	for (const metadata of [{ type: 'string' }, { required: [] }, { required: undefined }, { nullable: false }, { default: {} }, { allOf: [] }, { uniqueItems: true }, { format: 'email' }]) {
		assert.throws(() => toLegacyJsonSchema(v.pipe(input, v.metadata(metadata))), /annotation-only|annotations/);
		assert.throws(() => jsonSelectorAndCommon(selector, jsonObject({ bad: v.optional(v.pipe(v.string(), v.metadata(metadata))) })), /annotation-only/);
	}
	const disguised: v.GenericValidation = { ...v.check(() => true), type: 'metadata' };
	assert.throws(() => toLegacyJsonSchema(v.pipe(input, disguised)), /disguised/);
});

test('copied helpers, bare guards, detached/reordered/substituted parser pairs fail projection', () => {
	const registration = getJsonSelectorAndCommonSchemaRegistration(input)!;
	for (const schema of [
		{ ...input }, registration.guard,
		v.pipe(registration.guard, v.rawTransform(({ dataset }) => dataset.value)),
		v.pipe(v.custom(() => true), registration.parser),
		v.pipe(registration.guard, v.description('separated'), registration.parser),
	]) {
		assert.throws(() => projectEndpointContract(defineEndpointContract({ method: 'POST', path: '/bad-proof' }, schema, v.void())));
	}
});

test('containing arbitrary checks, transforms, output tuples and packed refs remain rejected', () => {
	const check = v.pipe(input, v.check(() => true)); const transform = v.pipe(input, v.transform(value => value));
	for (const schema of [check, transform, v.object({ input, tuple: v.tuple([v.string()]) })]) {
		assert.throws(() => projectEndpointContract(defineEndpointContract({ method: 'POST', path: '/bad-proof' }, schema, v.void())));
	}
});

test('shared child/definition occurrences retain semantic metadata protection before deduplication', () => {
	const shared = v.string();
	const helper = jsonSelectorAndCommon(jsonSelectorUnion([jsonObject({ id: shared }), jsonObject({ name: v.string() })]), jsonObject({ common: v.optional(v.string()) }));
	const sibling = v.pipe(shared, v.metadata({ type: 'number' }));
	assert.throws(() => toLegacyJsonSchema(v.object({ helper, sibling })), /annotation-only/);
	assert.throws(() => toLegacyJsonSchema(helper, { definitions: { sibling } }), /annotation-only/);
});

test('named selector/common schemas share one converter context and expose original hook identities', () => {
	const encountered = new Set<object>(); const actionIdentities = new Set<object>();
	const schema = toLegacyJsonSchema(input, {
		target: 'openapi-3.0', typeMode: 'ignore', definitions: { selector, common },
		overrideSchema: ({ valibotSchema }) => { encountered.add(valibotSchema); return undefined; },
		overrideAction: ({ valibotAction }) => { actionIdentities.add(valibotAction); return undefined; },
	});
	assert.deepEqual(schema.allOf, [{ $ref: '#/$defs/selector' }, { $ref: '#/$defs/common' }]);
	assert.ok(schema.$defs?.selector); assert.ok(schema.$defs?.common);
	assert.ok(encountered.has(selector)); assert.ok(encountered.has(common));
	assert.ok(actionIdentities.has(getJsonSelectorAndCommonSchemaRegistration(input)!.parser));
});

test('owned selector/common helpers are eager-only even under semantic ancestor metadata', () => {
	for (const owned of [selector, input]) {
		assert.throws(() => toLegacyJsonSchema(v.pipe(v.lazy(() => owned), v.metadata({ type: 'number' }))), /cannot appear in lazy/);
	}
});

test('lazy selector copies retaining the exact owned options tuple stay eager-only', () => {
	const copied = { ...selector };
	const registration = getJsonSelectorUnionRegistration(selector);
	assert.equal(copied.options, selector.options);
	assert.ok(Object.isFrozen(copied.options));
	assert.equal(getJsonSelectorUnionRegistration(copied), undefined);
	assert.equal(getJsonSelectorUnionOptionsRegistration(copied.options), registration);
	assert.equal(getJsonSelectorUnionOptionsRegistration([...copied.options]), undefined);
	for (const schema of [copied, v.union(selector.options), v.looseObject({ nested: copied })]) {
		assert.throws(() => toLegacyJsonSchema(v.lazy(() => schema)), /cannot appear in lazy/);
		assert.throws(() => toLegacyJsonSchema(v.pipe(v.lazy(() => schema), v.metadata({ type: 'number' }))), /cannot appear in lazy/);
	}
});

test('changing actual lazy returns cannot introduce nested owned helpers after preflight', () => {
	let calls = 0;
	const changing = v.lazy(() => calls++ === 0 ? v.string() : v.looseObject({ nested: input }));
	changing.getter(undefined);
	assert.throws(() => toLegacyJsonSchema(v.pipe(changing, v.metadata({ type: 'string' }))), /cannot appear in lazy/);
});

test('ordinary lazy conversion remains supported outside these eager-only helpers', () => {
	const schema = toLegacyJsonSchema(v.lazy(() => v.string()));
	assert.ok(schema.$ref);
	const ordinaryUnion = v.union([...selector.options]);
	assert.equal(getJsonSelectorUnionOptionsRegistration(ordinaryUnion.options), undefined);
	assert.ok(toLegacyJsonSchema(v.lazy(() => ordinaryUnion)).$ref);
});
