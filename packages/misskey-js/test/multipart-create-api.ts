import { expect, test } from 'vitest';
import { APIClient } from '../src/api.js';
import { endpointReqTypes } from '../src/autogen/endpoint.js';

test('native Blob and File keep direct multipart fields and credential behavior', async () => {
	for (const file of [new Blob(['plain'], { type: 'text/plain' }), new File(['named'], 'named.txt', { type: 'text/plain' })]) {
		for (const credential of [undefined, 'OVERRIDE', null]) {
			let body: FormData | undefined;
			const client = new APIClient({
				origin: 'https://multipart.test/', credential: 'DEFAULT',
				fetch: async (url, options) => {
					expect(url).toBe('https://multipart.test/api/drive/files/create');
					expect(options?.method).toBe('POST');
					expect(options?.headers).toEqual({});
					expect(options?.credentials).toBe('omit');
					expect(options?.cache).toBe('no-cache');
					expect(options?.body).toBeInstanceOf(FormData);
					if (!(options?.body instanceof FormData)) throw new Error('Expected multipart body');
					body = options.body;
					return { status: 200, json: async () => ({ id: 'packed-result' }) };
				},
			});
			expect(await client.request('drive/files/create', { file, folderId: null, name: null, comment: 'caption', force: true, isSensitive: false, future: { kept: true } }, credential)).toEqual({ id: 'packed-result' });
			const uploaded = body!.get('file');
			expect(uploaded).toBeInstanceOf(File);
			if (!(uploaded instanceof File)) throw new Error('Expected uploaded file');
			expect(await uploaded.text()).toBe(await file.text());
			expect(uploaded.type).toBe(file.type);
			expect(uploaded.name).toBe(file instanceof File ? file.name : 'blob');
			expect(body!.get('i')).toBe(credential === null ? null : credential ?? 'DEFAULT');
			expect(body!.has('folderId')).toBe(false);
			expect(body!.has('name')).toBe(false);
			expect(body!.get('comment')).toBe('caption');
			expect(body!.get('force')).toBe('true');
			expect(body!.get('isSensitive')).toBe('false');
			// No declared upload field is nested. This ignored extra follows oRPC's bracket encoding.
			expect(body!.get('future')).toBeNull();
			expect(body!.get('future[kept]')).toBe('true');
			expect(body!.has('data')).toBe(false);
			expect(body!.has('0')).toBe(false);
		}
	}
	expect(endpointReqTypes['drive/files/create']).toBe('multipart/form-data');
});

test('multipart errors retain APIClient rejection shape', async () => {
	const error = { id: 'legacy-error', code: 'INVALID_PARAM', message: 'Invalid param.', kind: 'client', info: { reason: 'legacy-detail' } };
	const client = new APIClient({ origin: 'https://multipart.test', fetch: async () => ({ status: 400, json: async () => ({ error }) }) });
	await expect(client.request('drive/files/create', { file: new Blob([]) })).rejects.toMatchObject(error);
});
