/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { packedSchemas } from '@features/index/contract/packed.js';
import { getSchemas } from '@features/api/backend/transport/openapi/schemas.js';

const schemas = getSchemas(false);

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

test('opaque queue results retain a required wire field', () => {
	expect(schemas.QueueJob).toHaveProperty('required', expect.arrayContaining(['returnValue']));
});
