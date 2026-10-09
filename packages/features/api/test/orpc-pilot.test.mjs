/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { mkdtemp, readdir, rm, access, appendFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRouterClient } from '@orpc/server';
import { createApiRouter, createServerInfoService, createDeleteNote, createFileService, withStagedUpload, requestRoutes } from '../../../backend/built/features/api/pilot.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const serverInfo = { machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } };
const file = {
	id: 'file1', createdAt: '2026-10-08T00:00:00.000Z', name: 'image.png', type: 'image/png',
	md5: 'hash', size: 1, isSensitive: false, blurhash: null, properties: {}, url: 'https://example.com/file',
	thumbnailUrl: null, comment: null, folderId: null, folder: null, userId: null, user: null,
};

function fixture(overrides = {}) {
	const events = [];
	const uploadFile = new File(['bytes'], 'image.png');
	const context = {
		credential: 'native', ip: '192.0.2.1', headers: {}, upload: { path: '/tmp/upload', name: 'image.png', file: uploadFile },
		services: {
			authenticate: async () => { events.push('authenticate'); return [actor, null]; },
			logIp: () => events.push('logIp'),
			limitActor: principal => principal?.id ?? null,
			rateLimitFactor: async () => 1,
			limit: async limit => { events.push(['limit', limit]); return null; },
			serverInfo: async () => serverInfo,
			deleteNote: async () => { events.push('delete'); },
			createFile: async input => { events.push(['create', input]); return file; },
			...overrides,
		},
	};
	const client = createRouterClient(createApiRouter(), { context });
	return { context, events, client, upload: input => client.drive.files.create({ file: uploadFile, ...input }) };
}

test('public server info keeps privacy defaults and reads current settings', async () => {
	let reads = 0;
	let enabled = false;
	const service = createServerInfoService({ enabled: () => enabled, read: async () => { reads++; return serverInfo; } });
	const { client } = fixture({ authenticate: async () => [null, null], serverInfo: service });
	assert.deepEqual(await client.instance.serverInfo({ extra: 'accepted' }), serverInfo);
	assert.equal(reads, 0);
	enabled = true;
	assert.deepEqual(await client.instance.serverInfoGet({}), serverInfo);
	assert.equal(reads, 1);
});

test('credential and rate policy run before invalid input', async () => {
	const { client, events } = fixture({ authenticate: async () => [null, null] });
	await assert.rejects(client.notes.delete({ noteId: false }), error =>
		error.code === 'CREDENTIAL_REQUIRED' && error.status === 401
		&& error.data.id === '1384574d-a912-4b81-8601-c7b1c4085df1');
	assert.equal(events.includes('delete'), false);
});

test('rate rejection precedes credential enforcement and preserves limit info', async () => {
	const { client } = fixture({
		authenticate: async () => [null, null], limitActor: () => 'iphash',
		limit: async () => ({ info: { resetMs: 123 } }),
	});
	await assert.rejects(client.notes.delete({}), error => error.code === 'RATE_LIMIT_EXCEEDED'
		&& error.status === 429 && error.data.info.resetMs === 123);
});

test('scope and suspension deny writes before the handler', async () => {
	for (const [principal, token, code] of [
		[actor, { permission: [] }, 'PERMISSION_DENIED'],
		[{ ...actor, isSuspended: true }, null, 'YOUR_ACCOUNT_SUSPENDED'],
	]) {
		const { client, events } = fixture({ authenticate: async () => [principal, token] });
		await assert.rejects(client.notes.delete({ noteId: 'note1' }), error => error.code === code);
		assert.equal(events.includes('delete'), false);
	}
});

test('authenticated delete validates input, ignores unused extras and returns void', async () => {
	const { client, events } = fixture();
	await assert.rejects(client.notes.delete({ noteId: 'bad!' }), error => error.code === 'INVALID_PARAM');
	assert.equal(events.includes('delete'), false);
	assert.equal(await client.notes.delete({ noteId: 'note1', extra: true }), undefined);
	assert.equal(events.filter(event => event === 'delete').length, 1);
});

test('upload defaults, nullability and Unicode code-point limit', async () => {
	const { events, upload } = fixture();
	assert.deepEqual(await upload({ comment: '😀'.repeat(512), extra: true }), file);
	const input = events.find(event => Array.isArray(event) && event[0] === 'create')[1];
	assert.equal(input.comment.length, 1024);
	assert.equal(input.folderId, null);
	assert.equal(input.name, null);
	assert.equal(input.force, false);
	assert.equal(input.isSensitive, false);
	assert.equal(Object.hasOwn(input, 'extra'), false);
	await assert.rejects(upload({ comment: '😀'.repeat(513) }), error => error.code === 'INVALID_PARAM');
	await assert.rejects(upload({ folderId: '' }), error => error.code === 'INVALID_PARAM');
});

test('moved accounts and missing upload resources reject before field validation', async () => {
	const moved = fixture({ authenticate: async () => [{ ...actor, movedToUri: 'https://example.com/user' }, null] });
	await assert.rejects(moved.client.drive.files.create({}), error => error.code === 'YOUR_ACCOUNT_MOVED');
	const missing = fixture();
	delete missing.context.upload;
	await assert.rejects(missing.client.drive.files.create({ force: 'wrong' }), error => error.code === 'FILE_REQUIRED');
});

test('successful outputs are validated and unknown response fields are rejected', async () => {
	const wrong = fixture({ serverInfo: async () => ({ ...serverInfo, secret: true }) });
	await assert.rejects(wrong.client.instance.serverInfo({}), error => error.code === 'INTERNAL_ERROR');
	const infinite = fixture({ serverInfo: async () => ({ ...serverInfo, mem: { total: Infinity } }) });
	await assert.rejects(infinite.client.instance.serverInfo({}), error => error.code === 'INTERNAL_ERROR');
	const invalid = fixture({ createFile: async () => ({ ...file, createdAt: new Date() }) });
	await assert.rejects(invalid.upload({}), error => error.code === 'INTERNAL_ERROR');
});

test('note service preserves owner/moderator authorization and missing-note UUID', async () => {
	const events = [];
	const service = createDeleteNote({
		getNote: async () => ({ userId: 'bob' }), isModerator: async () => false,
		findAuthor: async id => ({ id }), delete: async (...args) => events.push(args),
	});
	await assert.rejects(service('note1', actor), error => error.code === 'ACCESS_DENIED'
		&& error.data.id === 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9');
	assert.equal(events.length, 0);
	const missing = createDeleteNote({
		getNote: async () => { throw Object.assign(new Error('Missing note'), { id: '9725d0ce-ba28-4dde-95a7-2cbb2c15de24' }); },
	});
	await assert.rejects(missing('note1', actor), error => error.code === 'NO_SUCH_NOTE'
		&& error.data.id === '490be23f-8c1f-4796-819f-94cb4f9d1630');
});

test('upload service trims names, controls IP logging and intentionally omits undefined properties', async () => {
	let options;
	const service = createFileService({
		validateFileName: () => true, enableIpLogging: () => false,
		addFile: async value => { options = value; return {}; },
		pack: async () => ({ ...file, properties: { width: undefined, height: 1 } }), logError: () => {},
	});
	const result = await service({ name: ' blob ', comment: null, folderId: null, force: false, isSensitive: false },
		actor, { path: '/tmp/file', name: 'fallback' }, { ip: '192.0.2.1', headers: {} });
	assert.equal(options.name, null);
	assert.equal(options.requestIp, null);
	assert.deepEqual(result.properties, { height: 1 });
});

function multipartRequest(fields = [], content = 'bytes') {
	return { raw: new EventEmitter(), parts: async function* () {
		for (const [fieldname, value] of fields) yield { type: 'field', fieldname, value };
		yield { type: 'file', filename: 'image.png', mimetype: 'image/png', file: Readable.from([content]) };
	} };
}

test('wire File must match the trusted upload resource', async () => {
	const { client } = fixture();
	await assert.rejects(client.drive.files.create({ file: new Blob(['untrusted']) }), error => error.code === 'INTERNAL_ERROR');
});

test('multipart booleans decode after scope checks and validate through the public contract', async () => {
	const { upload, events } = fixture();
	await upload({ force: 'true', isSensitive: 'false' });
	const input = events.find(event => Array.isArray(event) && event[0] === 'create')[1];
	assert.equal(input.force, true);
	assert.equal(input.isSensitive, false);
	await assert.rejects(upload({ force: '1' }), error => error.code === 'INVALID_PARAM');
	const denied = fixture({ authenticate: async () => [actor, { permission: [] }] });
	await assert.rejects(denied.upload({ force: 'malformed' }), error => error.code === 'PERMISSION_DENIED');
});

test('parallel staged uploads keep files alive for consumers and clean every resource', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-pilot-test-'));
	const paths = new Set();
	try {
		await Promise.all(Array.from({ length: 5 }, (_, index) => withStagedUpload(multipartRequest([], `bytes${index}`),
			{ maxFileSize: 1024, directory }, async (body, upload) => {
				paths.add(upload.path);
				assert.equal(body.file, upload.file);
				assert.equal(await body.file.text(), `bytes${index}`);
				assert.equal(JSON.stringify(body).includes(upload.path), false);
				await new Promise(resolve => setImmediate(resolve));
				await access(upload.path);
			})));
		assert.equal(paths.size, 5);
		assert.deepEqual(await readdir(directory), []);
	} finally { await rm(directory, { recursive: true, force: true }); }
});

test('staging cleans up after input, business and output failures', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-pilot-test-'));
	try {
		for (const services of [
			{},
			{ createFile: async () => { throw Error('business failure'); } },
			{ createFile: async () => ({ ...file, secret: true }) },
		]) {
			const { context, client } = fixture(services);
			const fields = Object.keys(services).length === 0 ? [['force', '1']] : [];
			await assert.rejects(withStagedUpload(multipartRequest(fields), { maxFileSize: 1024, directory }, async (body, upload) => {
				context.upload = upload;
				await client.drive.files.create(body);
			}));
			assert.deepEqual(await readdir(directory), []);
		}
	} finally { await rm(directory, { recursive: true, force: true }); }
});

test('premature removal/mutation rejects native File reads without leaking staged resources', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-pilot-test-'));
	try {
		for (const mutate of [path => unlink(path), path => appendFile(path, 'changed')]) {
			await withStagedUpload(multipartRequest(), { maxFileSize: 1024, directory }, async (body, upload) => {
				await mutate(upload.path);
				await assert.rejects(body.file.text(), { name: 'NotReadableError' });
			});
			assert.deepEqual(await readdir(directory), []);
		}
	} finally { await rm(directory, { recursive: true, force: true }); }
});

test('contract alias validation rejects wrong paths/methods and duplicate names', () => {
	const leaf = { '~orpc': { errorMap: {}, meta: { requestName: 'notes/delete' }, route: { method: 'POST', path: '/notes/delete' } } };
	assert.deepEqual(requestRoutes({ notes: { delete: leaf } }), [{ name: 'notes/delete', path: ['notes', 'delete'], httpPath: '/notes/delete', allowGet: false, multipart: false }]);
	assert.throws(() => requestRoutes({ first: leaf, second: leaf }), /Duplicate/);
	assert.throws(() => requestRoutes({ bad: { '~orpc': { ...leaf['~orpc'], route: { method: 'GET', path: '/notes/delete' } } } }), /method\/path/);
	assert.throws(() => requestRoutes({ bad: { '~orpc': { ...leaf['~orpc'], route: { method: 'POST', path: '/wrong' } } } }), /method\/path/);
});

test('canceled and truncated uploads clean staging without invoking consumers', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-pilot-test-'));
	let consumed = false;
	try {
		for (const mode of ['canceled', 'truncated', 'field']) {
			const request = multipartRequest();
			request.parts = async function* () {
				if (mode === 'field') {
					yield { type: 'field', fieldname: 'comment', value: 'x', valueTruncated: true };
					return;
				}
				const file = mode === 'canceled' ? new Readable({ read() {
					setImmediate(() => request.raw.emit('aborted'));
				} }) : Readable.from(['bytes']);
				file.truncated = mode === 'truncated';
				yield { type: 'file', filename: 'file', mimetype: 'text/plain', file };
			};
			await assert.rejects(withStagedUpload(request, { maxFileSize: 1024, directory }, async () => { consumed = true; }),
				error => error.status === (mode === 'truncated' ? 413 : 400));
			assert.equal(consumed, false);
			assert.equal(request.raw.listenerCount('aborted'), 0);
			assert.deepEqual(await readdir(directory), []);
		}
	} finally { await rm(directory, { recursive: true, force: true }); }
});

test('already-aborted and staging-init aborts never start the multipart iterator and clean up', { timeout: 2000 }, async () => {
	const directory = await mkdtemp(join(tmpdir(), 'misskey-pilot-init-abort-'));
	try {
		for (const mode of ['already-aborted', 'during-init']) {
			const request = multipartRequest();
			let parserStarted = false;
			request.parts = () => { parserStarted = true; throw Error('Parser must not start after an early abort'); };
			if (mode === 'already-aborted') request.raw.aborted = true;
			else {
				const once = request.raw.once.bind(request.raw);
				request.raw.once = (name, listener) => {
					const result = once(name, listener);
					// A microtask fires while the first filesystem await is unresolved.
					queueMicrotask(() => { request.raw.aborted = true; request.raw.emit('aborted'); });
					return result;
				};
			}
			await assert.rejects(withStagedUpload(request, { maxFileSize: 1024, directory }, async () => { throw Error('Must not consume'); }), error => error.status === 400);
			assert.equal(parserStarted, false);
			assert.equal(request.raw.listenerCount('aborted'), 0);
			assert.deepEqual(await readdir(directory), []);
		}
	} finally { await rm(directory, { recursive: true, force: true }); }
});

test('native moderation checks precede malformed fields and preserve root bypass', async () => {
	const unauthenticated = fixture({ authenticate: async () => [null, null] });
	await assert.rejects(unauthenticated.client.instance.adCreate({}), error => error.code === 'CREDENTIAL_REQUIRED');
	const denied = fixture();
	denied.context.authorization = { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false };
	await assert.rejects(denied.client.instance.adCreate({}), error => error.code === 'ROLE_PERMISSION_DENIED'
		&& error.data.id === 'd33d5333-db36-423d-a8f9-1a2b9549da41');
	let rolesRead = false;
	denied.context.authorization = { rootUserId: () => actor.id, roles: async () => { rolesRead = true; return []; }, policyAllowed: async () => false };
	await assert.rejects(denied.client.instance.adCreate({}), error => error.code === 'INVALID_PARAM');
	assert.equal(rolesRead, false);
});

test('native public defaults, GET scalar decoding and output validation execute directly', async () => {
	const { client, context } = fixture({ authenticate: async () => [null, null] });
	let parsed;
	const side = { total: [], inc: [], dec: [], diffs: { normal: [], reply: [], renote: [], withFile: [] } };
	context.operations = { statistics: {
		stats: async () => ({ notesCount: 0, originalNotesCount: 0, usersCount: 0, originalUsersCount: 0,
			reactionsCount: 0, instances: 0, driveUsageLocal: 0, driveUsageRemote: 0 }),
		notes: async input => { parsed = input; return { local: side, remote: side }; },
	} };
	assert.equal((await client.statistics.stats(undefined)).notesCount, 0);
	await assert.rejects(client.statistics.stats([]), error => error.code === 'INVALID_PARAM');
	await client.statistics.notesGet({ span: 'day', limit: '2', offset: 'null', extra: true });
	assert.deepEqual(parsed, { span: 'day', limit: 2, offset: null });
	for (const limit of ['01', '+1', '0x10']) await assert.rejects(client.statistics.notesGet({ span: 'day', limit }),
		error => error.code === 'INVALID_PARAM' && error.data.id === '0b5f1631-7c1a-41a6-b399-cce335f34d85');
	context.operations.statistics.stats = async () => ({ secret: true });
	await assert.rejects(client.statistics.stats({}), error => error.code === 'INTERNAL_ERROR');
});
