import { describe, expect, test } from 'vitest';
import { APIClient } from '../src/api.js';

// The native ignored-body schema admits finite JSON. The legacy facade sends
// only credentials for non-record params and retains object fields.
describe('empty-schema native endpoint transport', () => {
	for (const endpoint of ['admin/captcha/current', 'reversi/invitations'] as const) {
		test(endpoint + ' keeps no-argument, object and non-record normalization unchanged', async () => {
			const calls: { input: string; init: unknown }[] = [];
			const response = { opaqueUnparsedResponse: true };
			const client = new APIClient({
				origin: 'https://empty-input.test/',
				credential: 'DEFAULT_TOKEN',
				fetch: async (input, init) => {
					calls.push({ input, init });
					return { status: 200, json: async () => response };
				},
			});
			const assertLastPayload = (params: object) => {
				expect(calls.at(-1)).toEqual({
					input: 'https://empty-input.test/api/' + endpoint,
					init: {
						method: 'POST',
						body: JSON.stringify(params),
						headers: { 'content-type': 'application/json' },
						credentials: 'omit',
						cache: 'no-cache',
						signal: expect.any(AbortSignal),
					},
				});
			};
			expect(await client.request(endpoint)).toStrictEqual(response);
			assertLastPayload({ i: 'DEFAULT_TOKEN' });
			for (const params of [undefined, null, 0, 42, true, false, '', 'ignored', [], ['ignored']]) {
				expect(await client.request(endpoint, params)).toStrictEqual(response);
				assertLastPayload({ i: 'DEFAULT_TOKEN' });
			}
			const params = { i: 'BODY_TOKEN', extra: 'retained', nested: { list: [1] } };
			const before = structuredClone(params);
			expect(await client.request(endpoint, params)).toStrictEqual(response);
			assertLastPayload({ ...params, i: 'DEFAULT_TOKEN' });
			expect(params).toEqual(before);
			expect(await client.request(endpoint, params, 'OVERRIDE_TOKEN')).toStrictEqual(response);
			assertLastPayload({ ...params, i: 'OVERRIDE_TOKEN' });
			expect(await client.request(endpoint, undefined, null)).toStrictEqual(response);
			assertLastPayload({ i: null });
			client.credential = undefined;
			expect(await client.request(endpoint, null)).toStrictEqual(response);
			assertLastPayload({});
		});
	}
});
