/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { genCompatibleOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { restoreChannelFederationOpenapiBaseline } from './openapi-baseline.js';

test('exploration input proof reverses only the four optional origin fields and rejects schema drift', async () => {
	const spec = await genCompatibleOpenapiSpec({ version: 'test', apiUrl: 'https://example.test/api' });
	const original = JSON.stringify(spec);
	const restored = restoreChannelFederationOpenapiBaseline(spec);
	expect(JSON.stringify(spec)).toBe(original);
	for (const path of ['/channels/featured', '/channels/search']) {
		const input = (value: typeof spec) => value.paths![path].post!.requestBody as { content: { 'application/json': { schema: { properties: Record<string, unknown>; required?: string[]; allOf: { properties: Record<string, unknown>; required?: string[] }[] } } } };
		for (const schema of [input(restored).content['application/json'].schema, input(restored).content['application/json'].schema.allOf[0]]) expect(schema.properties).not.toHaveProperty('origin');
		for (const representation of ['flat', 'intersection']) {
			for (const mutation of ['enum', 'default', 'required']) {
				const invalid = JSON.parse(original) as typeof spec;
				const outer = input(invalid).content['application/json'].schema;
				const schema = representation === 'flat' ? outer : outer.allOf[0];
				if (mutation === 'required') schema.required = [...(schema.required ?? []), 'origin'];
				else schema.properties.origin = mutation === 'enum' ? { enum: ['local'], type: 'string' } : { enum: ['local', 'remote'], type: 'string', default: 'local' };
				expect(() => restoreChannelFederationOpenapiBaseline(invalid)).toThrow();
			}
		}
	}
});
