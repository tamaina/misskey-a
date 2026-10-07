/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { assertNoOpaqueObjectLazyReturn } from './opaque-object-projection.js';
import { intersect, union } from 'valibot';
import { assertJsonSelectorAndCommonMetadata, assertNoSelectorCommonLazyReturn } from './json-selector-and-common-projection.js';
import { getJsonSelectorAndCommonGuardRegistration, getJsonSelectorAndCommonParserRegistration } from '../contract/json-selector-and-common.js';
import { assertJsonExclusiveObjectMetadata, assertNoExclusiveObjectLazyReturn } from './json-exclusive-object-projection.js';
import { getJsonExclusiveObjectGuardRegistration, getJsonExclusiveObjectParserRegistration } from '../contract/json-exclusive-object.js';
import { assertJsonObjectMetadata } from './json-object-projection.js';
import { assertRequireWhenAllNullishPlacement } from './require-when-all-nullish-projection.js';
import { assertOwnedUnionLazyReturn } from './legacy-output-one-of-projection.js';
import { getJsonObjectGuardRegistration, getJsonObjectParserRegistration, getJsonObjectSchemaRegistration } from '../contract/json-object.js';

/** Converter-only public AST view. It is never a runtime parser and contains no private Valibot members. */
export function jsonObjectProjectionView(schema: object, definitions?: Record<string, object>) {
	const views = new Map<object, object>();
	const originals = new Map<object, object>();
	const namedBases = new Set(Object.values(definitions ?? {}));
	const namedBaseViews = new Map<object, object>();
	const schemaAliases = new Map<object, object[]>();

	function publicCopy(value: object): Record<string, unknown> {
		const copy: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			if (key.startsWith('~')) continue;
			Object.defineProperty(copy, key, { value: Reflect.get(value, key), enumerable: true, writable: true, configurable: true });
		}
		return copy;
	}

	function flatten(pipe: unknown[], seen = new Set<object>()): unknown[] {
		const result: unknown[] = [];
		for (const item of pipe) {
			if (item !== null && typeof item === 'object' && 'pipe' in item && Array.isArray(item.pipe)) {
				if (seen.has(item)) throw new Error('JSON-object projection cannot use cyclic pipelines');
				seen.add(item); result.push(...flatten(item.pipe, seen)); seen.delete(item);
			} else result.push(item);
		}
		return result;
	}

	function project(value: unknown): unknown {
		if (value === null || typeof value !== 'object') return value;
		const existing = views.get(value); if (existing !== undefined) return existing;
		if (Array.isArray(value)) {const result:unknown[] = []; views.set(value, result); originals.set(result, value); for (const item of value)result.push(project(item)); if (result.every((item, index) => item === value[index])) {views.set(value, value); return value;} return result;}
		if (!['pipe', 'wrapped', 'item', 'items', 'key', 'value', 'rest', 'options', 'entries', 'getter'].some(key => key in value)) {views.set(value, value); return value;}
		let changed = false;
		const copy = publicCopy(value); views.set(value, copy); originals.set(copy, value);
		if ('pipe' in value && Array.isArray(value.pipe)) {
			const flat = flatten(value.pipe); const mapped:unknown[] = []; let hasPair = false;
			for (let index = 0; index < flat.length; index++) {
				const item = flat[index]; const registration = item !== null && typeof item === 'object' ? getJsonObjectGuardRegistration(item) : undefined;
				const composition = item !== null && typeof item === 'object' ? getJsonSelectorAndCommonGuardRegistration(item) : undefined;
				const exclusive = item !== null && typeof item === 'object' ? getJsonExclusiveObjectGuardRegistration(item) : undefined;
				if (exclusive !== undefined) {
					hasPair = true;
					if (flat[index + 1] !== exclusive.parser) throw new Error('Exclusive-object projection requires its exact guard/parser pair');
					// The union is a converter-only layout; the native parser is genuinely exclusive.
					const layoutView = publicCopy(project(union(exclusive.options)) as object);
					originals.set(layoutView, exclusive.schema); schemaAliases.set(layoutView, [exclusive.guard, exclusive.schema]);
					views.set(exclusive.guard, layoutView); mapped.push(layoutView);
					const marker = { kind: 'metadata', type: 'raw_transform', reference: exclusive.parser.reference };
					originals.set(marker, exclusive.parser); mapped.push(marker); index++;
				} else if (composition !== undefined) {
					hasPair = true;
					if (flat[index + 1] !== composition.parser) throw new Error('Selector/common projection requires its exact guard and parser pair');
					// Converter-only layout: the native parser never executes this intersection.
					const layout = intersect([composition.selector, composition.common]);
					const layoutView = publicCopy(project(layout) as object);
					originals.set(layoutView, composition.schema); schemaAliases.set(layoutView, [composition.guard, composition.schema]);
					views.set(composition.guard, layoutView); mapped.push(layoutView);
					const marker = { kind: 'metadata', type: 'raw_transform', reference: composition.parser.reference };
					originals.set(marker, composition.parser); mapped.push(marker); index++;
				} else if (registration !== undefined) {
					hasPair = true;
					if (flat[index + 1] !== registration.parser) throw new Error('JSON-object projection requires its exact guard and parser pair');
					const base = project(registration.base);
					// Separate this conversion occurrence from an independently shared base schema.
					const baseView = publicCopy(base as object);
					if (namedBases.has(registration.base)) {baseView.type = 'custom'; namedBaseViews.set(baseView, registration.base);}
					originals.set(baseView, value); schemaAliases.set(baseView, [registration.guard, registration.base, ...(getJsonObjectSchemaRegistration(value) === registration ? [value] : [])]);
					views.set(registration.guard, baseView); mapped.push(baseView);
					const marker = { kind: 'metadata', type: 'raw_transform', reference: registration.parser.reference };
					originals.set(marker, registration.parser); mapped.push(marker); index++;
				} else {
					if (item !== null && typeof item === 'object' && (getJsonObjectParserRegistration(item) !== undefined || getJsonSelectorAndCommonParserRegistration(item) !== undefined || getJsonExclusiveObjectParserRegistration(item) !== undefined)) throw new Error('JSON-object projection requires its exact guard and parser pair');
					mapped.push(project(item));
				}
			}
			if (!hasPair && mapped.length === flat.length && mapped.every((item, index) => item === flat[index])) {views.set(value, value); return value;}
			if (mapped.length === 1 && mapped[0] !== null && typeof mapped[0] === 'object') {
				const result = mapped[0]; views.set(value, result); originals.set(result, value); return result;
			}
			const first = mapped[0]; if (first === null || typeof first !== 'object') throw new Error('Invalid JSON-object projection pipeline');
			for (const key of Object.keys(copy)) delete copy[key]; Object.assign(copy, publicCopy(first)); copy.pipe = mapped;
			return copy;
		}
		for (const key of ['wrapped', 'item', 'items', 'key', 'value', 'rest', 'options']) if (key in value) {const before = Reflect.get(value, key); copy[key] = project(before); changed ||= copy[key] !== before;}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			const originalEntries = value.entries; const entries:Record<string, unknown> = {}; for (const key of Object.keys(originalEntries))Object.defineProperty(entries, key, { value: project(Reflect.get(originalEntries, key)), enumerable: true, writable: true, configurable: true }); changed ||= Object.keys(originalEntries).some(key => entries[key] !== Reflect.get(originalEntries, key)); copy.entries = entries;
		}
		if ('type' in value && value.type === 'lazy' && 'getter' in value && typeof value.getter === 'function') {
			changed = true;
			const getter = value.getter;
			const projectedGetter = (input:unknown) => {const returned = Reflect.apply(getter, undefined, [input]); if (returned !== null && typeof returned === 'object') {assertNoOpaqueObjectLazyReturn(returned); assertNoSelectorCommonLazyReturn(returned); assertNoExclusiveObjectLazyReturn(returned); assertJsonExclusiveObjectMetadata(returned); assertRequireWhenAllNullishPlacement(returned); assertJsonObjectMetadata(returned); assertJsonSelectorAndCommonMetadata(returned); assertOwnedUnionLazyReturn(returned);} return project(returned);};
			views.set(getter, projectedGetter); originals.set(projectedGetter, getter); copy.getter = projectedGetter;
		}
		if (!changed) {views.set(value, value); return value;}
		return copy;
	}

	const projectedDefinitions = definitions === undefined ? undefined : Object.fromEntries(Object.entries(definitions).map(([name, value]) => [name, project(value)]));
	return { schema: project(schema), definitions: projectedDefinitions, views, originals, schemaAliases, namedBaseViews };
}
