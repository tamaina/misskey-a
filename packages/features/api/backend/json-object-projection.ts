/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { metadata } from 'valibot';
import { getJsonObjectGuardRegistration, getJsonObjectParserRegistration } from '../contract/json-object.js';

const annotations = new Set([
	'title', 'description', 'example', 'examples', '$comment', 'deprecated',
	'readOnly', 'writeOnly', 'externalDocs',
]);

function* flatten(pipe: unknown[], seen = new Set<object>()): Generator<unknown> {
	for (const item of pipe) {
		if (item !== null && typeof item === 'object' && 'pipe' in item && Array.isArray(item.pipe)) {
			if (seen.has(item)) throw new Error('JSON-object metadata cannot use cyclic pipelines');
			seen.add(item);
			yield* flatten(item.pipe, seen);
			seen.delete(item);
		} else yield item;
	}
}

interface Boundary {
	readonly type: string;
	readonly nullable: boolean;
	readonly required?: readonly string[];
}

/** Describe only public wrapper/object structure; never execute predicates or default factories. */
function boundary(value: object, seen = new Set<object>()): Boundary | undefined {
	if (seen.has(value)) return undefined;
	seen.add(value);
	const registration = getJsonObjectGuardRegistration(value);
	if (registration !== undefined) return boundary(registration.base, seen);
	if ('pipe' in value && Array.isArray(value.pipe)) {
		const schemas = [...flatten(value.pipe)].filter((item): item is object => item !== null && typeof item === 'object' && 'kind' in item && item.kind === 'schema');
		return schemas.length === 1 ? boundary(schemas[0], seen) : undefined;
	}
	if (!('type' in value)) return undefined;
	if ('wrapped' in value && value.wrapped !== null && typeof value.wrapped === 'object') {
		const wrapped = boundary(value.wrapped, seen);
		if (wrapped === undefined) return undefined;
		if (value.type === 'nullable' || value.type === 'nullish') return { ...wrapped, nullable: true };
		if (value.type === 'non_nullable' || value.type === 'non_nullish') return { ...wrapped, nullable: false };
		if (['optional', 'exact_optional', 'undefinedable', 'non_optional'].includes(String(value.type))) return wrapped;
	}
	if (['object', 'loose_object', 'strict_object', 'object_with_rest'].includes(String(value.type))) {
		if (!('entries' in value) || value.entries === null || typeof value.entries !== 'object') return undefined;
		const required = Object.entries(value.entries).filter(([, entry]) => entry !== null && typeof entry === 'object' && 'type' in entry
			&& !['optional', 'exact_optional', 'nullish'].includes(String(entry.type))).map(([key]) => key);
		return { type: 'object', nullable: false, required };
	}
	if (['array', 'boolean', 'string', 'number'].includes(String(value.type))) return { type: String(value.type), nullable: false };
	return undefined;
}

/** Protect only object-guard nodes and containing pipelines; leave sibling primitive metadata alone. */
export function assertJsonObjectMetadata(schema: object): void {
	const seen = new Set<object>();
	const parents = new Map<object, Set<object>>();
	const protectedNodes = new Set<object>();

	function collect(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		if (parent !== undefined) {
			const owners = parents.get(value) ?? new Set<object>();
			owners.add(parent);
			parents.set(value, owners);
		}
		if (seen.has(value)) return;
		seen.add(value);
		if (Array.isArray(value)) { for (const item of value) collect(item, value); return; }
		const registration = getJsonObjectGuardRegistration(value) ?? getJsonObjectParserRegistration(value);
		if (registration !== undefined) {
			protectedNodes.add(value);
			protectedNodes.add(registration.base);
			collect(registration.base, value);
		}
		for (const [key, child] of Object.entries(value)) {
			if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) collect(child, value);
		}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			for (const entry of Object.values(value.entries)) collect(entry, value);
		}
	}

	collect(schema);
	const pending = [...protectedNodes];
	for (const child of pending) {
		for (const parent of parents.get(child) ?? []) {
			if (protectedNodes.has(parent)) continue;
			protectedNodes.add(parent);
			pending.push(parent);
		}
	}
	for (const node of protectedNodes) {
		if (!('pipe' in node) || !Array.isArray(node.pipe)) continue;
		const shape = boundary(node);
		for (const action of flatten(node.pipe)) {
			if (action === null || typeof action !== 'object' || !('type' in action) || action.type !== 'metadata') continue;
			if (!('kind' in action) || action.kind !== 'metadata' || !('reference' in action) || action.reference !== metadata) {
				throw new Error('JSON-object pipelines cannot use disguised metadata predicates');
			}
			if (!('metadata' in action) || action.metadata === null || typeof action.metadata !== 'object') {
				throw new Error('JSON-object pipelines require valid metadata');
			}
			for (const [key, value] of Object.entries(action.metadata)) {
				if (annotations.has(key)) continue;
				if (key === 'nullable' && value === false && shape?.nullable === false) continue;
				if (key === 'required' && shape?.required !== undefined) {
					if (value === undefined && shape.required.length === 0) continue;
					if (Array.isArray(value) && value.length === 0 && shape.required.length === 0) continue;
				}
				throw new Error('JSON-object pipelines allow only annotations or proven no-op object metadata');
			}
		}
	}
}
