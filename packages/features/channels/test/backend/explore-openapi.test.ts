/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { channelsApiContract } from '../../backend/api.definition.js';
import { genCompatibleOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { restoreChannelFederationOpenapiBaseline } from './openapi-baseline.js';

test('exploration input proof reverses only the four optional origin fields and rejects schema drift', async () => {
	const spec = await genCompatibleOpenapiSpec({ version: 'test', apiUrl: 'https://example.test/api' });
	const original = JSON.stringify(spec);
	const restored = restoreChannelFederationOpenapiBaseline(spec);
	expect(JSON.stringify(spec)).toBe(original);
	for (const path of ['/channels/featured', '/channels/search']) {
		const input = (value: typeof spec) => {
			const body = value.paths?.[path]?.post?.requestBody;
			if (body == null || !('content' in body)) throw new Error(`Missing request body: ${path}`);
			return body as { content: { 'application/json': { schema: { properties: Record<string, unknown>; required?: string[]; allOf: { properties: Record<string, unknown>; required?: string[] }[] } } } };
		};
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

// Keep the request-validation coverage formerly housed in finite-contracts.test.ts.
test.each(['channelsFeatured', 'channelsSearch'] as const)('%s keeps origin optional and accepts only local or remote', name => {
	const input = channelsApiContract[name]['~orpc'].inputSchema;
	if (!input) throw new Error('Missing channel input schema');
	const params = name === 'channelsSearch' ? { query: '' } : {};
	expect(v.parse(input, params)).not.toHaveProperty('origin');
	for (const origin of ['local', 'remote']) expect(v.parse(input, { ...params, origin })).toMatchObject({ origin });
	for (const origin of ['all', '', null, true]) expect(v.safeParse(input, { ...params, origin }).success).toBe(false);
});

test('freeze and eligibility proof rejects changed types and requiredness', async () => {
	const spec = await genCompatibleOpenapiSpec({ version: 'test', apiUrl: 'https://example.test/api' });
	for (const field of ['canFederateChannel', 'isFederationFrozen']) {
		for (const mutation of ['type', 'required']) {
			const invalid = structuredClone(spec);
			let changed = false;

			function mutate(value: unknown): void {
				if (changed || value == null || typeof value !== 'object') return;
				const schema = value as { properties?: Record<string, unknown>; required?: string[] };
				if (schema.properties?.[field] && schema.required?.includes(field)) {
					if (mutation === 'type') schema.properties[field] = { type: 'string' };
					else schema.required = schema.required.filter(key => key !== field);
					changed = true;
					return;
				}
				Object.values(value).forEach(mutate);
			}

			mutate(invalid);
			expect(changed).toBe(true);
			expect(() => restoreChannelFederationOpenapiBaseline(invalid)).toThrow();
		}
	}
});
