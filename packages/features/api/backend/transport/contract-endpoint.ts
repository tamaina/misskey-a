/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getJsonExclusiveObjectGuardRegistration, getJsonExclusiveObjectParserRegistration } from '@features/api/contract/json-exclusive-object.js';
import { assertJsonExclusiveObjectMetadata } from '@features/api/backend/json-exclusive-object-projection.js';
import type { InferSchemaOutput } from '@orpc/contract';
import type { JsonSchema } from '@valibot/to-json-schema';
import type * as v from 'valibot';
import type { EndpointContractDefinition } from '@features/api/contract/definition.js';
import { getMultipartEndpointContractRegistration } from '@features/api/contract/multipart-endpoint.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { Schema } from '../utility/json-schema.js';
import { assertLegacyOutputTupleMetadata } from '@features/api/backend/legacy-output-tuple-projection.js';
import { getPackedReference, getPackedReferenceLegacyOutputSchema } from '@features/api/contract/packed-reference.js';
import { getJsonObjectGuardRegistration, getJsonObjectParserRegistration } from '@features/api/contract/json-object.js';
import { getJsonSelectorAndCommonGuardRegistration, getJsonSelectorAndCommonParserRegistration } from '@features/api/contract/json-selector-and-common.js';
import { assertJsonSelectorAndCommonMetadata } from '@features/api/backend/json-selector-and-common-projection.js';
import { getLegacyOutputTupleItems, getLegacyOutputTupleLegacyItems } from '@features/api/contract/legacy-output-tuple.js';
import { getUniqueStringArrayBaseSchema } from '@features/api/contract/unique-string-array.js';
import { getRequireWhenAllNullishRegistration } from '@features/api/contract/require-when-all-nullish.js';
import { getLegacyOutputOneOfRegistration, hasLegacyOutputOneOfOptions } from '@features/api/contract/legacy-output-one-of.js';
import { assertLegacyOutputOneOfMetadata } from '@features/api/backend/legacy-output-one-of-projection.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';
import { Endpoint } from './endpoint-base.js';
import type { EndpointExecutor } from './endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';

/** Flatten public Valibot pipelines in the same order as the JSON Schema converter. */
function* flattenInputPipe(pipe: unknown[], parents = new Set<object>()): Generator<unknown> {
	for (const item of pipe) {
		if (item !== null && typeof item === 'object' && 'pipe' in item && Array.isArray(item.pipe)) {
			if (parents.has(item)) throw new Error('Legacy input contracts cannot use cyclic pipelines');
			parents.add(item);
			yield* flattenInputPipe(item.pipe, parents);
			parents.delete(item);
		} else {
			yield item;
		}
	}
}

/** Reject runtime-only input behavior that an AJV projection cannot execute. */
function assertStaticInputProjection(value: unknown, seen = new Set<object>(), pipelineSchema?: object): void {
	if (value === null || typeof value !== 'object') return;
	const exclusiveParser = getJsonExclusiveObjectParserRegistration(value);
	const exclusiveGuard = getJsonExclusiveObjectGuardRegistration(value);
	const exclusive = exclusiveGuard ?? exclusiveParser;
	if (exclusive !== undefined) {
		if (pipelineSchema !== exclusive.guard) throw new Error('Exclusive-object parsing requires its original guard/parser pipeline');
		for (const option of exclusive.options) assertStaticInputProjection(option, seen);
	}
	const compositionParser = getJsonSelectorAndCommonParserRegistration(value);
	const compositionGuard = getJsonSelectorAndCommonGuardRegistration(value);
	if (compositionParser !== undefined && pipelineSchema !== compositionParser.guard) {
		throw new Error('Selector/common parsing must follow its original guard');
	}
	if (compositionGuard !== undefined && pipelineSchema !== compositionGuard.guard) {
		throw new Error('Selector/common guards require their registered parser pipeline');
	}
	const composition = compositionGuard ?? compositionParser;
	if (composition !== undefined) {
		assertStaticInputProjection(composition.selector, seen);
		assertStaticInputProjection(composition.common, seen);
	}
	const objectParser = getJsonObjectParserRegistration(value);
	if (objectParser !== undefined && pipelineSchema !== objectParser.guard) {
		throw new Error('JSON-object parsing must follow its original object guard');
	}
	const objectGuard = getJsonObjectGuardRegistration(value);
	if (objectGuard !== undefined && pipelineSchema !== objectGuard.guard) {
		throw new Error('JSON-object guards require their registered parser pipeline');
	}
	if (objectGuard !== undefined) assertStaticInputProjection(objectGuard.base, seen);
	if (objectParser !== undefined) assertStaticInputProjection(objectParser.base, seen);
	const conditional = getRequireWhenAllNullishRegistration(value);
	if (conditional !== undefined && pipelineSchema !== conditional.guard) {
		throw new Error('Nullish conditional validation must follow its original JSON-object base');
	}
	const uniqueArrayBase = getUniqueStringArrayBaseSchema(value);
	if (uniqueArrayBase !== undefined && pipelineSchema !== uniqueArrayBase) {
		throw new Error('Unique string array validation must follow its original array schema');
	}
	if ('kind' in value && value.kind === 'validation' && 'type' in value
		&& (value.type === 'check' || value.type === 'check_items') && uniqueArrayBase === undefined && conditional === undefined) {
		throw new Error('Legacy input contracts cannot use unregistered validation predicates');
	}
	if (seen.has(value)) return;
	seen.add(value);
	if (getLegacyOutputTupleItems(value) !== undefined) {
		throw new Error('Legacy input contracts cannot use output-only tuple projections');
	}
	if (getLegacyOutputOneOfRegistration(value) !== undefined || hasLegacyOutputOneOfOptions(value)) {
		throw new Error('Legacy input contracts cannot use output-only oneOf projections');
	}
	if (getPackedReference(value) !== undefined) {
		throw new Error('Legacy input contracts cannot use packed references');
	}
	if (Array.isArray(value)) {
		for (const item of value) assertStaticInputProjection(item, seen);
		return;
	}
	if ('kind' in value && value.kind === 'transformation' && objectParser === undefined && compositionParser === undefined && exclusiveParser === undefined) {
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
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'options'].includes(key)) {
			assertStaticInputProjection(child, seen);
		}
	}
	if ('pipe' in value && Array.isArray(value.pipe)) {
		const flattened = [...flattenInputPipe(value.pipe)];
		for (const [index, item] of flattened.entries()) {
			if (item === null || typeof item !== 'object') continue;
			const guard = getJsonObjectGuardRegistration(item) ?? getJsonSelectorAndCommonGuardRegistration(item) ?? getJsonExclusiveObjectGuardRegistration(item);
			const parser = getJsonObjectParserRegistration(item) ?? getJsonSelectorAndCommonParserRegistration(item) ?? getJsonExclusiveObjectParserRegistration(item);
			if ((guard !== undefined && flattened[index + 1] !== guard.parser)
				|| (parser !== undefined && flattened[index - 1] !== parser.guard)) {
				throw new Error('JSON-object parsing requires its exact guard and parser pair');
			}
		}
		let currentSchema: object | undefined;
		for (const item of flattened) {
			if (item !== null && typeof item === 'object' && 'kind' in item && item.kind === 'schema') {
				currentSchema = item;
			}
			assertStaticInputProjection(item, seen, currentSchema);
		}
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
		for (const entry of Object.values(value.entries)) assertStaticInputProjection(entry, seen);
	}
	// Traverse first so registered output tuples retain their more specific error under pipelines.
	if ('kind' in value && value.kind === 'schema' && 'type' in value
		&& ['tuple', 'strict_tuple', 'loose_tuple', 'tuple_with_rest'].includes(String(value.type))) {
		throw new Error('Legacy input contracts cannot project tuple schemas');
	}
}

/** Project required lists into the old response-documentation dialect. */
function markResponseProperties(schema: JsonSchema | boolean, tuplePrefixes: WeakSet<object>): JsonSchema {
	if (typeof schema === 'boolean') throw new Error('Boolean response schemas require an explicit legacy projection');
	if ('$ref' in schema || '$defs' in schema || 'definitions' in schema
		|| ('prefixItems' in schema && (!Array.isArray(schema.prefixItems) || !tuplePrefixes.has(schema.prefixItems)
			|| schema.type !== 'array' || !('unevaluatedItems' in schema) || schema.unevaluatedItems !== false || 'items' in schema))) {
		throw new Error('Referenced or tuple response schemas require an explicit legacy projection');
	}
	const result = { ...schema };
	if (schema.prefixItems) result.prefixItems = schema.prefixItems.map(item => markResponseProperties(item, tuplePrefixes));
	// The old writer doesn't descend into maps, so convert typed map values here after recursive marking.
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
		result.additionalProperties = convertSchemaToOpenApiSchema(
			markResponseProperties(schema.additionalProperties, tuplePrefixes) as Schema, 'res', true,
		);
	}
	if (result.required?.length === 0) delete result.required;
	if (schema.properties) {
		const required = new Set(schema.required ?? []);
		result.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [
			key, { ...markResponseProperties(value, tuplePrefixes), optional: !required.has(key) },
		]));
	}
	if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
		result.items = markResponseProperties(schema.items, tuplePrefixes);
	}
	for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
		if (schema[key]) result[key] = schema[key].map(item => markResponseProperties(item, tuplePrefixes));
	}
	if (result.properties && Object.keys(result.properties).length === 0) delete result.properties;
	return result;
}

/**
 * Only the JSON-schema-projectable Valibot subset belongs on this legacy bridge.
 * AJV remains responsible for input defaults, error details and extra-key behavior.
 * Responses are typed/documented here, but never parsed or rewritten at runtime.
 */
export function projectEndpointContract<
	Input extends v.GenericSchema,
	Output extends v.GenericSchema,
	WireInput extends v.GenericSchema = Input,
>(
	definition: EndpointContractDefinition<Input, Output, WireInput>,
) {
	const multipart = getMultipartEndpointContractRegistration(definition);
	if (definition.transport === 'multipart/form-data') {
		if (multipart === undefined) throw new Error('Multipart contracts require their exact factory-owned definition');
		if (definition.input !== multipart.input || definition.output !== multipart.output
			|| definition.wireInput !== multipart.wireInput || definition.contract !== multipart.contract
			|| definition.contract['~orpc'].inputSchema !== multipart.wireInput
			|| definition.contract['~orpc'].outputSchema !== multipart.output) {
			throw new Error('Multipart contract schema identities cannot be changed');
		}
	} else {
		if (definition.transport !== undefined || definition.wireInput !== undefined || multipart !== undefined) {
			throw new Error('Unsupported endpoint contract transport');
		}
		if (!Object.is(definition.contract['~orpc'].inputSchema, definition.input)
			|| !Object.is(definition.contract['~orpc'].outputSchema, definition.output)) {
			throw new Error('JSON contract schemas must match their definition');
		}
	}
	if (definition.input.type === 'optional' || definition.input.type === 'exact_optional') {
		throw new Error('Legacy input contracts require an explicit object body');
	}
	assertJsonSelectorAndCommonMetadata(definition.input);
	assertJsonExclusiveObjectMetadata(definition.input);
	assertStaticInputProjection(definition.input);
	assertLegacyOutputTupleMetadata(definition.output);
	assertLegacyOutputOneOfMetadata(definition.output);
	// These casts bridge schema AST dialects, never request or response payloads.
	const input = toLegacyJsonSchema(definition.input, {
		target: 'openapi-3.0',
		typeMode: 'ignore',
	}) as Schema;
	const tuplePrefixes = new WeakSet<object>();
	const legacyOutputOverride = ({ valibotSchema, jsonSchema }: { valibotSchema: object; jsonSchema: JsonSchema }): JsonSchema | undefined => {
		const union = getLegacyOutputOneOfRegistration(valibotSchema);
		if (union !== undefined) {
			if (!Array.isArray(jsonSchema.anyOf) || jsonSchema.anyOf.length !== union.options.length
				|| '$ref' in jsonSchema || '$defs' in jsonSchema || 'definitions' in jsonSchema) {
				throw new Error('Referenced output oneOf schemas require an explicit legacy projection');
			}
			const { anyOf, ...rest } = jsonSchema;
			return { ...rest, ...(union.legacyRootType === undefined ? {} : { type: union.legacyRootType }), oneOf: anyOf };
		}
		const tupleItems = getLegacyOutputTupleLegacyItems(valibotSchema);
		if (tupleItems !== undefined) {
			const prefixItems = tupleItems.map(item => ({ ...item }));
			tuplePrefixes.add(prefixItems);
			// The legacy writer retains this 2020-12 keyword even though the converter AST omits it.
			const response: JsonSchema & { unevaluatedItems: false } = { type: 'array', prefixItems, unevaluatedItems: false };
			return response;
		}
		return getPackedReferenceLegacyOutputSchema(valibotSchema);
	};
	const responseSchema = definition.output.type === 'void' ? undefined : markResponseProperties(
		toLegacyJsonSchema(definition.output, {
			target: 'openapi-3.0',
			typeMode: 'output',
			overrideSchema: legacyOutputOverride,
		}), tuplePrefixes,
	) as Schema;
	// A root optional response also documents the existing no-content branch.
	const response = responseSchema && (definition.output.type === 'optional' || definition.output.type === 'exact_optional')
		? { ...responseSchema, optional: true }
		: responseSchema;
	return { definition, input, response } as const;
}

/** Backend-only compatibility mode; native contract inference remains unchanged. */
export type ContractEndpointInputMode = 'native' | 'legacy-declared';

type DeclaredFields<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

/**
 * Preserve the legacy declared-field structural view for explicitly opted-in handlers.
 * This retains their existing `in` assumption; it does not prove active selector validity.
 */
export type LegacyDeclaredInput<T> = T extends object
	? keyof DeclaredFields<T> extends never ? T : DeclaredFields<T>
	: T;

export type ContractEndpointInput<Input extends v.GenericSchema, Mode extends ContractEndpointInputMode = 'native'> =
	Mode extends 'legacy-declared' ? LegacyDeclaredInput<InferSchemaOutput<Input>> : InferSchemaOutput<Input>;

export class ContractEndpoint<
	Meta extends IEndpointMeta,
	Input extends v.GenericSchema,
	Output extends v.GenericSchema,
	Mode extends ContractEndpointInputMode = 'native',
	WireInput extends v.GenericSchema = Input,
> extends Endpoint<Meta, ContractEndpointInput<Input, Mode>, InferSchemaOutput<Output>> {
	constructor(
		meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<Input, Output, WireInput>>,
		handler: EndpointExecutor<Meta, ContractEndpointInput<Input, Mode>, InferSchemaOutput<Output>>,
	) {
		if (Boolean(meta.requireFile) !== (projection.definition.transport === 'multipart/form-data')) {
			throw new Error('Endpoint requireFile metadata does not match its contract transport');
		}
		super(meta, projection.input, handler);
	}
}
