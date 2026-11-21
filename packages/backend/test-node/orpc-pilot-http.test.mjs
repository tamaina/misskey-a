/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { safe, isDefinedError } from '@orpc/server';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { composeNativeTestRouter, nativeTestDependencies } from '../../features/api/test/native-router-fixture.mjs';
import { APIClient } from '../../misskey-js/built/api.js';
import { registerPilotHttp, bodyCredential, misskeyErrorBody, genPilotOpenapiSpec, getPilotEndpointDescriptors, nullSuccessToNoContent } from '../built/features/api/pilot.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const chartSection = { total: [1], inc: [1], dec: [0], diffs: { normal: [1], reply: [0], renote: [0], withFile: [0] } };
const chartOutput = { local: chartSection, remote: chartSection };
const stats = { machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } };
const output = { id: 'file1', createdAt: '2026-10-08T00:00:00.000Z', name: 'file.txt', type: 'text/plain',
	md5: 'hash', size: 5, isSensitive: false, blurhash: null, properties: {}, url: 'https://example.com/file',
	thumbnailUrl: null, comment: null, folderId: null, folder: null, userId: null, user: null };

async function fixture(t, overrides = {}, domainOverrides = {}) {
	const events = [];
	const uploads = new Map();
	const dependencies = nativeTestDependencies({ actor, serverInfo: stats, packedFile: output, chartOutput,
		events, uploadAtPath: path => uploads.get(path) });
	for (const [feature, ports] of Object.entries(domainOverrides)) Object.assign(dependencies[feature], ports);
	const app = Fastify();
	const router = composeNativeTestRouter(dependencies);
	const handler = new OpenAPIHandler(router, { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
	await app.register(async api => {
		await api.register(multipart, { limits: { fileSize: 1024, files: 1 } });
		registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(),
			context: (request, reply, name, upload) => {
				if (upload) uploads.set(upload.path, upload);
				return {
					credential: name === 'clear-browser-cache' ? undefined : bodyCredential(request), ip: request.ip, headers: request.headers, upload,
					response: { header: (key, value) => { reply.header(key, value); } },
					services: {
						authenticate: async credential => {
							events.push(['credential', credential]);
							return credential ? [actor, credential === 'session' ? null : { permission: credential === 'restricted' ? [] : ['write:notes', 'write:drive', 'write:notifications'] }] : [null, null];
						},
						limitActor: principal => principal?.id ?? 'ip',
						rateLimitFactor: async () => 1, limit: async () => null,
						...overrides,
					},
				};
			},
		});
	}, { prefix: '/api' });
	const origin = await app.listen({ host: '127.0.0.1', port: 0 });
	t.after(async () => { await app.close(); uploads.clear(); });
	return { app, dependencies, events, origin, router, client: new APIClient({ origin, credential: 'native' }) };
}

test('real HTTP and SDK preserve public JSON, auth precedence and 204/null', async t => {
	const { app, client, events } = await fixture(t);
	assert.deepEqual(await client.request('server-info', { unused: true }), stats);
	assert.deepEqual(await client.orpc.instance.serverInfo({}), stats);
	assert.deepEqual(await client.orpc.instance.serverInfo(), stats);
	assert.equal(events.filter(event => event[0] === 'credential').at(-1)[1], 'native');
	const get = await app.inject({ method: 'GET', url: '/api/server-info' });
	assert.equal(get.statusCode, 200);
	assert.equal(get.headers['cache-control'], 'public, max-age=60');
	assert.deepEqual(get.json(), stats);
	assert.equal(await client.request('notes/delete', { noteId: 'note1' }), null);
	assert.equal(await client.orpc.notes.delete({ noteId: 'note2' }), undefined);
	const response = await app.inject({ method: 'POST', url: '/api/notes/delete',
		headers: { authorization: 'Bearer native' }, payload: { i: 'restricted', noteId: 'note3' } });
	assert.equal(response.statusCode, 204);
	assert.equal(response.body, '');
	assert.deepEqual(events.filter(event => event[0] === 'delete').map(event => event[1]), ['note1', 'note2', 'note3']);
});

test('native cache clearing preserves SDK routing, GET/POST204, the exact header and rejected verbs', async t => {
	const { app, client, events } = await fixture(t);
	const header = '"cache", "prefetchCache", "prerenderCache", "executionContexts"';
	assert.equal(await client.request('clear-browser-cache'), null);
	assert.equal(await client.orpc.clearBrowserCache({}), undefined);
	assert.equal(await client.orpc.clearBrowserCacheGet({}), undefined);
	for (const method of ['GET', 'POST']) {
		const response = await app.inject({ method, url: '/api/clear-browser-cache' });
		assert.equal(response.statusCode, 204);
		assert.equal(response.body, '');
		assert.equal(response.headers['clear-site-data'], header);
	}
	for (const payload of [null, [], { i: 42 }, 'ignored input']) {
		const response = await app.inject({ method: 'POST', url: '/api/clear-browser-cache', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
		assert.equal(response.statusCode, 204);
		assert.equal(response.headers['clear-site-data'], header);
	}
	for (const method of ['PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE']) {
		const response = await app.inject({ method, url: '/api/clear-browser-cache' });
		assert.equal(response.statusCode, 405);
		assert.equal(response.body, '');
		assert.equal(response.headers['clear-site-data'], undefined);
	}
	assert.equal(events.some(event => event[0] === 'credential'), false);
});

test('HTTP failures and SDK error decoding retain envelope, UUID and policy order', async t => {
	const { app, client } = await fixture(t);
	const missing = await app.inject({ method: 'POST', url: '/api/notes/delete', payload: { noteId: false } });
	assert.equal(missing.statusCode, 401);
	assert.equal(missing.json().error.code, 'CREDENTIAL_REQUIRED');
	assert.equal(missing.json().error.id, '1384574d-a912-4b81-8601-c7b1c4085df1');
	await assert.rejects(client.request('notes/delete', { noteId: 'note1' }, 'restricted'), error =>
		error.code === 'PERMISSION_DENIED' && error.id === '1370e5b7-d4eb-4566-bb1d-7748ee6a1838');
	await assert.rejects(client.orpc.notes.delete({ noteId: 'bad!' }), error => error.code === 'INVALID_PARAM' && error.status === 400);
	const limited = await fixture(t, { limit: async () => ({ info: { resetMs: 123 } }) });
	const response = await limited.app.inject({ method: 'POST', url: '/api/notes/delete', payload: {} });
	assert.equal(response.statusCode, 429);
	assert.equal(response.json().error.info.resetMs, 123);
});

test('real SDK multipart reaches the single File contract, defaults and cleanup', async t => {
	const { client, events } = await fixture(t);
	assert.deepEqual(await client.request('drive/files/create', { file: new File(['bytes'], 'file.txt', { type: 'text/plain' }), comment: '😀'.repeat(512), future: { kept: true }, path: '/untrusted/body/path' }), output);
	assert.deepEqual(await client.orpc.drive.files.create({ file: new File(['bytes'], 'file.txt'), force: true }), output);
	const uploads = events.filter(event => event[0] === 'upload');
	assert.equal(uploads.length, 2);
	assert.equal(uploads[0][1].force, false);
	for (const ignored of ['future', 'future[kept]', 'path']) assert.equal(ignored in uploads[0][1], false);
	assert.equal(uploads[0][1].folderId, null);
	assert.equal(uploads[0][3], 'bytes');
	assert.equal(uploads[1][1].force, true);
	for (const upload of uploads) await assert.rejects(access(upload[2]), { code: 'ENOENT' });
	await assert.rejects(client.request('drive/files/create', { file: new File(['bytes'], 'file.txt'), comment: '😀'.repeat(513) }), error => error.code === 'INVALID_PARAM');
});

test('HTTP upload limit remains enforced and finite projection skips output validation', async t => {
	const { origin, app, events, router } = await fixture(t, {}, { instance: { serverInfo: { enabled: () => true, read: async () => ({ ...stats, secret: true }) } } });
	const validate = t.mock.method(router.instance.serverInfo['~orpc'].outputSchema['~standard'], 'validate', () => { throw Error('Output validation must be disabled'); });
	const projected = await app.inject({ method: 'POST', url: '/api/server-info', payload: {} });
	assert.equal(projected.statusCode, 200);
	assert.deepEqual(projected.json(), stats);
	assert.equal(validate.mock.callCount(), 0);
	const form = new FormData();
	form.set('i', 'native');
	form.set('file', new File(['x'.repeat(1025)], 'large.txt'));
	const tooLarge = await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form });
	assert.equal(tooLarge.status, 413);
	assert.equal(await tooLarge.text(), '');
	assert.equal(events.some(event => event[0] === 'upload'), false);
});

test('official external specification describes multipart, Unicode bound, finite outputs and no content', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'pilot', apiUrl: 'https://example.com/api' });
	const upload = spec.paths['/drive/files/create'].post;
	assert.deepEqual(Object.keys(upload.requestBody.content), ['multipart/form-data']);
	const input = upload.requestBody.content['multipart/form-data'].schema;
	assert.equal(input.properties.comment.anyOf[0].maxLength, 512);
	assert.equal(input.properties.file.contentMediaType, 'application/octet-stream');
	assert.deepEqual(upload.security, [{ bearerAuth: [] }]);
	assert.equal(upload.responses['200'].content['application/json'].schema.additionalProperties, false);
	assert.ok(upload.responses['400'].content['application/json'].schema.properties.error.anyOf.some(error => error.properties.code.const === 'INVALID_PARAM'));
	assert.deepEqual(spec.paths['/notes/delete'].post.responses['204'].content, {});
});


test('malformed multipart requests keep the bare client-error boundary', async t => {
	const { app, events } = await fixture(t);
	const response = await app.inject({ method: 'POST', url: '/api/drive/files/create',
		headers: { 'content-type': 'multipart/form-data; boundary=broken' }, payload: '--broken\r\n' });
	assert.equal(response.statusCode, 400);
	assert.equal(response.body, '');
	assert.equal(events.some(event => event[0] === 'upload'), false);
});


test('public native introspection comes from the contract and keeps staged paths private', async () => {
	const descriptors = await getPilotEndpointDescriptors();
	assert.equal(descriptors.length, 438);
	assert.equal(new Set(descriptors.map(item => item.name)).size, 438);
	assert.equal(descriptors.some(item => item.name === 'clear-browser-cache'), false);
	assert.deepEqual(descriptors.find(item => item.name === 'notes/delete').properties, { noteId: { type: 'string' } });
	assert.equal('file' in descriptors.find(item => item.name === 'drive/files/create').properties, false);
	assert.equal(JSON.stringify(descriptors).includes('path'), false);
});


test('a real socket abort during multipart staging removes the temporary file', async t => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-http-abort-test-'));
	const previous = process.env.TMPDIR;
	process.env.TMPDIR = directory;
	t.after(async () => {
		if (previous === undefined) delete process.env.TMPDIR;
		else process.env.TMPDIR = previous;
		await rm(directory, { recursive: true, force: true });
	});
	const { origin, events } = await fixture(t);
	const request = httpRequest(`${origin}/api/drive/files/create`, {
		method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=aborted', authorization: 'Bearer native' },
	});
	request.on('error', () => {});
	request.write('--aborted\r\nContent-Disposition: form-data; name="file"; filename="file.txt"\r\nContent-Type: text/plain\r\n\r\n' + 'x'.repeat(64));
	let staged = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		const paths = await readdir(directory);
		if (paths.length && (await readdir(join(directory, paths[0]))).includes('file')) { staged = true; break; }
		await delay(10);
	}
	request.destroy();
	assert.equal(staged, true, 'the upload reached disk before cancellation');
	for (let attempt = 0; attempt < 100 && (await readdir(directory)).length; attempt++) await delay(10);
	assert.deepEqual(await readdir(directory), []);
	assert.equal(events.some(event => event[0] === 'upload'), false);
});


test('legacy non-GET method aliases retain POST semantics without changing contract routes', async t => {
	const { app, origin } = await fixture(t);
	for (const method of ['PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
		const response = await app.inject({ method, url: '/api/notes/delete', payload: { i: 'native', noteId: 'note1' } });
		assert.equal(response.statusCode, 204);
	}
	const head = await fetch(`${origin}/api/server-info`, { method: 'HEAD' });
	assert.equal(head.status, 200);
	assert.equal(await head.text(), '');
	assert.equal((await app.inject({ method: 'GET', url: '/api/notes/delete' })).statusCode, 405);
});


test('JSON pilot routes reject oversized unsupported multipart before auth or raw decoding', async t => {
	const { origin, events } = await fixture(t);
	for (const name of ['server-info', 'notes/delete']) {
		const body = new FormData();
		body.set('file', new File(['x'.repeat(2 * 1024 * 1024)], 'oversized.txt'));
		const response = await fetch(`${origin}/api/${name}`, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
		assert.equal(response.status, 415);
		assert.equal(response.headers.get('connection'), 'close');
		assert.equal(await response.text(), '');
	}
	assert.deepEqual(events, []);
});

test('safe and isDefinedError recognize contract-declared errors over the real typed HTTP client', async t => {
	const { origin } = await fixture(t);
	const anonymous = new APIClient({ origin });
	const required = await safe(anonymous.orpc.notes.delete({ noteId: 'note1' }));
	assert.equal(required.isDefined, true);
	assert.equal(isDefinedError(required.error), true);
	assert.equal(required.error.code, 'CREDENTIAL_REQUIRED');
	assert.equal(required.error.data.id, '1384574d-a912-4b81-8601-c7b1c4085df1');
	assert.equal('code' in required.error.data, false);
	const missing = await fixture(t, {}, { notes: {
		getNote: async () => { throw { id: '9725d0ce-ba28-4dde-95a7-2cbb2c15de24' }; },
		isModerator: async () => false, findAuthor: async () => { throw Error('Must not read'); },
		delete: async () => { throw Error('Must not delete'); },
	} });
	const result = await safe(missing.client.orpc.notes.delete({ noteId: 'missing1' }));
	assert.equal(result.isDefined, true);
	assert.equal(result.error.code, 'NO_SUCH_NOTE');
	assert.equal(result.error.data.id, '490be23f-8c1f-4796-819f-94cb4f9d1630');
	await assert.rejects(missing.client.request('notes/delete', { noteId: 'missing1' }), error =>
		error.code === 'NO_SUCH_NOTE' && error.id === result.error.data.id);
});

test('unknown, malformed, wrong-status and wrong-route proxy errors never become defined', async t => {
	const app = Fastify();
	const data = { id: 'proxy-error', kind: 'client' };
	const cases = [
		{ status: 502, body: { error: { code: 'PROXY_ERROR', message: 'proxy', ...data } } },
		{ status: 401, body: { error: { code: 'CREDENTIAL_REQUIRED', message: 'bad id', ...data, id: 1 } } },
		{ status: 401, body: { error: { code: 'CREDENTIAL_REQUIRED', message: 'bad kind', id: 'id1', kind: 'invalid' } } },
		{ status: 401, body: { error: { code: 'CREDENTIAL_REQUIRED', message: 1, ...data } } },
		{ status: 401, body: { error: { code: 'CREDENTIAL_REQUIRED', message: 'bad info', ...data, info: [] } } },
		{ status: 400, body: { error: { code: 'CREDENTIAL_REQUIRED', message: 'wrong status', ...data } } },
		{ status: 413, body: { error: { code: 'MAX_FILE_SIZE_EXCEEDED', message: 'wrong route', ...data } } },
		{ status: 500, body: { error: { code: 'toString', message: 'inherited property', ...data } } },
		{ status: 500, body: { defined: true, code: 'PROXY_ERROR', message: 'forged defined', status: 500, data } },
	];
	let index = 0;
	app.post('/api/notes/delete', (_request, reply) => {
		const current = cases[index++];
		return reply.code(current.status).send(current.body);
	});
	const origin = await app.listen({ host: '127.0.0.1', port: 0 });
	t.after(() => app.close());
	const client = new APIClient({ origin });
	for (const current of cases) {
		const result = await safe(client.orpc.notes.delete({ noteId: 'note1' }));
		assert.equal(result.isSuccess, false);
		assert.equal(result.isDefined, false, JSON.stringify(current));
		assert.equal(isDefinedError(result.error), false, JSON.stringify(current));
	}
});

function rawBodyRequest(origin, name, method, contentType, body, chunked = false) {
	return new Promise((resolve, reject) => {
		const request = httpRequest(`${origin}/api/${name}`, { method, headers: {
			'content-type': contentType, authorization: 'Bearer native', connection: 'close',
			...(chunked ? { 'transfer-encoding': 'chunked' } : { 'content-length': Buffer.byteLength(body) }),
		} }, response => {
			response.resume();
			response.on('end', () => resolve({ status: response.statusCode, headers: response.headers }));
		});
		request.setTimeout(3000, () => request.destroy(new Error('Raw alias fixture timed out')));
		request.on('error', reject);
		request.end(body);
	});
}

test('raw bodyless aliases reject oversized JSON and multipart before context or decoding', async t => {
	const { origin, events } = await fixture(t);
	for (const method of ['HEAD', 'TRACE', 'GET']) {
		for (const name of ['server-info', 'notes/delete']) {
			for (const multipartBody of [false, true]) {
				await t.test(`${method} ${name} ${multipartBody ? 'multipart' : 'JSON'}`, async () => {
					const body = multipartBody ? `--pilot\r\nContent-Disposition: form-data; name="padding"\r\n\r\n${'x'.repeat(1100000)}\r\n--pilot--\r\n`
						: JSON.stringify({ i: 'native', noteId: 'note1', padding: 'x'.repeat(1100000) });
					const result = await rawBodyRequest(origin, name, method,
						multipartBody ? 'multipart/form-data; boundary=pilot' : 'application/json', body);
					assert.equal(result.status, method === 'GET' && name !== 'server-info' ? 405 : multipartBody ? 415 : 413);
					assert.equal(result.headers.connection, 'close');
				});
			}
		}
	}
	assert.deepEqual(events, []);
});

test('bodyless aliases cannot turn small or chunked bodies into a raw adapter reader', async t => {
	const { origin, events } = await fixture(t);
	for (const method of ['HEAD', 'TRACE', 'GET']) {
		for (const chunked of [false, true]) {
			const body = JSON.stringify({ padding: chunked ? 'x'.repeat(1100000) : 'small' });
			const result = await rawBodyRequest(origin, 'server-info', method, 'application/json', body, chunked);
			assert.equal(result.status, 400);
			assert.equal(result.headers.connection, 'close');
		}
	}
	assert.deepEqual(events, []);
});

test('media rejection is parser-independent and empty bodyless aliases retain their semantics', async t => {
	const { origin, events } = await fixture(t);
	for (const method of ['HEAD', 'TRACE', 'GET']) {
		for (const contentType of ['text/plain', 'application/octet-stream', 'multipart/form-data; boundary=pilot']) {
			const result = await rawBodyRequest(origin, 'server-info', method, contentType, '');
			assert.equal(result.status, 415);
		}
	}
	assert.deepEqual(events, []);
	for (const method of ['HEAD', 'TRACE']) {
		assert.equal((await rawBodyRequest(origin, 'server-info', method, 'application/json', '')).status, 200);
		assert.equal((await rawBodyRequest(origin, 'notes/delete', method, 'application/json', '')).status, 400);
		assert.equal((await rawBodyRequest(origin, 'drive/files/create', method, 'multipart/form-data; boundary=pilot', 'small')).status, 400);
	}
	assert.equal(events.some(event => event[0] === 'delete' || event[0] === 'upload'), false);
});

test('defined error data is validated and normalized by the shared portable contract schema', async t => {
	const app = Fastify();
	app.post('/api/notes/delete', (_request, reply) => reply.code(401).send({ error: {
		code: 'CREDENTIAL_REQUIRED', message: 'Credential required.', id: 'contract-error', kind: 'client',
		info: { remaining: 0 }, future: 'ignored by the declared error DTO',
	} }));
	const origin = await app.listen({ host: '127.0.0.1', port: 0 });
	t.after(() => app.close());
	const client = new APIClient({ origin });
	const result = await safe(client.orpc.notes.delete({ noteId: 'note1' }));
	assert.equal(result.isDefined, true);
	assert.equal(isDefinedError(result.error), true);
	assert.deepEqual(result.error.data, { id: 'contract-error', kind: 'client', info: { remaining: 0 } });
});


test('cohort SDK facade, direct client and public GET aliases use the native router', async t => {
	const { app, client, events } = await fixture(t);
	assert.deepEqual(await client.request('ping', {}), { pong: 123 });
	assert.deepEqual(await client.orpc.instance.ping(), { pong: 123 });
	for (const [url, expected] of [['get-online-users-count', { count: 7 }], ['emojis', { emojis: [] }]]) {
		const response = await app.inject({ method: 'GET', url: `/api/${url}` });
		assert.equal(response.statusCode, 200);
		assert.deepEqual(response.json(), expected);
	}
	assert.deepEqual(await client.request('charts/notes', { span: 'day' }), chartOutput);
	const chart = await app.inject({ method: 'GET', url: '/api/charts/notes?span=day&limit=2&offset=null&unused=true' });
	assert.equal(chart.statusCode, 200);
	assert.deepEqual(events.filter(event => event[0] === 'chart').at(-1)[1], { span: 'day', limit: 2, offset: null });
	assert.equal(chart.headers['cache-control'], 'public, max-age=3600');
	const bad = await app.inject({ method: 'GET', url: '/api/charts/notes?span=day&limit=01' });
	assert.equal(bad.statusCode, 400);
	assert.equal(bad.json().error.id, '0b5f1631-7c1a-41a6-b399-cce335f34d85');
	assert.equal(await client.request('notifications/flush', {}), null);
	assert.equal(await client.orpc.notifications.flush(), undefined);
	assert.equal(events.filter(event => event[0] === 'flush').length, 2);
});

test('external generated references resolve after component hoisting and GET schemas retain fields', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'cohort', apiUrl: 'https://example.com/api' });
	let references = 0;
	function visit(value) {
		if (!value || typeof value !== 'object') return;
		assert.equal('$defs' in value, false);
		assert.equal('optional' in value, false);
		if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
			const resolved = value.$ref.slice(2).split('/').reduce((object, key) => object?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], spec);
			assert.notEqual(resolved, undefined, value.$ref);
			references++;
		}
		for (const child of Object.values(value)) visit(child);
	}
	visit(spec);
	assert.ok(references > 0);
	assert.ok(spec.paths['/charts/notes'].get.parameters.some(parameter => parameter.name === 'limit'));
});


test('nullable success becomes empty204 while finite nonnull results retain JSON200 without output validation', async t => {
	const { app, client } = await fixture(t);
	for (const [name, absent, present, expected] of [
		['endpoint', { endpoint: 'unknown-name' }, { endpoint: 'ping' }, { params: [] }],
		['sw/show-registration', { endpoint: 'absent' }, { endpoint: 'found' }, { userId: actor.id, endpoint: 'found', sendReadMessage: false }],
	]) {
		const empty = await app.inject({ method: 'POST', url: `/api/${name}`, payload: { ...absent, i: 'session' } });
		assert.equal(empty.statusCode, 204);
		assert.equal(empty.body, '');
		assert.equal(await client.request(name, absent, 'session'), null);
		const populated = await app.inject({ method: 'POST', url: `/api/${name}`, payload: { ...present, i: 'session' } });
		assert.equal(populated.statusCode, 200);
		assert.deepEqual(populated.json(), expected);
		assert.deepEqual(await client.request(name, present, 'session'), expected);
	}
	assert.equal(await client.orpc.instance.endpoint({ endpoint: 'unknown-name' }), null);
	const extended = await fixture(t, {}, { notifications: { findSubscription: async () => ({ userId: actor.id, endpoint: 'x', sendReadMessage: false, accessKey: 'secret' }) } });
	const validate = t.mock.method(extended.router.notifications.showRegistration['~orpc'].outputSchema['~standard'], 'validate', () => { throw Error('Output validation must be disabled'); });
	const projected = await extended.app.inject({ method: 'POST', url: '/api/sw/show-registration', payload: { endpoint: 'x', i: 'session' } });
	assert.equal(projected.statusCode, 200);
	assert.deepEqual(projected.json(), { userId: actor.id, endpoint: 'x', sendReadMessage: false });
	assert.equal(validate.mock.callCount(), 0);
});

test('push registration reads live settings for both new and existing subscriptions', async t => {
	const settings = { swPublicKey: null };
	let existing = null;
	const subscriptions = {
		generateId: () => 'subscription1', getSwPublicKey: () => settings.swPublicKey,
		isValidEndpoint: () => true,
		findSubscription: async () => existing,
		insertSubscription: async record => { existing = record; },
		refreshSubscriptionCache: () => {},
	};
	const { app, client } = await fixture(t, {}, { notifications: subscriptions });
	const payload = { endpoint: 'https://push.example.test', auth: 'auth', publickey: 'client-key' };
	assert.equal((await client.request('sw/register', payload, 'session')).key, null);
	settings.swPublicKey = 'hot-updated-key';
	const found = await app.inject({ method: 'POST', url: '/api/sw/register', payload: { ...payload, i: 'session' } });
	assert.equal(found.statusCode, 200);
	assert.equal(found.json().state, 'already-subscribed');
	assert.equal(found.json().key, 'hot-updated-key');
	existing = null;
	assert.equal((await client.request('sw/register', payload, 'session')).key, 'hot-updated-key');
});

test('expanded native cohorts execute business handlers with defaults, public actors and protected writes', async t => {
	const { app, client, events } = await fixture(t);
	for (const [name, input, expected] of [
		['notes/translate', { noteId: 'note1', targetLang: 'en' }, null],
		['notes/drafts/count', {}, 3], ['notes/global-timeline', {}, []],
		['notes/search', { query: '😀' }, []], ['users/achievements', { userId: 'bob' }, []],
		['following/update-all', { withReplies: false }, null], ['gallery/posts', {}, []],
	]) assert.deepEqual(await client.request(name, { ...input, extra: 'stripped' }, 'session'), expected);
	assert.deepEqual(events.find(event => event[0] === 'draftsQuery' && event[1] === 'where').slice(2), ['drafts.userId = :meId', { meId: actor.id }]);
	assert.deepEqual(events.find(event => event[0] === 'timelineQuery' && event[1] === 'limit'), ['timelineQuery', 'limit', 10]);
	assert.equal(events.some(event => event[0] === 'timelineQuery' && event[1] === 'andWhere' && event[2] === 'note.fileIds != \'{}\''), false);
	const search = events.find(event => event[0] === 'search');
	assert.equal(search[1], '😀');
	assert.equal(search[2], actor);
	assert.equal(search[3].userId, null);
	assert.equal(search[3].channelId, null);
	assert.equal(search[4].limit, 10);
	assert.deepEqual(events.find(event => event[0] === 'galleryQuery' && event[1] === 'limit'), ['galleryQuery', 'limit', 10]);
	assert.deepEqual(events.find(event => event[0] === 'following').slice(1), [{ followerId: actor.id }, { notify: undefined, withReplies: false }]);
	const anonymous = await app.inject({ method: 'POST', url: '/api/users/achievements', payload: { userId: 'bob' } });
	assert.equal(anonymous.statusCode, 200);
	assert.deepEqual(events.filter(event => event[0] === 'profile').at(-1), ['profile', { userId: 'bob' }]);
	assert.equal(events.filter(event => event[0] === 'credential').at(-1)[1], undefined);
	const followingWrites = events.filter(event => event[0] === 'following').length;
	const denied = await app.inject({ method: 'POST', url: '/api/following/update-all', payload: { i: 'restricted' } });
	assert.equal(denied.statusCode, 403);
	assert.equal(denied.json().error.code, 'PERMISSION_DENIED');
	assert.equal(events.filter(event => event[0] === 'following').length, followingWrites);
	await assert.rejects(client.request('notes/global-timeline', { limit: 101 }), error => error.code === 'INVALID_PARAM');
	const counts = await fixture(t, {}, { notes: { noteDraftsRepository: { createQueryBuilder: () => ({ where() { return this; }, getCount: async () => 5 }) } } });
	const validate = t.mock.method(counts.router.notes.notesDraftsCount['~orpc'].outputSchema['~standard'], 'validate', () => { throw Error('Output validation must be disabled'); });
	const counted = await counts.app.inject({ method: 'POST', url: '/api/notes/drafts/count', payload: { i: 'session' } });
	assert.equal(counted.statusCode, 200);
	assert.equal(counted.json(), 5);
	assert.equal(validate.mock.callCount(), 0);
});
