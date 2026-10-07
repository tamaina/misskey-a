/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedSchemas } from '../../index/contract/packed.js';
import type { Packed } from '../../index/contract/packed.js';

type PackedSchemaName = keyof typeof packedSchemas;

export type PackedReference<Name extends PackedSchemaName> = v.CustomSchema<Packed<Name>, string>;

const packedReferences = new WeakMap<object, PackedSchemaName>();

/** Validate with the canonical packed schema while retaining its output type. */
export function packedReference<const Name extends PackedSchemaName>(name: Name): PackedReference<Name> {
	if (!Object.hasOwn(packedSchemas, name)) {
		throw new Error(`Unknown packed schema: ${String(name)}`);
	}

	const schema = packedSchemas[name];
	const reference: PackedReference<Name> = v.custom<Packed<Name>, string>(
		value => v.is(schema, value),
		`Expected a packed ${String(name)}`,
	);
	packedReferences.set(reference, name);
	return reference;
}

/** Return a registered packed schema name for this exact reference instance. */
export function getPackedReference(schema: object): PackedSchemaName | undefined {
	return packedReferences.get(schema);
}
