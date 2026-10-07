/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { getPackedReferenceLegacyOutputSchema } from './packed-reference.js';

export interface LegacyOutputOneOfOptions {
	readonly legacyRootType?: 'object';
}

export interface LegacyOutputOneOfRegistration {
	readonly options: v.UnionOptions;
	readonly legacyRootType?: 'object';
}

const registrations = new WeakMap<object, LegacyOutputOneOfRegistration>();
const ownedOptions = new WeakSet<object>();

function copyOptionTuple<const Options extends v.UnionOptions>(options: Options): readonly [...Options] {
	return [...options];
}

/** Static public schema graph only; never call lazy factories or inspect payload/default values. */
export function assertLegacyOutputOneOfOptionsStatic(options: unknown, seen = new Set<object>()): void {
	if (options === null || typeof options !== 'object' || seen.has(options)) return;
	seen.add(options);
	if (Array.isArray(options)) {
		for (const option of options) assertLegacyOutputOneOfOptionsStatic(option, seen);
		return;
	}
	if ('type' in options && options.type === 'lazy') {
		throw new Error('Legacy output oneOf alternatives cannot contain lazy schemas');
	}
	for (const [key, child] of Object.entries(options)) {
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) {
			assertLegacyOutputOneOfOptionsStatic(child, seen);
		}
	}
	if ('entries' in options && options.entries !== null && typeof options.entries === 'object') {
		for (const child of Object.values(options.entries)) assertLegacyOutputOneOfOptionsStatic(child, seen);
	}
}

/**
 * Own an ordinary native union with output-only legacy oneOf documentation.
 * The object-root setting is supported only for exact registered object packed references.
 * This never adds exclusive runtime validation or parses HTTP response payloads.
 */
export function legacyOutputOneOf<const Options extends v.UnionOptions>(options: Options, settings: LegacyOutputOneOfOptions = {}) {
	const error = 'Legacy output oneOf requires at least two synchronous schema alternatives';
	if (!Array.isArray(options) || options.length < 2) throw new Error(error);
	for (const option of options) {
		if (option === null || typeof option !== 'object' || option.kind !== 'schema' || option.async) throw new Error(error);
	}
	assertLegacyOutputOneOfOptionsStatic(options);
	const legacyRootType = settings.legacyRootType;
	if (legacyRootType !== undefined && legacyRootType !== 'object') {
		throw new Error('Legacy output oneOf supports only the object-root documentation setting');
	}
	if (legacyRootType === 'object' && options.some(option => getPackedReferenceLegacyOutputSchema(option)?.type !== 'object')) {
		throw new Error('Legacy output oneOf object roots require registered object packed references');
	}
	const capturedOptions = copyOptionTuple<Options>(options);
	for (const option of capturedOptions) Object.freeze(option);
	Object.freeze(capturedOptions);
	ownedOptions.add(capturedOptions);
	const schema = Object.freeze(v.union(capturedOptions));
	registrations.set(schema, Object.freeze({
		options: capturedOptions,
		...(legacyRootType === undefined ? {} : { legacyRootType }),
	}));
	return schema;
}

/** Return only this helper's exact owned union registration, never copies or metadata impostors. */
export function getLegacyOutputOneOfRegistration(schema: object): LegacyOutputOneOfRegistration | undefined {
	return registrations.get(schema);
}

/** Identify copies retaining an output-only owned tuple without claiming they are registered schemas. */
export function hasLegacyOutputOneOfOptions(schema: object): boolean {
	return 'type' in schema && schema.type === 'union' && 'options' in schema
		&& schema.options !== null && typeof schema.options === 'object' && ownedOptions.has(schema.options);
}
