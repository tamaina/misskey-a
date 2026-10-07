/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { metadata } from 'valibot';
import { getUniqueStringArrayBaseSchema } from '../contract/unique-string-array.js';

import { isJsonObjectNoopMetadata } from './json-object-projection.js';

const annotationKeys = new Set([
	'title', 'description', 'example', 'examples', '$comment', 'deprecated',
	'readOnly', 'writeOnly', 'externalDocs',
]);

/** Follow only public schema structure, never caller data, defaults or annotations. */
function schemaChildren(value: object): unknown[] {
	if (Array.isArray(value)) return value;
	const children: unknown[] = [];
	for (const [key, child] of Object.entries(value)) {
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) {
			children.push(child);
		}
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
		children.push(...Object.values(value.entries));
	}
	return children;
}

/** Keep supported Valibot metadata from replacing unique-array validation; not an arbitrary-code sandbox. */
export function assertUniqueStringArrayMetadata(schema: object): void {
	const nodes = new Set<object>();
	const children = new Map<object, object[]>();
	const parents = new Map<object, Set<object>>();
	const bases = new Set<object>();
	const affected = new Set<object>();

	function collect(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		// Record every edge before deduplicating nodes: shared schemas retain all contexts.
		if (parent !== undefined) {
			const ancestors = parents.get(value) ?? new Set<object>();
			ancestors.add(parent);
			parents.set(value, ancestors);
		}
		if (nodes.has(value)) return;
		nodes.add(value);
		const base = getUniqueStringArrayBaseSchema(value);
		if (base !== undefined) {
			bases.add(base);
			affected.add(value);
		}
		const descendants = schemaChildren(value).filter((child): child is object => child !== null && typeof child === 'object');
		children.set(value, descendants);
		for (const child of descendants) collect(child, value);
	}

	collect(schema);
	// Include every containing pipeline, including wrappers and object ancestors.
	const pending = [...affected];
	for (const node of pending) {
		for (const parent of parents.get(node) ?? []) {
			if (affected.has(parent)) continue;
			affected.add(parent);
			pending.push(parent);
		}
	}

	// Item validators also need protection, even when first visited through a sibling.
	function protectItems(node: object, seen = new Set<object>()): void {
		if (seen.has(node)) return;
		seen.add(node);
		affected.add(node);
		for (const child of children.get(node) ?? []) protectItems(child, seen);
	}

	for (const base of bases) protectItems(base);

	function checkPipe(pipe: unknown[], owner: object, seen = new Set<object>()): void {
		for (const item of pipe) {
			if (item === null || typeof item !== 'object' || seen.has(item)) continue;
			seen.add(item);
			if ('pipe' in item && Array.isArray(item.pipe)) checkPipe(item.pipe, item, seen);
			if ('type' in item && item.type === 'metadata') {
				if (!('kind' in item) || item.kind !== 'metadata' || !('reference' in item) || item.reference !== metadata) {
					throw new Error('Unique string array pipelines cannot use disguised metadata predicates');
				}
				if (isJsonObjectNoopMetadata(owner, item)) continue;
				if (!('metadata' in item) || item.metadata === null || typeof item.metadata !== 'object'
					|| Object.keys(item.metadata).some(key => !annotationKeys.has(key))) {
					throw new Error('Unique string array pipelines require annotation-only metadata');
				}
			}
		}
	}

	for (const node of affected) {
		if ('pipe' in node && Array.isArray(node.pipe)) checkPipe(node.pipe, node);
	}
}
