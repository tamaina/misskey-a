/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { experimental_ValibotToJsonSchemaConverter } from '@orpc/valibot';
import { pilotContract } from '../../../../index/backend/api.contract.js';
import { serverInfoObjectInput } from '../../../../instance/backend/endpoints/server-info.contract.js';
import { apiErrorInfoObject } from '../errors.schema.js';
import { imageCommentLength } from '../../../../drive/backend/endpoints/drive/files/create.schema.js';

/** JSON Schema exists only as generated external documentation, never request validation. */
export async function genPilotOpenapiSpec(config: { version: string; apiUrl: string }) {
	const converter = new experimental_ValibotToJsonSchemaConverter({
		overrideAction: ({ valibotAction, jsonSchema }) => valibotAction === imageCommentLength
			? { ...jsonSchema, maxLength: 512 } : undefined,
		overrideSchema: ({ valibotSchema }) => valibotSchema.type === 'blob'
			? { type: 'string', format: 'binary', contentMediaType: 'application/octet-stream' }
			: valibotSchema === serverInfoObjectInput || valibotSchema === apiErrorInfoObject ? { type: 'object' } : undefined,
	});
	const spec = await new OpenAPIGenerator({ schemaConverters: [converter] }).generate(pilotContract, {
		info: { version: config.version, title: 'Misskey API' }, servers: [{ url: config.apiUrl }],
		components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
		customErrorResponseBodySchema: errors => errors.length === 0 ? undefined : {
			type: 'object', required: ['error'], properties: {
				error: { anyOf: errors.map(([code, _message, _required, dataSchema]) => {
					const data = typeof dataSchema === 'boolean' ? {} : dataSchema;
					return { ...data, type: 'object', required: ['code', 'message', ...data.required ?? []],
						properties: { ...data.properties, code: { const: code }, message: { type: 'string' } } };
				}) },
			},
		},
	});
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
	return Object.entries(spec.paths ?? {}).flatMap(([path, item]) => {
		const body = item?.post?.requestBody;
		if (!body || '$ref' in body) return [];
		const schema = Object.values(body.content)[0]?.schema;
		if (!schema || '$ref' in schema) return [];
		const properties = Object.fromEntries(Object.entries(schema.properties ?? {}).flatMap(([name, property]) => {
			if ('$ref' in property || property.format === 'binary') return [];
			return [[name, typeof property.type === 'string' ? { type: property.type } : {}]];
		}));
		return [{ name: path.slice(1), properties }];
	});
}
