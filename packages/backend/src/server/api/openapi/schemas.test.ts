/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { packedSchemas } from '@features/index/backend/packed.schema.js';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';

const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
const schemas = spec.components?.schemas ?? {};

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
	if (!isRecord(value)) throw new Error('Missing generated schema object');
	return value;
}

test('generated schemas use OpenAPI 3.1 nullable and tuple syntax', () => {
	expect(spec.openapi).toMatch(/^3\.1\./);
	const visit = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
		} else if (value !== null && typeof value === 'object') {
			if ('nullable' in value) expect(value.nullable).not.toBe(false);
			if ('items' in value) expect(Array.isArray(value.items)).toBe(false);
			for (const child of Object.values(value)) visit(child);
		}
	};
	visit(spec.paths);
	visit(schemas);
	for (const path of ['/admin/queue/deliver-delayed', '/admin/queue/inbox-delayed']) {
		const operation = record(record(spec.paths)[path]).post;
		const response = record(record(record(operation).responses)['200']);
		const schema = record(record(record(response.content)['application/json']).schema);
		const tuple = record(schema.items);
		expect(tuple.prefixItems).toEqual([{ type: 'string' }, { type: 'number' }]);
		expect(tuple.minItems).toBe(2);
	}
});

test('all packed models are exported as named OpenAPI components', () => {
	const names = Object.keys(packedSchemas);
	expect(names).toHaveLength(69);
	for (const name of names) {
		expect(schemas).toHaveProperty(name);
	}
});

test('packed schema references resolve to named OpenAPI components', () => {
	const references: string[] = [];
	const visit = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
		} else if (value && typeof value === 'object') {
			for (const [key, item] of Object.entries(value)) {
				if (key === '$ref' && typeof item === 'string') references.push(item);
				else visit(item);
			}
		}
	};
	visit(schemas);

	expect(references.length).toBeGreaterThan(0);
	for (const reference of references) {
		expect(reference).toMatch(/^#\/components\/schemas\//);
		const name = reference.slice('#/components/schemas/'.length);
		expect(schemas).toHaveProperty(name);
	}
});

test('queue results describe finite JSON while allowing absent unfinished return values', () => {
	const queue = record(schemas.QueueJob);
	expect(record(queue.properties)).toHaveProperty('returnValue');
	expect(queue.required).not.toContain('returnValue');
});
