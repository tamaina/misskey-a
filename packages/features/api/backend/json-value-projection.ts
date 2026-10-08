/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { metadata } from 'valibot';
import type { GenericSchema } from 'valibot';
import { getGlobalDefs, toJsonSchemaDefs } from '@valibot/to-json-schema';
import { getJsonValueReference, jsonValueSchema } from '../contract/json-value.js';
import { jsonObjectProjectionView } from './json-object-projection-view.js';

const annotations = new Set(['title', 'description', 'example', 'examples', '$comment', 'deprecated', 'readOnly', 'writeOnly', 'externalDocs']);

/** Schema-changing metadata must not override the meaning of a canonical JSON leaf. */
export function assertJsonValueMetadata(schema: object, definitions = getGlobalDefs()): void {
	const parents = new Map<object, Set<object>>();
	const seen = new Set<object>();
	const affected = new Set<object>();
	const lazyReturns = new Map<object, unknown>();

	function visit(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		if (parent !== undefined) {
			const set = parents.get(value) ?? new Set<object>();
			set.add(parent); parents.set(value, set);
		}
		if (seen.has(value)) return;
		seen.add(value);
		if ('type' in value && value.type === 'metadata' && 'metadata' in value
			&& value.metadata !== null && typeof value.metadata === 'object'
			&& 'ref' in value.metadata && value.metadata.ref === 'JsonValue') {
			throw new Error('JSON value references require their canonical schema identity');
		}
		if (getJsonValueReference(value) !== undefined) affected.add(value);
		if (Array.isArray(value)) { for (const item of value) visit(item, value); return; }
		for (const [key, item] of Object.entries(value)) {
			if (['pipe', 'wrapped', 'item', 'items', 'rest', 'key', 'value', 'options'].includes(key)) visit(item, value);
		}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			for (const item of Object.values(value.entries)) visit(item, value);
		}
		if ('type' in value && value.type === 'lazy' && 'getter' in value && typeof value.getter === 'function') {
			if (!lazyReturns.has(value.getter)) lazyReturns.set(value.getter, Reflect.apply(value.getter, undefined, [undefined]));
			visit(lazyReturns.get(value.getter), value);
		}
	}

	visit(schema);
	for (const definition of Object.values(definitions ?? {})) visit(definition);
	for (const node of affected) for (const parent of parents.get(node) ?? []) affected.add(parent);
	for (const node of affected) {
		if (!('pipe' in node) || !Array.isArray(node.pipe)) continue;
		for (const item of node.pipe) {
			if (item === null || typeof item !== 'object' || !('type' in item) || item.type !== 'metadata') continue;
			if (!('reference' in item) || item.reference !== metadata || !('metadata' in item)
				|| item.metadata === null || typeof item.metadata !== 'object'
				|| Object.keys(item.metadata).some(key => !annotations.has(key))) {
				throw new Error('JSON value references require annotation-only metadata');
			}
		}
	}
}

/** The component body comes from public recursive schemas, with one deterministic name. */
export function getJsonValueComponents() {
	const projection = jsonObjectProjectionView(jsonValueSchema, { JsonValue: jsonValueSchema });
	// This cast bridges the converter-only public AST, never payload values.
	const components = toJsonSchemaDefs(projection.definitions as Record<string, GenericSchema>, {
		target: 'draft-2020-12', typeMode: 'output',
		overrideRef: context => `#/components/schemas/${context.referenceId}`,
	});
	if (Object.keys(components).length !== 1 || !Object.hasOwn(components, 'JsonValue')) {
		throw new Error('JSON value projection requires its single canonical component');
	}
	return { JsonValue: components.JsonValue };
}
