/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectLegacyReferences, assertShrinkingInventory } from '../lib/contract-object-inventory.mjs';

const collect = source => collectLegacyReferences([['packages/features/example/contract/index.ts', source]]);
const original = "import * as v from 'valibot'; export const input = v.looseObject({ id: v.string() });";

test('rejects new calls and newly disguised named imports', () => {
	const baseline = collect(original);
	for (const extra of [
		' const another = v.looseObject({});',
		" import { looseObject as renamed } from 'valibot'; const another = renamed({});",
		" import { resultObject as renamed } from './result-object.js'; const another = renamed({});",
		' const renamed = v.looseObject; const another = renamed({});',
		" const another = v['looseObject']({});",
		' const { looseObject: renamed } = v; const another = renamed({});',
		" export { resultObject as renamed } from './result-object.js';",
	]) assert.throws(() => assertShrinkingInventory(collect(original + extra), baseline, false), /New legacy object usage/);
});

test('permits retirement but requires a matching reduced checked-in inventory', () => {
	const baseline = collect(original);
	const reduced = collect(original.replace('looseObject', 'object'));
	assert.doesNotThrow(() => assertShrinkingInventory(reduced, baseline, false));
	assert.throws(() => assertShrinkingInventory(reduced, baseline), /stale/);
	assert.doesNotThrow(() => assertShrinkingInventory(reduced, reduced));
});

test('ignores comments and string literals, catches result helper aliases and type references', () => {
	assert.deepEqual(collect("// v.looseObject({})\nconst text = 'resultObject({})';"), {});
	const baseline = collect("import { resultObject as response } from './result-object.js'; const output = response({ id: v.string() });");
	assert.equal(Object.values(baseline).reduce((sum, n) => sum + n, 0), 1);
	assert.throws(() => assertShrinkingInventory(collect("import { resultObject as response } from './result-object.js'; type Output = ReturnType<typeof response>;"), baseline, false), /New legacy object usage/);
});

test('tracks shorthand destructuring, literal templates and calls through existing lexical aliases', () => {
	for (const declaration of [
		'const { looseObject: make } = v;',
		'const { looseObject } = v; const make = looseObject;',
		'const make = v[`looseObject`];',
		'const make = (v.looseObject as typeof v.looseObject);',
		'const make = v.looseObject; const next = (make);',
	]) {
		const source = "import * as v from 'valibot'; " + declaration;
		const baseline = collect(source);
		assert.ok(Object.keys(baseline).length > 0);
		assert.throws(() => assertShrinkingInventory(collect(source + 'const input = make({});'), baseline, false), /New legacy object usage/);
	}
	assert.throws(() => assertShrinkingInventory(collect('const { looseObject } = v; const input = looseObject({});'), {}, false), /New legacy object usage/);
});

test('alias provenance respects lexical shadowing and inventory ordering is irrelevant', () => {
	const source = 'const make = v.looseObject; function local(make) { return make({}); }';
	const baseline = collect(source);
	assert.equal(Object.values(baseline).reduce((sum, n) => sum + n, 0), 1);
	assert.doesNotThrow(() => assertShrinkingInventory(baseline, Object.fromEntries(Object.entries(baseline).reverse())));
});


test('reassigned aliases accumulate finite provenance and reject newly added calls', () => {
	const source = "import { resultObject } from './result-object.js'; let make = v.looseObject; make = resultObject;";
	const baseline = collect(source);
	assert.throws(() => assertShrinkingInventory(collect(source + 'const input = make({});'), baseline, false), /New legacy object usage/);
});


test('tracks destructuring assignment and aliases stored on ordinary local objects', () => {
	for (const source of [
		'let make; ({ looseObject: make } = v);',
		'let looseObject; ({ looseObject } = v); const make = looseObject;',
		'const factories = { make: v.looseObject }; const { make } = factories;',
		'const factories = { make: v.looseObject }; const make = factories.make;',
	]) {
		const baseline = collect(source);
		assert.ok(Object.keys(baseline).length > 0);
		assert.throws(() => assertShrinkingInventory(collect(source + 'const input = make({});'), baseline, false), /New legacy object usage/);
	}
});
