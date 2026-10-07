/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	getJsonSelectorAndCommonGuardRegistration,
	getJsonSelectorAndCommonParserRegistration,
	getJsonSelectorAndCommonSchemaRegistration,
	getJsonSelectorUnionRegistration,
	getJsonSelectorUnionOptionsRegistration,
} from '../contract/json-selector-and-common.js';
import { assertSelectorCommonAnnotation, selectorCommonObjectEntries } from '../contract/json-selector-and-common-fields.js';
import { getJsonObjectSchemaRegistration } from '../contract/json-object.js';

/** Public schema edges only, never defaults, annotations, messages or caller payloads. */
function children(value: object): unknown[] {
	if (Array.isArray(value)) return value;
	const result: unknown[] = [];
	for (const key of ['pipe', 'wrapped', 'item', 'items', 'key', 'value', 'rest', 'options']) {
		if (key in value) result.push(Reflect.get(value, key));
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') result.push(...Object.values(value.entries));
	return result;
}

/** Protect the registered composition, its admitted children and all containing occurrences. */
export function assertJsonSelectorAndCommonMetadata(schema: object): void {
	const nodes = new Set<object>();
	const parents = new Map<object, Set<object>>();
	const descendants = new Map<object, object[]>();
	const protectedNodes = new Set<object>();
	const components = new Set<object>();

	function collect(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		// Preserve every edge before deduplication, including shared child/definition contexts.
		if (parent !== undefined) {
			const owners = parents.get(value) ?? new Set<object>();
			owners.add(parent); parents.set(value, owners);
		}
		if (nodes.has(value)) return;
		nodes.add(value);
		const registration = getJsonSelectorAndCommonSchemaRegistration(value)
			?? getJsonSelectorAndCommonGuardRegistration(value) ?? getJsonSelectorAndCommonParserRegistration(value);
		const edges = children(value).filter((child): child is object => child !== null && typeof child === 'object');
		if (registration !== undefined) {
			protectedNodes.add(value);
			components.add(registration.selector); components.add(registration.common);
			edges.push(registration.selector, registration.common);
			const union = getJsonSelectorUnionRegistration(registration.selector);
			if (union === undefined) throw new Error('Selector/common projection requires its original selector union');
			for (const option of [...union.options, registration.common]) {
				selectorCommonObjectEntries(option);
				const object = getJsonObjectSchemaRegistration(option);
				if (object === undefined) throw new Error('Selector/common projection requires original JSON-object components');
				edges.push(object.base);
				components.add(object.base);
			}
		}
		descendants.set(value, edges);
		for (const child of edges) collect(child, value);
	}

	collect(schema);

	function protect(node: object, seen = new Set<object>()): void {
		if (seen.has(node)) return;
		seen.add(node); protectedNodes.add(node);
		for (const child of descendants.get(node) ?? []) protect(child, seen);
	}

	for (const component of components) protect(component);
	const pending = [...protectedNodes];
	for (const node of pending) {
		for (const parent of parents.get(node) ?? []) {
			if (protectedNodes.has(parent)) continue;
			protectedNodes.add(parent); pending.push(parent);
		}
	}

	function checkAnnotations(pipe: unknown[], seen = new Set<object>()): void {
		for (const item of pipe) {
			if (item === null || typeof item !== 'object' || seen.has(item)) continue;
			seen.add(item); assertSelectorCommonAnnotation(item);
			if ('pipe' in item && Array.isArray(item.pipe)) checkAnnotations(item.pipe, seen);
		}
	}

	for (const node of protectedNodes) {
		assertSelectorCommonAnnotation(node);
		if (!('pipe' in node) || !Array.isArray(node.pipe)) continue;
		checkAnnotations(node.pipe);
		for (const [index, item] of node.pipe.entries()) {
			if (item === null || typeof item !== 'object') continue;
			const guard = getJsonSelectorAndCommonGuardRegistration(item);
			const parser = getJsonSelectorAndCommonParserRegistration(item);
			const original = getJsonSelectorAndCommonSchemaRegistration(node);
			if ((guard !== undefined && (original !== guard || node.pipe[index + 1] !== guard.parser))
				|| (parser !== undefined && (original !== parser || node.pipe[index - 1] !== parser.guard))) {
				throw new Error('Selector/common projection requires its original wrapper and exact guard/parser pair');
			}
		}
	}
	// A bare original guard or parser is not a registered schema occurrence.
	for (const node of nodes) {
		const registration = getJsonSelectorAndCommonGuardRegistration(node) ?? getJsonSelectorAndCommonParserRegistration(node);
		if (registration !== undefined && !parents.get(node)?.has(Reflect.get(registration.schema, 'pipe'))) {
			throw new Error('Selector/common guards and parsers require their original registered wrapper');
		}
	}
}

/** Owned selector/common helpers are eager-only, including direct converter lazy returns. */
export function assertNoSelectorCommonLazyReturn(schema: object): void {
	const seen = new Set<object>();

	function visit(value: unknown): void {
		if (value === null || typeof value !== 'object' || seen.has(value)) return;
		seen.add(value);
		if (getJsonSelectorUnionRegistration(value) !== undefined
			|| getJsonSelectorUnionOptionsRegistration(value) !== undefined
			|| getJsonSelectorAndCommonSchemaRegistration(value) !== undefined
			|| getJsonSelectorAndCommonGuardRegistration(value) !== undefined
			|| getJsonSelectorAndCommonParserRegistration(value) !== undefined) {
			throw new Error('Selector/common helpers cannot appear in lazy schema returns');
		}
		for (const child of children(value)) visit(child);
	}

	visit(schema);
}
