/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';

// Opt-in only: an owned, freshly migrated full application, never an existing instance.
const directory = process.env.FUKUSHU_E2E_RUN_DIR;
test('real authentication, Drive and recoverable material maintenance', { skip: !directory, timeout: 120_000 }, async t => {
	assert.ok(isAbsolute(directory), 'An absolute owned run directory is required');
	assert.equal(await realpath(directory), resolve(directory), 'Run directory must not contain symlinks');
	const directoryStat = await lstat(directory);
	assert.ok(directoryStat.isDirectory() && directoryStat.uid === process.getuid() && (directoryStat.mode & 0o077) === 0, 'Run directory must be owned and private');
	for (const name of ['config.json', 'credentials.json', '.owner', 'ready.json']) {
		const info = await lstat(join(directory, name));
		assert.ok(info.isFile() && !info.isSymbolicLink() && info.uid === process.getuid(), `Expected owned ${name}`);
		if (name === 'config.json' || name === 'credentials.json') assert.equal(info.mode & 0o077, 0, `${name} must be private`);
	}
	const readPrivateJson = async name => {
		try { return JSON.parse(await readFile(join(directory, name), 'utf8')); } catch {
			throw new Error(`Cannot read valid ${name}`);
		}
	};
	const config = await readPrivateJson('config.json');
	const owner = (await readFile(join(directory, '.owner'), 'utf8')).trim();
	assert.match(owner, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	assert.equal(config.url, 'http://127.0.0.1:3220');
	assert.equal(config.db.db, 'fukushu_e2e');
	assert.equal(config.db.host, join(directory, 'p'));
	assert.equal(config.redis.path, join(directory, 'r/r.sock'));
	assert.equal(config.redis.prefix, `fukushu-e2e-${owner}`);
	assert.equal(config.socket, join(directory, 'a.sock'));
	const ready = await readPrivateJson('ready.json');
	assert.equal(ready.url, config.url);
	const origin = config.url;
	const credentialsPath = join(directory, 'credentials.json');
	const credentials = await readPrivateJson('credentials.json');
	assert.ok(!Object.hasOwn(credentials, 'alice') && !Object.hasOwn(credentials, 'bob'), 'Use a fresh owned application for each test run');
	assert.ok(typeof credentials.setupPassword === 'string' && credentials.setupPassword.length > 0, 'Setup credential is required');
	// Never include response bodies or credentials in parsing/assertion errors.
	const readResponse = async response => {
		const text = await response.text();
		if (!text) return { status: response.status, body: null };
		try { return { status: response.status, body: JSON.parse(text) }; } catch {
			throw new Error(`HTTP ${response.status}: expected JSON response`);
		}
	};
	const call = async (endpoint, input = {}, token, bearer = false) => {
		const response = await fetch(`${origin}/api/${endpoint}`, {
			method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
			headers: { 'content-type': 'application/json', origin, ...(bearer && token ? { authorization: `Bearer ${token}` } : {}) },
			body: JSON.stringify({ ...input, ...(!bearer && token ? { i: token } : {}) }),
		});
		return readResponse(response);
	};
	const ok = (result, status = 200) => {
		assert.equal(result.status, status, `Unexpected HTTP status ${result.status}`);
		return result.body;
	};
	const step = async (name, operation) => {
		let passed = false;
		await t.test(name, async () => {
			await operation();
			passed = true;
		});
		assert.ok(passed, `Stopped after failed prerequisite: ${name}`);
	};
	let alice;
	let bob;
	await step('bootstrap and password signin use production authentication', async () => {
		const password = `Fukushu-${randomUUID()}`;
		const admin = ok(await call('admin/accounts/create', { username: 'fukushu_admin', password, setupPassword: credentials.setupPassword }));
		for (const username of ['fukushu_alice', 'fukushu_bob']) {
			ok(await call('admin/accounts/create', { username, password }, admin.token));
			// Keep the real IP rate limiter enabled: password logins are at least 1s apart.
			await setTimeout(1100);
			const signin = ok(await call('signin-flow', { username, password, progressMode: 'v1' }));
			assert.equal(signin.finished, true);
			assert.equal(typeof signin.i, 'string');
			const me = ok(await call('i', {}, signin.i));
			assert.equal(me.username, username);
			credentials[username.replace('fukushu_', '')] = { username, password, token: signin.i, id: me.id };
		}
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
		alice = credentials.alice;
		bob = credentials.bob;
	});
	assert.ok(alice && bob, 'Authentication setup must complete before Drive checks');
	let file;
	const source = '\uFEFF#html:false\n#notetype:Basic\n#deck:実 Drive の教材\n日本の首都は？\t東京\nフランスの首都は？\tパリ\n';
	await step('upload and list go through real Drive storage and owner authentication', async () => {
		const form = new FormData();
		form.set('i', alice.token);
		form.set('file', new Blob([source], { type: 'text/tab-separated-values' }), 'geography.tsv');
		const response = await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) });
		file = ok(await readResponse(response));
		assert.equal(file.name, 'geography.tsv');
		assert.equal(file.size, Buffer.byteLength(source));
		assert.ok(ok(await call('drive/files', {}, alice.token)).some(item => item.id === file.id));
		assert.ok(!ok(await call('drive/files', {}, bob.token)).some(item => item.id === file.id));
		credentials.fileId = file.id;
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	await step('anonymous and foreign-owner requests cannot import the original', async () => {
		assert.equal((await call('fukushu/materials/import', { fileId: file.id })).status, 401);
		const foreign = await call('fukushu/materials/import', { fileId: file.id }, bob.token);
		assert.equal(foreign.status, 404);
		assert.equal(foreign.body.error.code, 'NO_SUCH_FILE');
	});
	let material;
	let current;
	await step('real scoped tokens require both account write and Drive read', async () => {
		ok(await call('i/sudo/start', { password: alice.password }, alice.token));
		const mint = async permission => ok(await call('miauth/gen-token', { session: randomUUID(), permission }, alice.token)).token;
		const accountOnly = await mint(['write:account']);
		const denied = await call('fukushu/materials/import', { fileId: file.id }, accountOnly, true);
		assert.equal(denied.status, 403);
		const both = await mint(['write:account', 'read:drive', 'read:account']);
		material = ok(await call('fukushu/materials/import', { fileId: file.id }, both, true));
		assert.equal(material.deck.sourceText, source);
		assert.equal(material.questions.length, 2);
		assert.equal(material.questions[0].payload.answer.value, '東京');
		current = ok(await call('fukushu/materials/show', { id: material.deck.id }, both, true));
		assert.deepEqual({ deck: current.deck, questions: current.questions }, material);
		assert.equal(current.revision, 1);
		assert.equal(current.archivedAt, null);
		credentials.materialId = material.deck.id;
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	await step('owner persistence and duplicate retry preserve one material', async () => {
		assert.equal(ok(await call('fukushu/materials/list', {}, alice.token)).length, 1);
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, bob.token)), []);
		const foreign = await call('fukushu/materials/show', { id: material.deck.id }, bob.token);
		assert.equal(foreign.status, 404);
		const duplicate = await call('fukushu/materials/import', { fileId: file.id }, alice.token);
		assert.equal(duplicate.status, 409);
		assert.equal(duplicate.body.error.code, 'MATERIAL_EXISTS');
		assert.equal(ok(await call('fukushu/materials/list', {}, alice.token)).length, 1);
	});
	await step('metadata updates are owner-only and preserve card and source identity', async () => {
		const input = { id: material.deck.id, expectedRevision: current.revision, name: '名前を更新した教材', description: 'カードと原文は変更しません。' };
		const foreign = await call('fukushu/materials/update', input, bob.token);
		assert.equal(foreign.status, 404);
		assert.equal(foreign.body.error.code, 'NO_SUCH_MATERIAL');
		const changed = ok(await call('fukushu/materials/update', input, alice.token));
		assert.deepEqual(changed, { revision: 2, archivedAt: null });
		current = ok(await call('fukushu/materials/show', { id: material.deck.id }, alice.token));
		assert.equal(current.revision, 2);
		assert.equal(current.deck.name, input.name);
		assert.equal(current.deck.description, input.description);
		assert.ok(Date.parse(current.deck.updatedAt) >= Date.parse(material.deck.updatedAt));
		const preserved = deck => Object.fromEntries(Object.entries(deck).filter(([key]) => !['name', 'description', 'updatedAt'].includes(key)));
		assert.deepEqual(preserved(current.deck), preserved(material.deck));
		assert.deepEqual(current.questions, material.questions);
	});
	await step('stale and foreign-owner mutations leave the stored records unchanged', async () => {
		const staleUpdate = await call('fukushu/materials/update', { id: material.deck.id, expectedRevision: 1, name: '古い画面の更新' }, alice.token);
		assert.equal(staleUpdate.status, 409);
		assert.equal(staleUpdate.body.error.code, 'MATERIAL_CONFLICT');
		const staleArchive = await call('fukushu/materials/archive', { id: material.deck.id, expectedRevision: 1, archived: true }, alice.token);
		assert.equal(staleArchive.status, 409);
		assert.equal(staleArchive.body.error.code, 'MATERIAL_CONFLICT');
		const foreign = await call('fukushu/materials/archive', { id: material.deck.id, expectedRevision: current.revision, archived: true }, bob.token);
		assert.equal(foreign.status, 404);
		assert.equal(foreign.body.error.code, 'NO_SUCH_MATERIAL');
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: material.deck.id }, alice.token)), current);
	});
	await step('archive and restore preserve material JSON and remain owner-only', async () => {
		const archived = ok(await call('fukushu/materials/archive', { id: material.deck.id, expectedRevision: current.revision, archived: true }, alice.token));
		assert.equal(archived.revision, 3);
		assert.ok(typeof archived.archivedAt === 'string' && Number.isFinite(Date.parse(archived.archivedAt)));
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, alice.token)), []);
		assert.deepEqual(ok(await call('fukushu/materials/list', { archived: true }, alice.token)).map(deck => deck.id), [material.deck.id]);
		assert.deepEqual(ok(await call('fukushu/materials/list', { archived: true }, bob.token)), []);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: material.deck.id }, alice.token)), { ...current, ...archived });
		const restored = ok(await call('fukushu/materials/archive', { id: material.deck.id, expectedRevision: archived.revision, archived: false }, alice.token));
		assert.deepEqual(restored, { revision: 4, archivedAt: null });
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, alice.token)).map(deck => deck.id), [material.deck.id]);
		assert.deepEqual(ok(await call('fukushu/materials/list', { archived: true }, alice.token)), []);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: material.deck.id }, alice.token)), { ...current, ...restored });
	});
});
