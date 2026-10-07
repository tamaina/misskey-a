/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { metadata } from 'valibot';
import { hasOpaqueObjectCheck, isOpaqueObject, opaqueObject } from '../contract/opaque-object.js';

const annotations = new Set(['title', 'description', 'example', 'examples', '$comment', 'deprecated', 'readOnly', 'writeOnly', 'externalDocs']);

/** Protect exact guard provenance and every containing pipeline, including shared graphs. */
export function assertOpaqueObjectProjection(schema: object, definitions?: Record<string, object>): void {
	const parents = new Map<object, Set<object>>();
	const nodes = new Set<object>();
	const affected = new Set<object>();

	function collect(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		if (parent !== undefined) {
			const set = parents.get(value) ?? new Set<object>();
			set.add(parent); parents.set(value, set);
		}
		if (nodes.has(value)) return;
		nodes.add(value);
		if (hasOpaqueObjectCheck(value)) {
			// Valibot pipe copies its first schema's public fields. Only an original
			// guard in that pipeline establishes provenance, never the copied check.
			if (!isOpaqueObject(value) && !('pipe' in value && Array.isArray(value.pipe) && value.pipe[0] === opaqueObject)) {
				throw new Error('Opaque object projection requires its exact original guard');
			}
			affected.add(value);
		}
		if (Array.isArray(value)) { for (const child of value) collect(child, value); return; }
		for (const [key, child] of Object.entries(value)) {
			if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) collect(child, value);
		}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			for (const child of Object.values(value.entries)) collect(child, value);
		}
	}

	collect(schema);
	for (const definition of Object.values(definitions ?? {})) collect(definition);
	const pending = [...affected];
	for (const node of pending) for (const parent of parents.get(node) ?? []) {
		if (!affected.has(parent)) { affected.add(parent); pending.push(parent); }
	}

	function checkPipe(pipe: unknown[], seen = new Set<object>()): void {
		for (const item of pipe) {
			if (item === null || typeof item !== 'object' || seen.has(item)) continue;
			seen.add(item);
			if ('pipe' in item && Array.isArray(item.pipe)) checkPipe(item.pipe, seen);
			if ('type' in item && item.type === 'metadata') {
				if (!('reference' in item) || item.reference !== metadata || !('kind' in item) || item.kind !== 'metadata'
					|| !('metadata' in item) || item.metadata === null || typeof item.metadata !== 'object'
					|| Object.keys(item.metadata).some(key => !annotations.has(key))) {
					throw new Error('Opaque object pipelines require annotation-only metadata');
				}
			}
		}
	}

	for (const node of affected) if ('pipe' in node && Array.isArray(node.pipe)) checkPipe(node.pipe);
}

/** Lazy output factories cannot hide an owned guard from the preflight graph. */
export function assertNoOpaqueObjectLazyReturn(value: unknown, seen = new Set<object>()): void {
	if (value === null || typeof value !== 'object' || seen.has(value)) return;
	seen.add(value);
	if (hasOpaqueObjectCheck(value)) throw new Error('Opaque object projections cannot be returned from lazy schemas');
	if (Array.isArray(value)) { for (const child of value) assertNoOpaqueObjectLazyReturn(child, seen); return; }
	for (const [key, child] of Object.entries(value)) {
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) assertNoOpaqueObjectLazyReturn(child, seen);
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
		for (const child of Object.values(value.entries)) assertNoOpaqueObjectLazyReturn(child, seen);
	}
}
