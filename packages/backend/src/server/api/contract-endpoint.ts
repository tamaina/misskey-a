/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { JsonSchema } from '@valibot/to-json-schema';
import type * as v from 'valibot';
import type { EndpointContractDefinition } from '../../../../features/api/contract/definition.js';
import { toLegacyJsonSchema } from '../../../../features/api/backend/index.js';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from './endpoint-base.js';
import type { EndpointExecutor } from './endpoint-base.js';
import type { IEndpointMeta } from './endpoints.js';

/** Reject runtime-only input behavior that an AJV projection cannot execute. */
function assertStaticInputProjection(value: unknown, seen = new Set<object>()): void {
	if (value === null || typeof value !== 'object' || seen.has(value)) return;
	seen.add(value);
	if (Array.isArray(value)) {
		for (const item of value) assertStaticInputProjection(item, seen);
		return;
	}
	if ('kind' in value && value.kind === 'transformation') {
		throw new Error('Legacy input contracts cannot perform transformations');
	}
	if ('kind' in value && value.kind === 'schema') {
		if ('fallback' in value) throw new Error('Legacy input contracts cannot use fallback values');
		if ('default' in value && typeof value.default === 'function') {
			throw new Error('Legacy input contracts require static defaults');
		}
		if ('type' in value && value.type === 'lazy') {
			throw new Error('Lazy input schemas require an explicit legacy projection');
		}
	}
	const fields: [string, unknown][] = Object.entries(value);
	for (const [key, child] of fields) {
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) {
			assertStaticInputProjection(child, seen);
		}
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
		for (const entry of Object.values(value.entries)) assertStaticInputProjection(entry, seen);
	}
}

/** Project required lists into the old response-documentation dialect. */
function markResponseProperties(schema: JsonSchema | boolean): JsonSchema {
	if (typeof schema === 'boolean') throw new Error('Boolean response schemas require an explicit legacy projection');
	if ('$ref' in schema || '$defs' in schema || 'definitions' in schema || 'prefixItems' in schema) {
		throw new Error('Referenced or tuple response schemas require an explicit legacy projection');
	}
	// The old writer leaves map-value schemas intact, but references inside them must still be checked.
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
		markResponseProperties(schema.additionalProperties);
	}
	const result = { ...schema };
	if (result.required?.length === 0) delete result.required;
	if (schema.properties) {
		const required = new Set(schema.required ?? []);
		result.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [
			key, { ...markResponseProperties(value), optional: !required.has(key) },
		]));
	}
	if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
		result.items = markResponseProperties(schema.items);
	}
	for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
		if (schema[key]) result[key] = schema[key].map(markResponseProperties);
	}
	if (result.properties && Object.keys(result.properties).length === 0) delete result.properties;
	return result;
}

/**
 * Only the JSON-schema-projectable Valibot subset belongs on this legacy bridge.
 * AJV remains responsible for input defaults, error details and extra-key behavior.
 * Responses are typed/documented here, but never parsed or rewritten at runtime.
 */
export function projectEndpointContract<Input extends v.GenericSchema, Output extends v.GenericSchema>(
	definition: EndpointContractDefinition<Input, Output>,
) {
	if (definition.input.type === 'optional' || definition.input.type === 'exact_optional') {
		throw new Error('Legacy input contracts require an explicit object body');
	}
	assertStaticInputProjection(definition.input);
	// These casts bridge schema AST dialects, never request or response payloads.
	const input = toLegacyJsonSchema(definition.input, {
		target: 'openapi-3.0',
		typeMode: 'ignore',
	}) as Schema;
	const responseSchema = definition.output.type === 'void' ? undefined : markResponseProperties(
		toLegacyJsonSchema(definition.output, { target: 'openapi-3.0', typeMode: 'output' }),
	) as Schema;
	// A root optional response also documents the existing no-content branch.
	const response = responseSchema && (definition.output.type === 'optional' || definition.output.type === 'exact_optional')
		? { ...responseSchema, optional: true }
		: responseSchema;
	return { definition, input, response } as const;
}

export class ContractEndpoint<Meta extends IEndpointMeta, Input extends v.GenericSchema, Output extends v.GenericSchema>
	extends Endpoint<Meta, Schema, InferSchemaOutput<Input>, InferSchemaOutput<Output>> {
	constructor(
		meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<Input, Output>>,
		handler: EndpointExecutor<Meta, InferSchemaOutput<Input>, InferSchemaOutput<Output>>,
	) {
		super(meta, projection.input, handler);
	}
}
