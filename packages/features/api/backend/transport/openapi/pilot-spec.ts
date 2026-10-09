/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { experimental_ValibotToJsonSchemaConverter } from '@orpc/valibot';
import { packedJsonValueSchema } from '@features/users/backend/json-value.schema.js';
import { clientContract } from '@features/index/backend/client.contract.js';
import { packedSchemas } from '@features/index/backend/packed.schema.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { rawObjectInputGuard } from '../input.schema.js';
import { apiErrorInfoObject } from '../errors.schema.js';
import { requestRoutes, nullableResponsePaths } from '../../../shared/api-routing.js';
import { galleryFileIdsUnique } from '@features/collections/backend/api.definition.js';
import { imageCommentLength } from '@features/drive/backend/endpoints/drive/files/create.schema.js';

/** JSON Schema exists only as generated external documentation, never request validation. */
export async function genPilotOpenapiSpec(config: { version: string; apiUrl: string }) {
	const converter = new experimental_ValibotToJsonSchemaConverter({
		// OpenAPI 3.1 uses the 2020-12 tuple syntax, including positional prefixItems.
		target: 'draft-2020-12',
		overrideAction: ({ valibotAction, jsonSchema }) => {
			// Older descriptive metadata cannot add the OpenAPI 3.0 nullable keyword.
			// Native Valibot types already describe these non-null fields exactly.
			if (valibotAction.type === 'metadata' && jsonSchema.nullable === false) {
				const schema = { ...jsonSchema };
				delete schema.nullable;
				return schema;
			}
			if (valibotAction === galleryFileIdsUnique) return { ...jsonSchema, uniqueItems: true };
			if (valibotAction === imageCommentLength) return { ...jsonSchema, maxLength: 512 };
			// Native code-point actions retain AJV's Unicode semantics; the converter
			// emits the standard external string length keywords without schema registries.
			if ('requirement' in valibotAction && typeof valibotAction.requirement === 'number') {
				if (valibotAction.type === 'min_code_points') return { ...jsonSchema, minLength: valibotAction.requirement };
				if (valibotAction.type === 'max_code_points') return { ...jsonSchema, maxLength: valibotAction.requirement };
			}
			return undefined;
		},
		overrideSchema: ({ valibotSchema, jsonSchema }) => {
			// This raw-object proof adds no fields; the first branch contains the
			// externally documented object properties and constraints.
			if (valibotSchema.type === 'intersect' && 'options' in valibotSchema
				&& Array.isArray(valibotSchema.options) && valibotSchema.options[1] === rawObjectInputGuard) {
				const fields = jsonSchema.allOf?.[0];
				if (fields && typeof fields === 'object') return { ...jsonSchema, ...fields, allOf: jsonSchema.allOf };
			}
			if (valibotSchema.type === 'blob') return { type: 'string', format: 'binary', contentMediaType: 'application/octet-stream' };
			if (valibotSchema === apiErrorInfoObject) return { type: 'object' };
			return undefined;
		},
	});
	const spec = await new OpenAPIGenerator({ schemaConverters: [converter] }).generate(clientContract, {
		commonSchemas: { ...Object.fromEntries(Object.entries(packedSchemas).map(([name, schema]) => [name, { schema, strategy: 'output' as const }])), JsonValue: { schema: packedJsonValueSchema, strategy: 'output' } },
		info: { version: config.version, title: 'Misskey API' }, servers: [{ url: config.apiUrl }],
		components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
		customErrorResponseBodySchema: errors => errors.length === 0 ? undefined : errors.some(([code]) => code === 'SESSION_HTTP_ERROR') ? { anyOf: errors.map(([, , , dataSchema]) => dataSchema) } : {
			type: 'object', required: ['error'], properties: {
				error: { anyOf: errors.map(([code, _message, _required, dataSchema]) => {
					const data = typeof dataSchema === 'boolean' ? {} : dataSchema;
					return { ...data, type: 'object', required: ['code', 'message', ...data.required ?? []],
														properties: { ...data.properties, code: { const: code }, message: { type: 'string' } } };
				}) },
			},
		},
	});
	const nullable = new Set((await nullableResponsePaths(pilotContract)).map(path => JSON.stringify(path)));
	for (const route of requestRoutes(pilotContract)) {
		if (!nullable.has(JSON.stringify(route.path))) continue;
		const operation = spec.paths?.[route.httpPath]?.post;
		if (operation) operation.responses['204'] = { description: 'Empty result' };
	}
	// Valibot emits schema-local #/$defs references. Embedding those schemas in
	// an OpenAPI document requires document-absolute pointers for external tools.
	rebaseExternalSchemaRefs(spec);
	hoistExternalDefinitions(spec);
	// A File cannot be supplied as JSON. Keep only the converter-generated multipart body.
	for (const item of Object.values(spec.paths ?? {})) {
		const operation = item?.post;
		const body = operation?.requestBody;
		if (body && !('$ref' in body) && body.content['multipart/form-data']) {
			body.content = { 'multipart/form-data': body.content['multipart/form-data'] };
		}
	}
	return spec;
}

/** The old public introspection endpoint reads generated external input descriptions. */
export async function getPilotEndpointDescriptors() {
	const spec = await genPilotOpenapiSpec({ version: 'introspection', apiUrl: '/api' });
	type ExternalSchema = NonNullable<NonNullable<typeof spec.components>['schemas']>[string];

	function resolveSchema(schema: ExternalSchema): ExternalSchema {
		const seen = new Set<string>();
		while ('$ref' in schema && typeof schema.$ref === 'string' && schema.$ref.startsWith('#/components/schemas/')) {
			if (seen.has(schema.$ref)) break;
			seen.add(schema.$ref);
			const key = schema.$ref.slice('#/components/schemas/'.length).replaceAll('~1', '/').replaceAll('~0', '~');
			const target = spec.components?.schemas?.[key];
			if (!target) break;
			schema = target;
		}
		return schema;
	}

	const canonicalNames = new Set(requestRoutes(pilotContract).filter(route => route.introspection !== false).map(route => route.name));
	return Object.entries(spec.paths ?? {}).flatMap(([path, item]) => {
		if (!canonicalNames.has(path.slice(1))) return [];
		const body = item?.post?.requestBody;
		if (!body || '$ref' in body) return [];
		const bodySchema = Object.values(body.content)[0]?.schema;
		if (!bodySchema) return [];
		const schema = resolveSchema(bodySchema);
		if ('$ref' in schema) return [];
		const properties = Object.fromEntries(Object.entries(schema.properties ?? {}).flatMap(([name, property]) => {
			const resolved = resolveSchema(property);
			if ('$ref' in resolved || resolved.format === 'binary') return [];
			return [[name, typeof resolved.type === 'string' ? { type: resolved.type } : {}]];
		}));
		return [{ name: path.slice(1), properties }];
	});
}

/** Adapt generated external references only; application validation never reads JSON Schema. */
function rebaseExternalSchemaRefs(document: unknown) {
	const escape = (key: string) => key.replaceAll('~', '~0').replaceAll('/', '~1');

	function visit(value: unknown, path: string, scope?: string) {
		if (value === null || typeof value !== 'object') return;
		if (Array.isArray(value)) { value.forEach((child, index) => visit(child, `${path}/${index}`, scope)); return; }
		const localScope = '$defs' in value ? path : scope;
		if ('$ref' in value && typeof value.$ref === 'string' && value.$ref.startsWith('#/$defs/') && localScope !== undefined) {
			value.$ref = `#${localScope}${value.$ref.slice(1)}`;
		}
		for (const [key, child] of Object.entries(value)) visit(child, `${path}/${escape(key)}`, localScope);
	}

	visit(document, '');
}

/** OpenAPI generators consume named components rather than schema-local $defs. */
function hoistExternalDefinitions(document: { components?: { schemas?: Record<string, unknown> } }) {
	document.components ??= {};
	const schemas = document.components.schemas ??= {};
	const references = new Map<string, string>();
	let count = 0;
	const escape = (key: string) => key.replaceAll('~', '~0').replaceAll('/', '~1');

	function collect(value: unknown, path: string) {
		if (value === null || typeof value !== 'object') return;
		if (Array.isArray(value)) { value.forEach((child, index) => collect(child, `${path}/${index}`)); return; }
		if ('$defs' in value && value.$defs !== null && typeof value.$defs === 'object' && !Array.isArray(value.$defs)) {
			for (const [key, definition] of Object.entries(value.$defs)) {
				const name = `OrpcDefinition${++count}`;
				references.set(`#${path}/$defs/${escape(key)}`, `#/components/schemas/${name}`);
				schemas[name] = definition;
				collect(definition, `${path}/$defs/${escape(key)}`);
			}
			delete value.$defs;
		}
		for (const [key, child] of Object.entries(value)) collect(child, `${path}/${escape(key)}`);
	}

	collect(document, '');

	function rewrite(value: unknown) {
		if (value === null || typeof value !== 'object') return;
		if (Array.isArray(value)) { value.forEach(rewrite); return; }
		if ('$ref' in value && typeof value.$ref === 'string') value.$ref = references.get(value.$ref) ?? value.$ref;
		Object.values(value).forEach(rewrite);
	}

	rewrite(document);
}
