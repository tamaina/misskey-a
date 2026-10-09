/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createRouterClient } from '@orpc/server';
const backendRequire = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { OpenAPIHandler } = await import(backendRequire.resolve('@orpc/openapi/fetch'));
import { createEmojisRouter } from '../../../backend/built/features/emojis/backend.js';

const actor = { id: 'admin1', isSuspended: false, movedToUri: null };
const image = { id: 'file1', type: 'image/png', url: 'https://example.test/original.png', webpublicUrl: null, webpublicType: null };

function context() {
	return {
		credential: 'session', ip: '192.0.2.1', headers: {},
		services: {
			authenticate: async () => [actor, null], limitActor: principal => principal?.id ?? null,
			rateLimitFactor: async () => 1, limit: async () => null,
		},
		authorization: { rootUserId: () => actor.id },
	};
}

function createEmojisClient(deps) {
return createRouterClient(createEmojisRouter(deps), { context: context() });
}

function deferred() {
	let resolve;
	const promise = new Promise(done => { resolve = done; });
	return { promise, resolve };
}

test('emoji add rejects missing files, duplicate names and unsupported images before writing', async t => {
	for (const scenario of [
		{ file: null, duplicate: false, code: 'NO_SUCH_FILE', id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf', events: ['file'] },
		// Name collisions retain priority even when the supplied file type is unsupported.
		{ file: { ...image, type: 'application/zip' }, duplicate: true, code: 'DUPLICATE_NAME', id: 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975', events: ['file', 'duplicate'] },
		{ file: { ...image, type: 'application/zip' }, duplicate: false, code: 'UNSUPPORTED_FILE_TYPE', id: 'f7599d96-8750-af68-1633-9575d625c1a7', events: ['file', 'duplicate'] },
	]) await t.test(scenario.code, async () => {
		const events = [];
		const operations = createEmojisClient({
			driveFilesRepository: { findOneBy: async () => { events.push('file'); return scenario.file; } },
			customEmojiService: {
				checkDuplicate: async () => { events.push('duplicate'); return scenario.duplicate; },
				add: async () => { assert.fail('Rejected emoji must not be written'); },
			},
		});
		await assert.rejects(operations.add({ name: 'smile', fileId: 'file1' }), error =>
			error.code === scenario.code && error.status === 400 && error.data.id === scenario.id);
		assert.deepEqual(events, scenario.events);
	});
});

test('native emoji update retains an ID-based rename and nullable patch fields after validation', async () => {
	const calls = [];
	const deps = {
		customEmojiService: { update: async (values, principal) => { calls.push({ values, principal }); return null; } },
	};
	const client = createRouterClient(createEmojisRouter(deps), { context: context() });
	assert.equal(await client.update({ id: 'emoji1', name: 'new_name', category: null, license: null, aliases: [] }), undefined);
	assert.equal(calls[0].principal, actor);
	assert.equal(calls[0].values.id, 'emoji1');
	assert.equal(calls[0].values.name, 'new_name');
	assert.equal(calls[0].values.category, null);
	assert.equal(calls[0].values.license, null);
	assert.deepEqual(calls[0].values.aliases, []);
	assert.equal(calls[0].values.originalUrl, undefined);

	await client.update({ name: 'existing_name' });
	assert.equal(Object.hasOwn(calls[1].values, 'id'), false);
	assert.equal(calls[1].values.name, 'existing_name');
	assert.equal(calls[1].values.category, undefined);
	await assert.rejects(client.update({ id: 'emoji1', name: 42 }), error => error.code === 'BAD_REQUEST' && error.message === 'Input validation failed');
	assert.equal(calls.length, 2);
});

test('emoji update maps service conflicts to route-specific errors and UUIDs', async t => {
	for (const [code, id] of [
		['NO_SUCH_EMOJI', '684dec9d-a8c2-4364-9aa8-456c49cb1dc8'],
		['SAME_NAME_EMOJI_EXISTS', '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8'],
	]) await t.test(code, async () => {
		const operations = createEmojisClient({ customEmojiService: { update: async () => code } });
		await assert.rejects(operations.update({ id: 'emoji1', name: 'rename' }), error =>
			error.code === code && error.status === 400 && error.data.id === id);
	});
});

test('replacement file lookup rejects a missing file before updating the emoji', async () => {
	const operations = createEmojisClient({
		driveFilesRepository: { findOneBy: async () => null },
		customEmojiService: { update: async () => { assert.fail('Missing replacement file must not update the emoji'); } },
	});
	await assert.rejects(operations.update({ id: 'emoji1', fileId: 'missing' }), error =>
		error.code === 'NO_SUCH_FILE' && error.data.id === '14fb9fd9-0731-4e2f-aeb9-f09e4740333d');
});

test('emoji queue HTTP routes await enqueue before responding with an empty 204', { timeout: 5000 }, async t => {
	for (const [name, method, input] of [
		['admin/emoji/import-zip', 'createImportCustomEmojisJob', { fileId: 'archive1' }],
		['export-custom-emojis', 'createExportCustomEmojisJob', {}],
	]) await t.test(name, async () => {
		const started = deferred();
		const completion = deferred();
		const calls = [];
		const deps = { queueService: {
			[method]: (...args) => { calls.push(args); started.resolve(); return completion.promise; },
		} };
		const handler = new OpenAPIHandler(createEmojisRouter(deps));
		let settled = false;
		const pending = handler.handle(new Request(`https://example.test/api/${name}`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
		}), { prefix: '/api', context: context() }).then(result => { settled = true; return result; });
		await Promise.race([started.promise, pending.then(() => { throw new Error('HTTP response completed before queue insertion started'); })]);
		try {
			await new Promise(resolve => setImmediate(resolve));
			assert.equal(settled, false, 'The HTTP response must wait for successful queue insertion');
			assert.deepEqual(calls, [method === 'createImportCustomEmojisJob' ? [actor, 'archive1'] : [actor]]);
		} finally {
			completion.resolve({ id: 'job1' });
		}
		const result = await pending;
		assert.equal(result.matched, true);
		assert.equal(result.response.status, 204);
		assert.equal(await result.response.text(), '');
	});
});

test('failed emoji queue insertion rejects the application operation instead of reporting success', async () => {
	const failure = new Error('Queue unavailable');
	const operations = createEmojisClient({ queueService: {
		createImportCustomEmojisJob: async () => { throw failure; },
		createExportCustomEmojisJob: async () => { throw failure; },
	} });
	await assert.rejects(operations.importZip({ fileId: 'archive1' }), error => error === failure);
	await assert.rejects(operations.exportCustomEmojis({}), error => error === failure);
});
