import { vi, describe, test, expect } from 'vitest';
import { APIClient, isAPIError } from '../src/api.js';

async function requestBody(request: Request): Promise<Record<string, unknown>> {
	const body: unknown = await request.clone().json();
	if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected a JSON object request');
	return { ...body };
}

async function expectJsonRequest(input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1], url: string, body: Record<string, unknown>) {
	const request = new Request(input instanceof Request ? input.clone() : input, init);
	expect(request.url).toBe(url);
	expect(request.method).toBe('POST');
	expect(request.headers.get('content-type')).toBe('application/json');
	expect(request.credentials).toBe('omit');
	expect(request.cache).toBe('no-cache');
	expect(await requestBody(request)).toEqual(body);
}

describe('API', () => {
	test('success', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				const request = new Request(url instanceof Request ? url.clone() : url, options);
				if (request.url === 'https://misskey.test/api/i' && request.method === 'POST') {
					if (request.body) {
						const body = await requestBody(request);
						if (body.i === 'TOKEN') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}

					return new Response(null, { status: 400 });
				}

				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('i');

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		await expectJsonRequest(fetchMock.mock.calls[0][0], fetchMock.mock.calls[0][1], 'https://misskey.test/api/i', { i: 'TOKEN' });

		fetchMock.mockRestore();
	});

	test('with params', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				const request = new Request(url instanceof Request ? url.clone() : url, options);
				if (request.url === 'https://misskey.test/api/notes/show' && request.method === 'POST') {
					if (request.body) {
						const body = await requestBody(request);
						if (body.i === 'TOKEN' && body.noteId === 'aaaaa') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('notes/show', { noteId: 'aaaaa' });

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		await expectJsonRequest(fetchMock.mock.calls[0][0], fetchMock.mock.calls[0][1], 'https://misskey.test/api/notes/show', { noteId: 'aaaaa', i: 'TOKEN' });

		fetchMock.mockRestore();
	});

	test('multipart/form-data', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				const request = new Request(url instanceof Request ? url.clone() : url, options);
				if (request.url === 'https://misskey.test/api/drive/files/create' && request.method === 'POST') {
					if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
						const file = (await request.clone().formData()).get('file');
						if (file instanceof File && file.name === 'foo.txt') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
			// Explicit FetchLike injection retains the legacy string/options surface.
			fetch: fetchMock,
		});

		const testFile = new File([], 'foo.txt');

		const res = await cli.request('drive/files/create', {
			file: testFile,
			name: null, // nullのパラメータは消える
		});

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveBeenCalledWith('https://misskey.test/api/drive/files/create', {
			method: 'POST',
			body: expect.any(FormData),
			signal: expect.any(AbortSignal),
			headers: {},
			credentials: 'omit',
			cache: 'no-cache',
		});

		fetchMock.mockRestore();
	});

	test('204 No Content で null が返る', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				const request = new Request(url instanceof Request ? url.clone() : url, options);
				if (request.url === 'https://misskey.test/api/reset-password' && request.method === 'POST') {
					return new Response(null, { status: 204 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('reset-password', { token: 'aaa', password: 'aaa' });

		expect(res).toEqual(null);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		await expectJsonRequest(fetchMock.mock.calls[0][0], fetchMock.mock.calls[0][1], 'https://misskey.test/api/reset-password', { token: 'aaa', password: 'aaa', i: 'TOKEN' });

		fetchMock.mockRestore();
	});

	test('インスタンスの credential が指定されていても引数で credential が null ならば null としてリクエストされる', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				const request = new Request(url instanceof Request ? url.clone() : url, options);
				if (request.url === 'https://misskey.test/api/i' && request.method === 'POST') {
					if (request.body) {
						const body = await requestBody(request);
						if (typeof body.i === 'string') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						} else {
							return new Response(JSON.stringify({
								error: {
									message: 'Credential required.',
									code: 'CREDENTIAL_REQUIRED',
									id: '1384574d-a912-4b81-8601-c7b1c4085df1',
								}
							}), { status: 401 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i', {}, null);
		} catch (e) {
			if (e === null || typeof e !== 'object') throw e;
			expect(isAPIError({ ...e })).toEqual(true);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('api error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				return new Response(JSON.stringify({
					error: {
						message: 'Internal error occurred. Please contact us if the error persists.',
						code: 'INTERNAL_ERROR',
						id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
						kind: 'server',
					},
				}), { status: 500 });
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e: unknown) {
			if (e === null || typeof e !== 'object') throw e;
			expect(isAPIError({ ...e })).toEqual(true);
			expect(e).toMatchObject({ id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac' });
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('network error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				throw new Error('Network error');
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			if (e === null || typeof e !== 'object') throw e;
			expect(isAPIError({ ...e })).toEqual(false);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('json parse error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				return new Response('<html>I AM NOT JSON</html>', { status: 500 });
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			if (e === null || typeof e !== 'object') throw e;
			expect(isAPIError({ ...e })).toEqual(false);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('admin/roles/create の型が合う', async() => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				// 本来返すべき値は`Role`型だが、テストなのでお茶を濁す
				return new Response('{}', { status: 200 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});
		await cli.request('admin/roles/create', {
			name: 'aaa',
			asBadge: false,
			canEditMembersByModerator: false,
			color: '#123456',
			condFormula: {},
			description: '',
			displayOrder: 0,
			iconUrl: '',
			isAdministrator: false,
			isExplorable: false,
			isModerator: false,
			isPublic: false,
			policies: {
				ltlAvailable: {
					value: true,
					priority: 0,
					useDefault: false,
				},
			},
			target: 'manual',
		});

		fetchMock.mockRestore();
	})
});


test('default native fetch receives the official Request without reparsing multipart', async () => {
	const formReader = vi.spyOn(Request.prototype, 'formData').mockImplementation(async () => { throw Error('Must not materialize FormData'); });
	const nativeFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (request, init) => {
		expect(request).toBeInstanceOf(Request);
		if (!(request instanceof Request)) throw Error('Expected official Request');
		expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
		expect(init?.credentials).toBe('omit');
		expect(init?.cache).toBe('no-cache');
		expect(await request.text()).toContain('native-bytes');
		return new Response('{"id":"file1"}', { headers: { 'Content-Type': 'application/json' } });
	});
	try {
		const client = new APIClient({ origin: 'https://native.test' });
		expect(await client.request('drive/files/create', { file: new Blob(['native-bytes']) })).toEqual({ id: 'file1' });
		expect(formReader).not.toHaveBeenCalled();
	} finally { nativeFetch.mockRestore(); formReader.mockRestore(); }
});
