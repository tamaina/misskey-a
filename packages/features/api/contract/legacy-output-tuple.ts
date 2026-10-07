/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { jsonNumber } from './json-number.js';

type LegacyOutputTupleItem = v.StringSchema<undefined> | typeof jsonNumber;
interface LegacyOutputTupleScalar {
	readonly type: 'string' | 'number';
}
interface LegacyOutputTupleRegistration {
	readonly items: v.TupleItems;
	readonly prefixItems: readonly LegacyOutputTupleScalar[];
}
const legacyOutputTuples = new WeakMap<object, LegacyOutputTupleRegistration>();

function assertSupportedItems(items: readonly LegacyOutputTupleItem[]): void {
	const error = 'Legacy output tuples support only bare v.string() and the exact jsonNumber schema';
	if (!Array.isArray(items)) throw new Error(error);
	// for-of visits sparse array positions too, unlike Array.some.
	for (const item of items) {
		if (item === jsonNumber) continue;
		if (item === null || typeof item !== 'object' || item.type !== 'string'
			|| item.reference !== v.string || item.async || item.message !== undefined
			|| 'pipe' in item || 'fallback' in item) throw new Error(error);
	}
}

/**
 * Create an owned native strict tuple with the old output-only prefix documentation.
 * Supported items are bare v.string() schemas and the exact finite jsonNumber singleton.
 * Packed, wrapped, piped, object and lazy items need a separate projection design.
 */
export function legacyOutputTuple<const Items extends readonly LegacyOutputTupleItem[]>(items: Items) {
	assertSupportedItems(items);
	// Capture the item tuple ourselves; caller array changes cannot alter the owned native parser.
	const capturedItems: readonly [...Items] = [...items];
	for (const item of capturedItems) Object.freeze(item);
	Object.freeze(capturedItems);
	const schema = Object.freeze(v.strictTuple(capturedItems));
	const prefixItems = Object.freeze(capturedItems.map((item): LegacyOutputTupleScalar =>
		Object.freeze({ type: item === jsonNumber ? 'number' : 'string' })));
	legacyOutputTuples.set(schema, Object.freeze({ items: capturedItems, prefixItems }));
	return schema;
}

/** Identify only this helper's owned native tuple schema. */
export function getLegacyOutputTupleItems(schema: object): v.TupleItems | undefined {
	return legacyOutputTuples.get(schema)?.items;
}

/** Immutable scalar descriptors for the narrowly supported output projection. */
export function getLegacyOutputTupleLegacyItems(schema: object): readonly LegacyOutputTupleScalar[] | undefined {
	return legacyOutputTuples.get(schema)?.prefixItems;
}
