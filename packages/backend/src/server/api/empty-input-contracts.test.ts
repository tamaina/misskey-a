/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import type { Config } from '@/config.js';
import type { Packed } from '@features/index/contract/packed.js';
import frozen from '../../../test/fixtures/empty-input-contract-baseline.json' with { type: 'json' };
import { emptyAdminCaptchaCurrentInput, emptyAdminCaptchaCurrentOutput, emptyInputEndpointDefinitions as authDefinitions } from '@features/auth/contract/empty-input-endpoint-definitions.js';
import { supportedCaptchaProviders } from '@features/auth/contract/captcha-providers.js';
import { emptyReversiInvitationsInput, emptyReversiInvitationsOutput, emptyInputEndpointDefinitions as gamesDefinitions } from '@features/games/contract/empty-input-endpoint-definitions.js';
import { getPackedReference, getPackedReferenceLegacyOutputSchema } from '@features/api/contract/packed-reference.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { endpoints as documentedEndpoints } from '@features/index/backend/endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';

// Exercise the production writer without importing Nest handlers or unrelated services.
vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));

const definitions = { ...authDefinitions, ...gamesDefinitions };
const frozenMetas = {
  "admin/captcha/current": {
    "tags": [
      "admin",
      "captcha"
    ],
    "requireCredential": true,
    "requireAdmin": true,
    "kind": "read:admin:meta",
    "res": {
      "type": "object",
      "properties": {
        "provider": {
          "type": "string",
          "enum": [
            "none",
            "hcaptcha",
            "mcaptcha",
            "recaptcha",
            "turnstile",
            "testcaptcha"
          ]
        },
        "hcaptcha": {
          "type": "object",
          "properties": {
            "siteKey": {
              "type": "string",
              "nullable": true
            },
            "secretKey": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "mcaptcha": {
          "type": "object",
          "properties": {
            "siteKey": {
              "type": "string",
              "nullable": true
            },
            "secretKey": {
              "type": "string",
              "nullable": true
            },
            "instanceUrl": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "recaptcha": {
          "type": "object",
          "properties": {
            "siteKey": {
              "type": "string",
              "nullable": true
            },
            "secretKey": {
              "type": "string",
              "nullable": true
            }
          }
        },
        "turnstile": {
          "type": "object",
          "properties": {
            "siteKey": {
              "type": "string",
              "nullable": true
            },
            "secretKey": {
              "type": "string",
              "nullable": true
            }
          }
        }
      }
    }
  },
  "reversi/invitations": {
    "requireCredential": true,
    "kind": "read:account",
    "res": {
      "type": "array",
      "optional": false,
      "nullable": false,
      "items": {
        "ref": "UserLite"
      }
    }
  }
} as const;

// Apply only the reviewed strict-object documentation additions to frozen evidence.
// Every other key and value remains intact; missing paths fail this oracle.
function reviewedClosedObjects(value: unknown, paths: readonly (readonly string[])[]): unknown {
	function closeAt(current: unknown, path: readonly string[]): unknown {
		if (current === null || typeof current !== 'object' || Array.isArray(current)) throw new Error('Expected frozen object at reviewed response path');
		if (path.length === 0) return { ...current, additionalProperties: false };
		if (!Object.hasOwn(current, path[0])) throw new Error('Missing reviewed response path: ' + path.join('.'));
		return Object.fromEntries(Object.entries(current).map(([key, child]) => [key, key === path[0] ? closeAt(child, path.slice(1)) : child]));
	}

	return paths.reduce<unknown>((current, path) => closeAt(current, path), value);
}

const captchaClosedPaths = [[], ['properties', 'hcaptcha'], ['properties', 'mcaptcha'], ['properties', 'recaptcha'], ['properties', 'turnstile']] as const;

const transportMeta = { requireCredential: false } as const;
const samples = [
	{ name: 'undefined', input: undefined },
	{ name: 'null', input: null },
	{ name: 'string', input: 'ignored' },
	{ name: 'empty string', input: '' },
	{ name: 'number', input: 42 },
	{ name: 'zero', input: 0 },
	{ name: 'true', input: true },
	{ name: 'false', input: false },
	{ name: 'empty array', input: [] },
	{ name: 'array', input: ['ignored', { extra: true }] },
	{ name: 'empty object', input: {} },
	{ name: 'object with extra properties', input: { ignored: 'retained', nested: { values: [1] } } },
	{ name: 'own special keys', input: JSON.parse('{"constructor":{"keep":true},"__proto__":{"keep":true},"prototype":{"keep":true}}') },
];

for (const route of Object.keys(definitions) as (keyof typeof definitions)[]) {
	const definition = definitions[route];
	const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
	const row = frozen.routes.find(item => item.route === route)!;
	test(route + ' retains the empty input and complete response documentation', () => {
		expect(JSON.parse(JSON.stringify(projection.input))).toEqual({});
		expect(projection.input).toEqual(row.input);
		expect(frozenMetas[route]).toEqual(row.meta);
		const baselineResponse = row.openapi.post.responses['200'].content['application/json'].schema;
		expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual(route === 'admin/captcha/current'
			? reviewedClosedObjects(baselineResponse, captchaClosedPaths) : baselineResponse);
		expect(definition.contract['~orpc'].route.method).toBe('POST');
		expect(definition.contract['~orpc'].route.path).toBe('/' + route);
	});

	test.each(samples)(route + ' accepts $name in actual legacy AJV and native input without rewriting', async ({ input }) => {
		const sentinel = { unvalidatedResponse: true, opaque: ['preserve'] };
		let legacyCalls = 0;
		let nativeCalls = 0;
		const legacy = new Endpoint(transportMeta, {}, async (params: unknown) => {
			legacyCalls++;
			expect(params).toBe(input);
			return sentinel;
		});
		const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async params => {
			nativeCalls++;
			expect(params).toBe(input);
			return sentinel;
		});
		const before = structuredClone(input);
		expect(await legacy.exec(input, null, null)).toBe(sentinel);
		expect(await native.exec(input, null, null)).toBe(sentinel);
		expect(legacyCalls).toBe(1);
		expect(nativeCalls).toBe(1);
		expect(input).toEqual(before);
		const parsed = v.safeParse(definition.input, input);
		expect(parsed.success).toBe(true);
		expect(parsed.output).toBe(input);
		const standard = await definition.input['~standard'].validate(input);
		expect(standard.issues).toBeUndefined();
		expect('value' in standard && standard.value).toBe(input);
	});
}

test('native inputs intentionally infer unknown and invitations keep canonical UserLite output', () => {
	expectTypeOf<v.InferInput<typeof emptyAdminCaptchaCurrentInput>>().toEqualTypeOf<unknown>();
	expectTypeOf<v.InferOutput<typeof emptyAdminCaptchaCurrentInput>>().toEqualTypeOf<unknown>();
	expectTypeOf<v.InferInput<typeof emptyReversiInvitationsInput>>().toEqualTypeOf<unknown>();
	expectTypeOf<v.InferOutput<typeof emptyReversiInvitationsInput>>().toEqualTypeOf<unknown>();
	expectTypeOf<v.InferOutput<typeof emptyReversiInvitationsOutput>>().toEqualTypeOf<Packed<'UserLite'>[]>();
	expect(getPackedReference(emptyReversiInvitationsOutput.item)).toBe('UserLite');
	expect(getPackedReferenceLegacyOutputSchema(emptyReversiInvitationsOutput.item)).toEqual({ ref: 'UserLite' });
	expect(v.safeParse(emptyReversiInvitationsOutput, [{ id: 'not-a-complete-user' }]).success).toBe(false);
});

test('captcha output reuses the provider tuple and retains every nullable field', () => {
	expect(emptyAdminCaptchaCurrentOutput.entries.provider.options).toBe(supportedCaptchaProviders);
	for (const provider of supportedCaptchaProviders) {
		const setting = {
			provider,
			hcaptcha: { siteKey: null, secretKey: null },
			mcaptcha: { siteKey: null, secretKey: null, instanceUrl: null },
			recaptcha: { siteKey: null, secretKey: null },
			turnstile: { siteKey: null, secretKey: null },
		};
		expect(v.parse(emptyAdminCaptchaCurrentOutput, setting)).toEqual(setting);
		expect(v.safeParse(emptyAdminCaptchaCurrentOutput, { ...setting, extra: 'rejected' }).success).toBe(false);
		for (const field of ['hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile'] as const) {
			expect(v.safeParse(emptyAdminCaptchaCurrentOutput, { ...setting, [field]: { ...setting[field], extra: 'rejected' } }).success).toBe(false);
		}
	}
});

test('the actual OpenAPI writer preserves both complete paths, authentication and statuses', () => {
	const saved = documentedEndpoints.slice();
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.keys(definitions).map(name => {
			const route = name as keyof typeof definitions;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
			return { name, meta: { ...frozenMetas[route], res: projection.response }, params: projection.input };
		}));
		// Only these two configuration fields are read by the production writer.
		const config = { version: 'empty-input-contract-test', apiUrl: 'https://empty-input.test/api' } as Config;
		const spec = genOpenapiSpec(config);
		expect(Object.keys(spec.paths).sort()).toEqual(frozen.routes.map(row => '/' + row.route).sort());
		for (const row of frozen.routes) {
			const expected = row.route === 'admin/captcha/current'
				? reviewedClosedObjects(row.openapi, captchaClosedPaths.map(path => ['post', 'responses', '200', 'content', 'application/json', 'schema', ...path]))
				: row.openapi;
			expect(JSON.parse(JSON.stringify(spec.paths['/' + row.route]))).toEqual(expected);
			expect(spec.paths['/' + row.route].post.security).toEqual([{ bearerAuth: [] }]);
			expect(spec.paths['/' + row.route].post).not.toHaveProperty('requestBody');
		}
		expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});
