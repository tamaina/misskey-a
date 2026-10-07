/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { test } from 'vitest';
import * as v from 'valibot';
import _Ajv from 'ajv';
import { jsonNumber } from '../../../../features/api/contract/json-number.js';
import { jsonObject, getJsonObjectGuardRegistration } from '../../../../features/api/contract/json-object.js';
import { toLegacyJsonSchema as proposed } from '../../../../features/api/backend/index.js';
import { projectEndpointContract } from './contract-endpoint.js';
import { getJsonObjectParserRegistration } from '../../../../features/api/contract/json-object.js';
import { uniqueStringArray } from '../../../../features/api/contract/unique-string-array.js';
import { objectParams, misskeyId } from '../../../../features/api/contract/index.js';
import { toLegacyJsonSchema as current } from '../../../../features/api/backend/index.js';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import { Endpoint } from './endpoint-base.js';

const Ajv = _Ajv.default;
const proof = test;
const primitives = [null, false, true, 0, 1, '', 'x', [], [null], [1, 2]];
const entries = { name: v.exactOptional(v.string()), mode: v.optional(v.picklist(['classic', 'simple']), 'classic'), nested: v.exactOptional(v.nullable(jsonObject({ enabled: v.optional(v.boolean(), false) }))) };
const stock = v.looseObject({ ...entries, nested: v.exactOptional(v.nullable(v.looseObject({ enabled: v.optional(v.boolean(), false) }))) });
const guarded = jsonObject(entries);
const definition = defineEndpointContract({ method: 'POST', path: '/guard-proof' }, guarded, v.void());
const intersection = v.intersect([objectParams, stock]);
const expected = current(stock, { target: 'openapi-3.0', typeMode: 'ignore' });
const projected = projectEndpointContract(definition).input;
const ajv = new Ajv({ useDefaults: true });
ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
const validate = ajv.compile(projected);

proof('exact legacy projection has no guard allOf or dialect and keeps static defaults', () => assert.deepEqual(projected, expected));
proof('JSON primitives and arrays are rejected at root by native guard and actual AJV', () => {
	for (const value of primitives) { assert.equal(v.safeParse(guarded, value).success, false, JSON.stringify(value)); assert.equal(validate(structuredClone(value)), false, JSON.stringify(value)); }
	assert.equal(v.safeParse(v.looseObject({}), []).success, true);
});
proof('JSON primitives and arrays are rejected at nested object boundaries while nullable null works', () => {
	for (const value of primitives.filter(x => x !== null)) { const data = { nested: value }; assert.equal(v.safeParse(guarded, data).success, false, JSON.stringify(data)); assert.equal(validate(structuredClone(data)), false, JSON.stringify(data)); }
	assert.equal(v.safeParse(guarded, { nested: null }).success, true); assert.equal(validate({ nested: null }), true);
});
proof('ordinary extra fields pass through and absent static defaults are filled at both levels', () => {
	for (const data of [{}, { name: 'name', extra: { opaque: true } }, { nested: { extra: [1, 2] } }]) {
		const original = structuredClone(data); const native = v.parse(guarded, data); const transport = structuredClone(data);
		assert.equal(validate(transport), true); assert.deepEqual(native, transport); assert.deepEqual(data, original);
	}
});
proof('known bad field types stay rejected and enum values stay narrowed', () => {
	for (const data of [{ name: 1 }, { mode: 'other' }, { nested: { enabled: 1 } }]) { assert.equal(v.safeParse(guarded, data).success, false); assert.equal(validate(structuredClone(data)), false); }
});
proof('outer annotations and legacy required/nullable flags survive the exact object projection', () => {
	const a = v.pipe(guarded, v.metadata({ required: undefined, nullable: false, description: 'outer object annotation' }));
	const b = v.pipe(stock, v.metadata({ required: undefined, nullable: false, description: 'outer object annotation' }));
	assert.deepEqual(proposed(a, { target: 'openapi-3.0', typeMode: 'ignore' }), current(b, { target: 'openapi-3.0', typeMode: 'ignore' }));
});
proof('explicit caller override for the actual underlying schema retains precedence', () => {
	const base = getJsonObjectGuardRegistration(guarded.pipe[0])!.base;
	assert.deepEqual(proposed(guarded, { overrideSchema: ({ valibotSchema }) => valibotSchema === base ? { type: 'string', description: 'caller override' } : undefined }), { type: 'string', description: 'caller override' });
});
proof('unrelated multiple-schema pipeline errors are not suppressed by a guarded sibling', () => {
	const unrelated = v.pipe(v.unknown(), v.number());
	assert.throws(() => current(unrelated));
	assert.throws(() => proposed(jsonObject({ other: unrelated })), /multiple schemas/g);
	const genericGuard: v.GenericSchema = guarded;
	assert.throws(() => proposed(v.pipe(genericGuard, v.number())), /multiple schemas/g);
});
proof('draft-07, draft-2020-12 and OpenAPI 3.0 targets preserve exact wrapped projection', () => {
	for (const target of ['draft-07', 'draft-2020-12', 'openapi-3.0'] as const) {
		assert.deepEqual(proposed(v.nullable(guarded), { target }), current(v.nullable(stock), { target }));
		assert.deepEqual(proposed(v.optional(guarded), { target }), current(v.optional(stock), { target }));
	}
});
proof('intersection has a concrete legacy JSON extra-key regression that the pipeline avoids', () => {
	const data = JSON.parse('{"constructor":"extra"}');
	assert.equal(validate(structuredClone(data)), true);
	assert.equal(v.safeParse(intersection, data).success, false);
	assert.equal(v.safeParse(guarded, data).success, true);
});
proof('pipeline also keeps native explicit-undefined defaults while intersection cannot merge them', () => {
	assert.equal(v.safeParse(guarded, { mode: undefined }).success, true);
	assert.equal(v.safeParse(intersection, { mode: undefined }).success, false);
});
proof('entry allowlists stay explicit and known field validators retain identity', () => {
	assert.notEqual(guarded.entries, entries); assert.deepEqual(guarded.entries, entries); assert.equal(guarded.entries.name, entries.name); assert.deepEqual(Object.keys(guarded.entries).sort(), ['mode', 'name', 'nested']);
});

const poison = JSON.parse('{"constructor":"extra","__proto__":{"flag":true},"prototype":"extra","ordinary":true}');
const stockPoison = v.parse(v.looseObject({}), poison);
const pipelinePoison = v.parse(jsonObject({}), poison);
assert.deepEqual(pipelinePoison, poison); assert.equal(Object.getPrototypeOf(pipelinePoison), Object.prototype); assert.equal(Object.prototype.hasOwnProperty.call(pipelinePoison, '__proto__'), true);
assert.throws(() => proposed(v.pipe(jsonObject({}), v.metadata({ type: 'array' }))), /proven no-op object metadata/);

proof('actual Endpoint AJV rejects before callbacks and preserves payload identity/default mutation', async () => {
// The actual Endpoint class validates the generated schema and passes the original payload to its callback.
const seen: unknown[] = [];
const endpoint = new Endpoint({}, projected, async params => { seen.push(params); });
for (const value of primitives) await assert.rejects(endpoint.exec(structuredClone(value), null, null), { code: 'INVALID_PARAM' });
assert.equal(seen.length, 0);
const payload = { nested: { extra: 'nested' }, extra: 'root' };
await endpoint.exec(payload, null, null);
assert.equal(seen[0], payload); assert.deepEqual(payload, { nested: { extra: 'nested', enabled: false }, extra: 'root', mode: 'classic' });
});
proof('actual static bridge candidate accepts only the registered parser and checks its underlying schema', () => {
	assert.deepEqual(projectEndpointContract(definition).input, projected);
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/dynamic-default' }, jsonObject({ mode: v.optional(v.string(), () => 'x') }), v.void())), /static defaults/);
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/nested-transform' }, jsonObject({ name: v.pipe(v.string(), v.transform(value => value + 'x')) }), v.void())), /transformations/);
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/unregistered-transform' }, v.pipe(objectParams, v.rawTransform(({ dataset }) => dataset.value)), v.void())), /transformations/);
	const guard = guarded.pipe[0];
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/bare-guard' }, guard, v.void())), /registered parser pipeline/);
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/missing-parser' }, v.pipe(guard, v.description('missing parser')), v.void())), /exact guard and parser pair/);
	const parser = guarded.pipe[1];
	assert.ok(getJsonObjectParserRegistration(parser));
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/wrong-guard' }, v.pipe(objectParams, parser), v.void())), /exact guard and parser pair/);
});
proof('registered unique-array validation and its metadata protection remain effective inside parsed JSON objects', () => {
	const good = jsonObject({ names: uniqueStringArray(v.string()) });
	assert.equal(v.safeParse(good, { names: ['a', 'a'] }).success, false);
	assert.deepEqual(projectEndpointContract(defineEndpointContract({ path: '/unique' }, good, v.void())).input.properties!.names, { type: 'array', items: { type: 'string' }, uniqueItems: true });
	const bad = v.pipe(jsonObject({ names: uniqueStringArray(v.string()) }), v.metadata({ properties: { names: { type: 'array', items: { type: 'string' } } } }));
	assert.throws(() => projectEndpointContract(defineEndpointContract({ path: '/bad-unique' }, bad, v.void())), /annotation-only metadata|proven no-op object metadata/);
});
proof('unknown own properties are preserved recursively, with opaque value identity and safe prototypes', () => {
	const opaque = { deep: [false, 3] };
	const data = JSON.parse('{"constructor":"root","__proto__":{"root":true},"nested":{"constructor":"nested","__proto__":{"nested":true}}}');
	data.opaque = opaque;
	const parsed = v.parse(guarded, data);
	assert.equal(parsed.opaque, opaque);
	assert.equal(parsed.__proto__, data.__proto__);
	assert.ok(parsed.nested !== null && parsed.nested !== undefined);
	assert.equal(parsed.nested.__proto__, data.nested.__proto__);
	assert.equal(parsed.constructor, 'root'); assert.equal(parsed.nested.constructor, 'nested');
	assert.equal(Object.getPrototypeOf(parsed), Object.prototype); assert.equal(Object.getPrototypeOf(parsed.nested), Object.prototype);
	assert.equal(Object.prototype.hasOwnProperty.call(parsed, '__proto__'), true); assert.equal(Object.prototype.hasOwnProperty.call(parsed.nested, '__proto__'), true);
	assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'root'), false);
	const transport = structuredClone(data); assert.equal(validate(transport), true); assert.deepEqual(parsed, transport);
});

proof('unknown extra values remain permissive, without recursive sanitization or finite-number validation', () => {
	const cycle: { self?: unknown } = {}; cycle.self = cycle;
	const extras = { infinity: Number.POSITIVE_INFINITY, undefined: undefined, callback: () => 'opaque', cycle };
	const parsed = v.parse(guarded, extras);
	assert.equal(parsed.infinity, Number.POSITIVE_INFINITY); assert.equal(parsed.undefined, undefined);
	assert.equal(parsed.callback, extras.callback); assert.equal(parsed.cycle, cycle);
	assert.equal(validate(extras), true);
});
proof('schema/action registration is immutable and later entry-map mutations cannot change the parser', () => {
	const source: { name: v.GenericSchema<string, string> } = { name: v.string() }; const captured = jsonObject(source);
	source.name = v.string('changed message');
	assert.notEqual(captured.entries.name, source.name);
	assert.equal(Object.isFrozen(captured), true); assert.equal(Object.isFrozen(captured.pipe), true);
	assert.equal(Object.isFrozen(captured.pipe[0]), true); assert.equal(Object.isFrozen(captured.pipe[1]), true);
	assert.equal(Object.isFrozen(captured.entries), true);
});

proof('protected object and ancestor metadata cannot replace validation semantics', () => {
	for (const metadata of [{ type: 'array' }, { properties: {} }, { additionalProperties: false }, { anyOf: [{}] }, { not: {} }, { nullable: true }, { required: ['other'] }]) {
		assert.throws(() => proposed(v.pipe(jsonObject({}), v.metadata(metadata))), /proven no-op object metadata/);
		assert.throws(() => proposed(v.pipe(v.looseObject({ child: jsonObject({}) }), v.metadata(metadata))), /proven no-op object metadata/);
	}
	assert.throws(() => proposed(v.pipe(v.nullable(jsonObject({})), v.metadata({ nullable: false }))), /proven no-op object metadata/);
	assert.throws(() => proposed(v.pipe(jsonObject({ name: v.string() }), v.metadata({ required: [] }))), /proven no-op object metadata/);
	assert.throws(() => proposed(v.pipe(jsonObject({ name: v.string() }), v.metadata({ required: undefined }))), /proven no-op object metadata/);
});
proof('only proven redundant nullable:false, empty-required removal and annotations are allowed', () => {
	assert.throws(() => proposed(v.pipe(v.nullable(jsonObject({})), v.metadata({ nullable: true }))), /proven no-op object metadata/);
	assert.throws(() => proposed(v.pipe(jsonObject({ name: v.string() }), v.metadata({ required: ['name'] }))), /proven no-op object metadata/);
	assert.deepEqual(proposed(v.pipe(jsonObject({}), v.metadata({ required: [], nullable: false, description: 'annotation' })), { target: 'openapi-3.0' }), { type: 'object', properties: {}, required: [], nullable: false, description: 'annotation' });
});
proof('unrelated primitive metadata and unguarded object metadata retain prior behavior', () => {
	const unrelated = v.pipe(v.string(), v.metadata({ type: 'number' }));
	assert.deepEqual(proposed(unrelated), current(unrelated));
	assert.deepEqual(proposed(jsonObject({ name: unrelated })).properties!.name, current(v.looseObject({ name: unrelated })).properties!.name);
	const object = v.pipe(v.looseObject({}), v.metadata({ type: 'array' }));
	assert.deepEqual(proposed(object), current(object));
});

proof('declared-number Infinity behavior stays unchanged, including JSON exponent overflow', () => {
	const schema = jsonObject({ number: v.number() }); const validateNumber = new Ajv().compile(proposed(schema));
	const overflow = JSON.parse('{"number":1e999}');
	assert.equal(overflow.number, Number.POSITIVE_INFINITY); assert.equal(v.safeParse(schema, overflow).success, true); assert.equal(validateNumber(overflow), false);
});

proof('named, nested, reused and lazy recursive definitions project in one converter context', () => {
	for (const typeMode of ['ignore', 'input', 'output'] as const) {
		const shared = jsonObject({ name: v.string() }); const oldShared = v.looseObject({ name: v.string() });
		const root = jsonObject({ one: shared, two: v.nullable(shared) }); const oldRoot = v.looseObject({ one: oldShared, two: v.nullable(oldShared) });
		assert.deepEqual(proposed(root, { typeMode, definitions: { Named: shared } }), current(oldRoot, { typeMode, definitions: { Named: oldShared } }));
		const recursive: v.GenericSchema = v.lazy(() => jsonObject({ name: v.string(), next: v.exactOptional(recursive) }));
		const oldRecursive: v.GenericSchema = v.lazy(() => v.looseObject({ name: v.string(), next: v.exactOptional(oldRecursive) }));
		assert.deepEqual(proposed(recursive, { typeMode, definitions: { Named: recursive } }), current(oldRecursive, { typeMode, definitions: { Named: oldRecursive } }));
	}
});
proof('all typeMode values retain outer annotations and validation actions exactly', () => {
	for (const typeMode of ['ignore', 'input', 'output'] as const) {
		const a = v.pipe(jsonObject({}), v.metadata({ description: 'keep annotation' }), v.minEntries(1));
		const b = v.pipe(v.looseObject({}), v.metadata({ description: 'keep annotation' }), v.minEntries(1));
		assert.deepEqual(proposed(a, { typeMode }), current(b, { typeMode }));
	}
});
proof('native string and function messages preserve inner schema context and child message precedence', () => {
	for (const config of [{ message: 'custom message' }, { message: (issue:v.BaseIssue<unknown>) => 'custom ' + issue.type }]) {
		const a = v.safeParse(jsonObject({ name: v.string() }), { name: 1 }, config); const b = v.safeParse(v.looseObject({ name: v.string() }), { name: 1 }, config);
		assert.equal(a.issues![0].message, b.issues![0].message);
	}
	const explicit = v.string('child custom');
	assert.equal(v.safeParse(jsonObject({ name: explicit }), { name: 1 }, { message: 'outer custom' }).issues![0].message, v.safeParse(v.looseObject({ name: explicit }), { name: 1 }, { message: 'outer custom' }).issues![0].message);
	const configured = v.config(v.string(), { message: 'child configured' });
	assert.equal(v.safeParse(jsonObject({ name: configured }), { name: 1 }, { message: 'outer custom' }).issues![0].message, v.safeParse(v.looseObject({ name: configured }), { name: 1 }, { message: 'outer custom' }).issues![0].message);
});
proof('caller callbacks see original guard, parser, base, wrappers and named-reference identities', () => {
	const object = jsonObject({ name: v.string() }); const registration = getJsonObjectGuardRegistration(object.pipe[0])!; const wrapped = v.nullable(object); const seen = new Set<object>();
	const result = proposed(wrapped, { definitions: { Named: object }, overrideSchema: context => {seen.add(context.valibotSchema); if (context.valibotSchema === wrapped) return { ...context.jsonSchema, title: 'wrapper' }; return undefined;}, overrideAction: context => context.valibotAction === object.pipe[1] ? { ...context.jsonSchema, description: 'parser override' } : undefined, overrideRef: context => {assert.equal(context.valibotSchema, object); assert.equal(context.referenceMap.get(object), 'Named'); return undefined;} });
	assert.equal(result.title, 'wrapper'); assert.ok(seen.has(registration.guard)); assert.ok(seen.has(registration.base)); assert.ok(seen.has(wrapped)); const named = result.$defs!.Named;
	assert.ok(named !== null && typeof named === 'object');
	assert.equal(named.description, 'parser override');
});

proof('named underlying-base references and original reference iteration survive the projection view', () => {
	const helper = jsonObject({ name: v.string() }); const base = getJsonObjectGuardRegistration(helper.pipe[0])!.base;
	for (const typeMode of ['ignore', 'input', 'output'] as const) {
		assert.deepEqual(proposed(helper, { typeMode, definitions: { 'Base/~': base } }), current(base, { typeMode, definitions: { 'Base/~': base } }));
		assert.deepEqual(proposed(v.looseObject({ one: helper, two: helper }), { typeMode, definitions: { Base: base } }), current(v.looseObject({ one: base, two: base }), { typeMode, definitions: { Base: base } }));
	}
	proposed(helper, { definitions: { Base: base }, overrideRef: context => {
		assert.equal(context.valibotSchema, base); assert.ok([...context.referenceMap.keys()].includes(base));
		assert.ok([...context.referenceMap].some(([schema]) => schema === base));
		let seen = false; context.referenceMap.forEach((value, schema, map) => {if (schema === base)seen = true; assert.equal(map, context.referenceMap);}); assert.equal(seen, true); return undefined;
	} });
});
proof('lazy getter results receive the same helper-scoped metadata preflight', () => {
	assert.throws(() => proposed(v.lazy(() => v.pipe(jsonObject({}), v.metadata({ properties: {} })))), /proven no-op object metadata/);
});

proof('jsonNumber singleton exactly projects finite number semantics with defaults and ordinary pipelines', () => {
	assert.deepEqual(proposed(jsonNumber, { definitions: {} }), { type: 'number' });
	const plain = new Ajv().compile({ type: 'number' });
	for (let index = -256; index < 256; index++) {
		const value = index * 10 ** (index % 12);
		assert.equal(v.safeParse(jsonNumber, value).success, plain(value));
	}
	for (const value of [0, -0, 1, -1, 0.5, Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, Number.NaN, Infinity, -Infinity, JSON.parse('1e999'), JSON.parse('-1e999'), null, '1', true, [], {}]) {
		assert.equal(v.safeParse(jsonNumber, value).success, plain(value));
	}
	const schema = jsonObject({ number: v.optional(v.pipe(jsonNumber, v.integer(), v.minValue(1), v.maxValue(5)), 3) });
	const validate = new Ajv({ useDefaults: true }).compile(proposed(schema));
	for (const value of [{}, { number: 1 }, { number: 5 }, { number: 0 }, { number: 6 }, { number: 1.5 }, { number: Infinity }]) {
		const transport = structuredClone(value); const native = v.safeParse(schema, value); assert.equal(native.success, validate(transport)); if (native.success)assert.deepEqual(native.output, transport);
	}
	const opaque = { outside: Infinity }; assert.equal(v.parse(jsonObject({ number: jsonNumber }), { number: 1, opaque }).opaque, opaque);
});
