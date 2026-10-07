/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import _Ajv from 'ajv';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { uniqueStringEndpointDefinitions as authDefinitions } from '@features/auth/contract/unique-string-endpoint-definitions.js';
import { uniqueStringEndpointDefinitions as driveDefinitions } from '@features/drive/contract/unique-string-endpoint-definitions.js';
import { uniqueStringEndpointDefinitions as galleryDefinitions } from '@features/gallery/contract/unique-string-endpoint-definitions.js';
import { misskeyIdPattern } from '@features/api/contract/index.js';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';

const Ajv = _Ajv.default;
const definitions = { ...authDefinitions, ...driveDefinitions, ...galleryDefinitions };
const fixtures = [
	{
		"route": "app/create",
		"input": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string"
				},
				"description": {
					"type": "string"
				},
				"permission": {
					"type": "array",
					"uniqueItems": true,
					"items": {
						"type": "string"
					}
				},
				"callbackUrl": {
					"type": "string",
					"nullable": true
				}
			},
			"required": [
				"name",
				"description",
				"permission"
			]
		},
		"output": {
			"$ref": "#/components/schemas/App"
		}
	},
	{
		"route": "drive/files/move-bulk",
		"input": {
			"type": "object",
			"properties": {
				"fileIds": {
					"type": "array",
					"uniqueItems": true,
					"minItems": 1,
					"maxItems": 100,
					"items": {
						"type": "string",
						"format": "misskey:id"
					}
				},
				"folderId": {
					"type": "string",
					"format": "misskey:id",
					"nullable": true
				}
			},
			"required": [
				"fileIds"
			]
		},
		"output": null
	},
	{
		"route": "gallery/posts/create",
		"input": {
			"type": "object",
			"properties": {
				"title": {
					"type": "string",
					"minLength": 1
				},
				"description": {
					"type": "string",
					"nullable": true
				},
				"fileIds": {
					"type": "array",
					"uniqueItems": true,
					"minItems": 1,
					"maxItems": 32,
					"items": {
						"type": "string",
						"format": "misskey:id"
					}
				},
				"isSensitive": {
					"type": "boolean",
					"default": false
				}
			},
			"required": [
				"title",
				"fileIds"
			]
		},
		"output": {
			"$ref": "#/components/schemas/GalleryPost"
		}
	},
	{
		"route": "gallery/posts/update",
		"input": {
			"type": "object",
			"properties": {
				"postId": {
					"type": "string",
					"format": "misskey:id"
				},
				"title": {
					"type": "string",
					"minLength": 1
				},
				"description": {
					"type": "string",
					"nullable": true
				},
				"fileIds": {
					"type": "array",
					"uniqueItems": true,
					"minItems": 1,
					"maxItems": 32,
					"items": {
						"type": "string",
						"format": "misskey:id"
					}
				},
				"isSensitive": {
					"type": "boolean",
					"default": false
				}
			},
			"required": [
				"postId"
			]
		},
		"output": {
			"$ref": "#/components/schemas/GalleryPost"
		}
	},
	{
		"route": "miauth/gen-token",
		"input": {
			"type": "object",
			"properties": {
				"session": {
					"type": "string",
					"nullable": true
				},
				"name": {
					"type": "string",
					"nullable": true
				},
				"description": {
					"type": "string",
					"nullable": true
				},
				"iconUrl": {
					"type": "string",
					"nullable": true
				},
				"permission": {
					"type": "array",
					"uniqueItems": true,
					"items": {
						"type": "string"
					}
				}
			},
			"required": [
				"session",
				"permission"
			]
		},
		"output": {
			"type": "object",
			"properties": {
				"token": {
					"type": "string"
				}
			},
			"required": [
				"token"
			]
		}
	}
] as const;

function samples(route: string): unknown[] {
	if (route === 'app/create') {
		const body = { name: 'app', description: 'description', permission: [] };
		return [
			body, { ...body, name: '😀', description: '', permission: ['a', 'A'], future: { keep: true } },
			{ ...body, permission: ['é', 'é'] }, { ...body, permission: ['😀', '😀'] },
			{ ...body, permission: ['x', 'x'] }, { ...body, permission: [1] }, { ...body, permission: null },
			{ name: 'app', permission: [] }, [], null,
		];
	}
	if (route === 'miauth/gen-token') {
		const body = { session: null, permission: [] };
		return [
			body, { session: 'session', permission: ['a', 'A'], name: null, future: { keep: true } },
			{ ...body, permission: ['é', 'é'] }, { ...body, permission: ['😀', '😀'] },
			{ ...body, permission: ['x', 'x'] }, { ...body, permission: [1] }, { ...body, permission: null },
			{ permission: [] }, [], null,
		];
	}
	const base = route === 'gallery/posts/update' ? { postId: 'post1' }
		: route === 'gallery/posts/create' ? { title: '😀', fileIds: ['id1'] } : { fileIds: ['id1'] };
	const maximum = route === 'drive/files/move-bulk' ? 100 : 32;
	return [
		base, { ...base, fileIds: ['id1', 'ID1'], description: null, folderId: null, future: { keep: true } },
		{ ...base, fileIds: ['id1', 'id1'] }, { ...base, fileIds: [] },
		{ ...base, fileIds: Array.from({ length: maximum }, (_, index) => 'id' + index) },
		{ ...base, fileIds: Array.from({ length: maximum + 1 }, (_, index) => 'id' + index) },
		{ ...base, fileIds: ['bad-id'] }, { ...base, fileIds: [1] }, { ...base, fileIds: null },
		{ ...base, isSensitive: null }, { ...base, title: '' }, {}, [], null,
	];
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value)
			.filter(([key, child]) => !(key === 'required' && Array.isArray(child) && child.length === 0))
			.map(([key, child]) => [key, canonical(child)]));
	}
	return value;
}

for (const fixture of fixtures) {
	test(fixture.route + ' retains unique-string input, native validation and response documentation', () => {
		const definition = definitions[fixture.route];
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
		expect(canonical(projection.input)).toEqual(canonical(fixture.input));
		const documentedOutput = projection.response === undefined ? null
			: convertSchemaToOpenApiSchema(projection.response, 'res', true);
		expect(documentedOutput).toEqual(fixture.output);
		const ajv = new Ajv({ useDefaults: true }).addFormat('misskey:id', misskeyIdPattern);
		const legacy = ajv.compile(fixture.input);
		const current = ajv.compile(projection.input);
		for (const sample of samples(fixture.route)) {
			const before = structuredClone(sample);
			const after = structuredClone(sample);
			const oldValid = legacy(before);
			const newValid = current(after);
			expect(newValid).toBe(oldValid);
			expect(current.errors).toEqual(legacy.errors);
			expect(after).toEqual(before);
			const native = v.safeParse<v.GenericSchema>(definition.input, structuredClone(sample));
			expect(native.success).toBe(oldValid);
			if (native.success) expect(native.output).toEqual(before);
		}
	});
}
