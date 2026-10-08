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
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { APIClient } from '../../misskey-js/built/api.js';
import { createApiRouter, registerPilotHttp, bodyCredential, misskeyErrorBody, genPilotOpenapiSpec, getPilotEndpointDescriptors } from '../built/features/api/pilot.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const stats = { machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } };
const output = { id: 'file1', createdAt: '2026-10-08T00:00:00.000Z', name: 'file.txt', type: 'text/plain',
	md5: 'hash', size: 5, isSensitive: false, blurhash: null, properties: {}, url: 'https://example.com/file',
	thumbnailUrl: null, comment: null, folderId: null, folder: null, userId: null, user: null };

async function fixture(t, overrides = {}) {
	const events = [];
	const app = Fastify();
	const handler = new OpenAPIHandler(createApiRouter(), { customErrorResponseBodyEncoder: misskeyErrorBody });
	await app.register(async api => {
		await api.register(multipart, { limits: { fileSize: 1024, files: 1 } });
		registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(),
			context: (request, _reply, _name, upload) => ({
				credential: bodyCredential(request), ip: request.ip, headers: request.headers, upload,
				services: {
					authenticate: async credential => {
						events.push(['credential', credential]);
						return credential ? [actor, { permission: credential === 'restricted' ? [] : ['write:notes', 'write:drive'] }] : [null, null];
					},
					logIp: () => {}, limitActor: principal => principal?.id ?? 'ip',
					rateLimitFactor: async () => 1, limit: async () => null,
					serverInfo: async () => stats, deleteNote: async id => { events.push(['delete', id]); },
					createFile: async (input, _actor, resource) => {
						assert.equal(input.file, resource.file);
						events.push(['upload', input, resource.path, await input.file.text()]);
						return output;
					}, ...overrides,
				},
			}),
		});
	}, { prefix: '/api' });
	const origin = await app.listen({ host: '127.0.0.1', port: 0 });
	t.after(() => app.close());
	return { app, events, origin, client: new APIClient({ origin, credential: 'native' }) };
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
	assert.deepEqual(await client.request('drive/files/create', { file: new File(['bytes'], 'file.txt', { type: 'text/plain' }), comment: '😀'.repeat(512) }), output);
	assert.deepEqual(await client.orpc.drive.files.create({ file: new File(['bytes'], 'file.txt'), force: true }), output);
	const uploads = events.filter(event => event[0] === 'upload');
	assert.equal(uploads.length, 2);
	assert.equal(uploads[0][1].force, false);
	assert.equal(uploads[0][1].folderId, null);
	assert.equal(uploads[0][3], 'bytes');
	assert.equal(uploads[1][1].force, true);
	for (const upload of uploads) await assert.rejects(access(upload[2]), { code: 'ENOENT' });
	await assert.rejects(client.request('drive/files/create', { file: new File(['bytes'], 'file.txt'), comment: '😀'.repeat(513) }), error => error.code === 'INVALID_PARAM');
});

test('HTTP upload limit and finite output validation remain enabled', async t => {
	const { origin, app, events } = await fixture(t, { serverInfo: async () => ({ ...stats, secret: true }) });
	const invalid = await app.inject({ method: 'POST', url: '/api/server-info', payload: {} });
	assert.equal(invalid.statusCode, 500);
	assert.equal(invalid.json().error.code, 'INTERNAL_ERROR');
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
	assert.equal(upload.responses['400'].content['application/json'].schema.properties.error.anyOf[0].properties.code.const, 'INVALID_PARAM');
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
	assert.deepEqual(descriptors.map(item => item.name).sort(), ['drive/files/create', 'notes/delete', 'server-info']);
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
