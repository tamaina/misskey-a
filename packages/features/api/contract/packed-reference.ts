/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedSchemas } from '../../index/contract/packed.js';
import type { Packed } from '../../index/contract/packed.js';

type PackedSchemaName = keyof typeof packedSchemas;

export type PackedReference<Name extends PackedSchemaName> = v.CustomSchema<Packed<Name>, string>;

/** Changes only the explicit legacy output projection, never canonical validation or inference. */
export interface PackedReferenceOptions {
	readonly legacyOutputType?: 'object' | 'omit';
}

export interface PackedReferenceLegacyOutputSchema {
	readonly type?: 'object';
	readonly ref: PackedSchemaName;
}

const packedReferences = new WeakMap<object, PackedReferenceLegacyOutputSchema>();

/** Validate with the canonical packed schema while retaining its output type. */
export function packedReference<const Name extends PackedSchemaName>(name: Name, options: PackedReferenceOptions = {}): PackedReference<Name> {
	if (!Object.hasOwn(packedSchemas, name)) {
		throw new Error(`Unknown packed schema: ${String(name)}`);
	}

	const legacyOutputType = options.legacyOutputType ?? 'object';
	if (legacyOutputType !== 'object' && legacyOutputType !== 'omit') {
		throw new Error(`Unsupported packed reference legacy output type: ${String(legacyOutputType)}`);
	}

	const schema = packedSchemas[name];
	const reference: PackedReference<Name> = v.custom<Packed<Name>, string>(
		value => v.is(schema, value),
		`Expected a packed ${String(name)}`,
	);
	packedReferences.set(reference, Object.freeze(legacyOutputType === 'omit'
		? { ref: name }
		: { type: 'object', ref: name }));
	return reference;
}

/** Return a registered packed schema name for this exact reference instance. */
export function getPackedReference(schema: object): PackedSchemaName | undefined {
	return packedReferences.get(schema)?.ref;
}

/** Return the registered output-only legacy reference projection, if present. */
export function getPackedReferenceLegacyOutputSchema(schema: object): PackedReferenceLegacyOutputSchema | undefined {
	return packedReferences.get(schema);
}
