/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { packedSchemas } from '@features/index/backend/packed.schema.js';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';

const schemas = (await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' })).components?.schemas ?? {};

test('all packed models are exported as named OpenAPI components', () => {
	const names = Object.keys(packedSchemas);
	expect(names).toHaveLength(70);
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

test('opaque queue results retain a required wire field', () => {
	expect(schemas.QueueJob).toHaveProperty('required', expect.arrayContaining(['returnValue']));
});
