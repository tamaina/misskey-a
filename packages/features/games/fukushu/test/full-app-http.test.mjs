/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { openAsBlob } from 'node:fs';
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';

// Opt-in only: an owned, freshly migrated full application, never an existing instance.
const directory = process.env.FUKUSHU_E2E_RUN_DIR;
test('real authentication, Drive, material maintenance and explanation versions', { skip: !directory, timeout: 120_000 }, async t => {
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
		credentials.admin = { username: 'fukushu_admin', password, token: admin.token, id: admin.id };
		for (const username of ['fukushu_alice', 'fukushu_bob', 'fukushu_carol', 'fukushu_dana', 'fukushu_gift', 'fukushu_apkg']) {
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
	await step('ordinary Drive upload recognizes Anki exports without allowing arbitrary ZIPs, then imports through the queue', async () => {
		const owner = credentials.apkg; // Separate non-moderator with a fresh native library.
		const mime = 'application/x-anki-package';
		const upload = async (bytes, filename, type) => {
			const form = new FormData();
			form.set('i', owner.token);
			form.set('file', new Blob([bytes], { type }), filename);
			return readResponse(await fetch(`${origin}/api/drive/files/create`, {
				method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000),
			}));
		};
		// An ordinary ZIP containing just hello.txt, unrelated to Anki.
		const zip = Buffer.from('UEsDBBQAAAAAALGhdF3l4enCCgAAAAoAAAAJAAAAaGVsbG8udHh0SnVzdCBhIFpJUFBLAQIUAxQAAAAAALGhdF3l4enCCgAAAAoAAAAJAAAAAAAAAAAAAACAAQAAAABoZWxsby50eHRQSwUGAAAAAAEAAQA3AAAAMQAAAAAA', 'base64');
		const legacy = await readFile(new URL('./backend/fixtures/apkg/basic-anki21.apkg', import.meta.url));
		const current = await readFile(new URL('./backend/fixtures/apkg/static-custom-21b.apkg', import.meta.url));
		for (const bytes of [zip, current.subarray(0, -7)]) {
			const rejected = await upload(bytes, 'fake.apkg', mime);
			assert.equal(rejected.status, 400);
			assert.equal(rejected.body.error.code, 'UNALLOWED_FILE_TYPE');
		}
		let modern;
		for (const [filename, bytes] of [['legacy.apkg', legacy], ['current.APKG', current]]) {
			const file = ok(await upload(bytes, filename, 'application/octet-stream'));
			assert.equal(file.type, mime);
			assert.equal(file.name, filename);
			const downloaded = await fetch(file.url, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
			assert.equal(downloaded.status, 200);
			assert.match(downloaded.headers.get('content-type') ?? '', /^application\/octet-stream(?:;|$)/i);
			assert.match(downloaded.headers.get('content-disposition') ?? '', /^attachment(?:;|$)/i);
			assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
			modern = file;
		}
		const endpoint = 'fukushu/upstream/restore-job';
		const input = { fileId: modern.id, format: 'anki-apkg', requestId: randomUUID(), confirmRestore: true };
		const foreign = await call(endpoint, input, bob.token);
		assert.equal(foreign.status, 404);
		assert.equal(foreign.body.error.code, 'NO_SUCH_FILE');
		let status = ok(await call(endpoint, input, owner.token)).status;
		for (let attempts = 0; status !== 'completed' && attempts < 18; attempts++) {
			assert.ok(['waiting', 'running'].includes(status), `Unexpected APKG job status: ${status}`);
			await setTimeout(1000);
			status = ok(await call(endpoint, { ...input, statusOnly: true }, owner.token)).status;
		}
		assert.equal(status, 'completed');
		const decks = ok(await call('fukushu/materials/list', {}, owner.token));
		assert.equal(decks.length, 1);
		assert.equal(decks[0].sourceType, 'anki-apkg');
		assert.equal(decks[0].sourceHash, createHash('sha256').update(current).digest('hex'));
		assert.equal(decks[0].questionCount, 1);
		const material = ok(await call('fukushu/materials/show', { id: decks[0].id }, owner.token));
		assert.equal(material.questions[0].payload.prompt.value, '箱');
		assert.equal(material.questions[0].payload.answer.value, 'box');
		assert.deepEqual(material.questions[0].payload.ankiTemplate.tags, ['synthetic']);
		assert.match(material.questions[0].payload.ankiTemplate.css, /\.prompt/);
		const study = ok(await call('fukushu/study/queue', { id: decks[0].id }, owner.token));
		const card = study.items[0].question.payload;
		assert.equal(card.ankiTemplate.frontHtml, '<div class="prompt">箱</div>');
		assert.equal(card.ankiTemplate.backHtml, '<strong class="answer">box</strong>');
		assert.equal(card.ankiTemplate.noteType, 'Custom vocabulary');

		const active = await readFile(new URL('./backend/fixtures/apkg/interactive-custom-21b.apkg', import.meta.url));
		const file = ok(await upload(active, 'interactive.apkg', 'application/octet-stream'));
		const activeInput = { ...input, fileId: file.id, requestId: randomUUID() };
		let activeResult = ok(await call(endpoint, activeInput, owner.token));
		for (let attempts = 0; activeResult.status !== 'failed' && attempts < 18; attempts++) {
			assert.ok(['waiting', 'running'].includes(activeResult.status), `Unexpected APKG job status: ${activeResult.status}`);
			await setTimeout(1000);
			activeResult = ok(await call(endpoint, { ...activeInput, statusOnly: true }, owner.token));
		}
		assert.deepEqual(activeResult, { status: 'failed', reason: 'unsupported' });
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, owner.token)), decks);

		const item = study.items[0];
		const reviewed = ok(await call('fukushu/study/review', {
			id: decks[0].id, questionId: item.question.id, questionVersion: item.questionVersion,
			expectedStateRevision: item.stateRevision, requestId: randomUUID(), rating: 'good', durationMs: 1000,
		}, owner.token));
		assert.equal(reviewed.card.reps, 1);
		const history = ok(await call('fukushu/study/history', { id: decks[0].id }, owner.token));
		assert.equal(history.length, 1);
		assert.deepEqual(history[0].question.payload.ankiTemplate, card.ankiTemplate);
	});
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
		const reloaded = ok(await call('fukushu/materials/show', { id: material.deck.id }, alice.token));
		assert.deepEqual(reloaded, { ...current, ...restored });
		current = reloaded;
	});

	const ids = { id: material.deck.id, questionId: material.questions[0].id };
	const originalQuestion = structuredClone(current.questions[0]);
	const withoutExplanationAndUpdateTime = question => {
		const record = structuredClone(question);
		delete record.updatedAt;
		delete record.payload.explanation;
		return record;
	};
	const stableDeck = deck => {
		const stable = structuredClone(deck);
		delete stable.updatedAt;
		return stable;
	};
	let explainedQuestion;
	await step('unedited cards expose a private virtual baseline without changing the material', async () => {
		const baseline = ok(await call('fukushu/materials/card-versions', ids, alice.token));
		assert.deepEqual(baseline, { currentVersion: 1, versions: [{ version: 1, recordedAt: null, kind: 'baseline' }] });
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 1 }, alice.token)), { version: 1, recordedAt: null, kind: 'baseline', question: originalQuestion });
		assert.equal((await call('fukushu/materials/card-versions', ids)).status, 401);
		assert.equal((await call('fukushu/materials/card-version', { ...ids, version: 1 })).status, 401);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), current);
	});
	await step('explanation updates retain the exact old record and cannot alter prompt, answer or source identity', async () => {
		// Alice write 1/5 for this endpoint; unsupported fields must not enter the store.
		const explanation = '日本の首都についての補足です。\n<b>This remains plain text.</b>';
		const changed = ok(await call('fukushu/materials/update-card-explanation', {
			...ids, expectedRevision: current.revision, explanation,
			ownerId: bob.id, prompt: 'tampered prompt', answer: 'tampered answer', sourceKey: 'tampered key', typeAnswer: true, acceptedAnswer: 'tampered answer',
		}, alice.token));
		assert.deepEqual(changed, { revision: current.revision + 1, archivedAt: null, version: 2 });
		const next = ok(await call('fukushu/materials/show', { id: ids.id }, alice.token));
		assert.equal(next.revision, changed.revision);
		assert.equal(next.archivedAt, null);
		assert.deepEqual(stableDeck(next.deck), stableDeck(current.deck));
		assert.ok(Date.parse(next.deck.updatedAt) >= Date.parse(current.deck.updatedAt));
		assert.deepEqual(next.questions.slice(1), current.questions.slice(1));
		assert.deepEqual(withoutExplanationAndUpdateTime(next.questions[0]), withoutExplanationAndUpdateTime(originalQuestion));
		assert.deepEqual(next.questions[0].payload.explanation, { format: 'plain', value: explanation });
		assert.ok(Date.parse(next.questions[0].updatedAt) >= Date.parse(originalQuestion.updatedAt));
		explainedQuestion = structuredClone(next.questions[0]);
		const old = ok(await call('fukushu/materials/card-version', { ...ids, version: 1 }, alice.token));
		assert.equal(old.kind, 'baseline');
		assert.ok(typeof old.recordedAt === 'string' && Number.isFinite(Date.parse(old.recordedAt)));
		assert.deepEqual(old.question, originalQuestion);
		const saved = ok(await call('fukushu/materials/card-version', { ...ids, version: 2 }, alice.token));
		assert.equal(saved.kind, 'explanation');
		assert.ok(typeof saved.recordedAt === 'string' && Number.isFinite(Date.parse(saved.recordedAt)));
		assert.deepEqual(saved.question, explainedQuestion);
		const firstPage = ok(await call('fukushu/materials/card-versions', { ...ids, limit: 1 }, alice.token));
		assert.equal(firstPage.currentVersion, 2);
		assert.deepEqual(firstPage.versions.map(item => item.version), [2]);
		const secondPage = ok(await call('fukushu/materials/card-versions', { ...ids, before: 2, limit: 1 }, alice.token));
		assert.equal(secondPage.currentVersion, 2);
		assert.deepEqual(secondPage.versions.map(item => item.version), [1]);
		assert.deepEqual(ok(await call('fukushu/materials/card-versions', { ...ids, before: 1 }, alice.token)).versions, []);
		// Alice write 2/5: identical text with a stale revision still conflicts.
		const stale = await call('fukushu/materials/update-card-explanation', { ...ids, expectedRevision: current.revision, explanation }, alice.token);
		assert.equal(stale.status, 409);
		assert.equal(stale.body.error.code, 'MATERIAL_CONFLICT');
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), next);
		current = next;
	});
	await step('card versions conceal foreign, missing and mismatched material identities', async () => {
		for (const input of [ids, { ...ids, id: 'missing-deck' }]) {
			const rejected = await call('fukushu/materials/update-card-explanation', { ...input, expectedRevision: current.revision, explanation: 'foreign' }, bob.token);
			assert.equal(rejected.status, 404);
			assert.equal(rejected.body.error.code, 'NO_SUCH_MATERIAL');
		}
		for (const token of [alice.token, bob.token]) {
			const inaccessible = token === alice.token
				? [{ ...ids, questionId: 'missing-card' }, { ...ids, id: 'missing-deck' }]
				: [ids, { ...ids, id: 'missing-deck' }];
			for (const input of inaccessible) {
				for (const endpoint of ['fukushu/materials/card-versions', 'fukushu/materials/card-version']) {
					const response = await call(endpoint, { ...input, ...(endpoint.endsWith('/card-version') ? { version: 1 } : {}) }, token);
					assert.equal(response.status, 404);
					assert.equal(response.body.error.code, 'NO_SUCH_MATERIAL');
				}
			}
		}
		const missingVersion = await call('fukushu/materials/card-version', { ...ids, version: 99 }, alice.token);
		assert.equal(missingVersion.status, 404);
		assert.equal(missingVersion.body.error.code, 'NO_SUCH_MATERIAL');
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), current);
	});
	await step('clearing an explanation adds a version, while repeating null is a no-op', async () => {
		// Alice writes 3/5 and 4/5; no-op still passes the real limiter.
		const changed = ok(await call('fukushu/materials/update-card-explanation', { ...ids, expectedRevision: current.revision, explanation: null }, alice.token));
		assert.deepEqual(changed, { revision: current.revision + 1, archivedAt: null, version: 3 });
		const next = ok(await call('fukushu/materials/show', { id: ids.id }, alice.token));
		assert.equal(next.revision, changed.revision);
		assert.deepEqual(stableDeck(next.deck), stableDeck(current.deck));
		assert.deepEqual(next.questions.slice(1), current.questions.slice(1));
		assert.deepEqual(withoutExplanationAndUpdateTime(next.questions[0]), withoutExplanationAndUpdateTime(originalQuestion));
		assert.equal(Object.hasOwn(next.questions[0].payload, 'explanation'), false);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 1 }, alice.token)).question, originalQuestion);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 2 }, alice.token)).question, explainedQuestion);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 3 }, alice.token)).question, next.questions[0]);
		const versions = ok(await call('fukushu/materials/card-versions', ids, alice.token));
		assert.equal(versions.currentVersion, 3);
		assert.deepEqual(versions.versions.map(item => item.version), [3, 2, 1]);
		assert.deepEqual(ok(await call('fukushu/materials/update-card-explanation', { ...ids, expectedRevision: next.revision, explanation: null }, alice.token)), changed);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), next);
		assert.deepEqual(ok(await call('fukushu/materials/card-versions', ids, alice.token)), versions);
		current = next;
	});
	await step('archived material explanation updates keep the archive state and old versions after restore', async () => {
		// Archive endpoint writes 4/5 and 5/5 overall; it has a separate rate budget.
		const archived = ok(await call('fukushu/materials/archive', { id: ids.id, expectedRevision: current.revision, archived: true }, alice.token));
		assert.ok(typeof archived.archivedAt === 'string');
		assert.equal(archived.revision, current.revision + 1);
		// Alice explanation write 5/5.
		const changed = ok(await call('fukushu/materials/update-card-explanation', { ...ids, expectedRevision: archived.revision, explanation: '保管中の追記' }, alice.token));
		assert.deepEqual(changed, { revision: archived.revision + 1, archivedAt: archived.archivedAt, version: 4 });
		const next = ok(await call('fukushu/materials/show', { id: ids.id }, alice.token));
		assert.equal(next.archivedAt, archived.archivedAt);
		assert.equal(next.revision, changed.revision);
		assert.deepEqual(stableDeck(next.deck), stableDeck(current.deck));
		assert.deepEqual(next.questions.slice(1), current.questions.slice(1));
		assert.deepEqual(withoutExplanationAndUpdateTime(next.questions[0]), withoutExplanationAndUpdateTime(originalQuestion));
		assert.deepEqual(next.questions[0].payload.explanation, { format: 'plain', value: '保管中の追記' });
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, alice.token)), []);
		assert.deepEqual(ok(await call('fukushu/materials/list', { archived: true }, alice.token)).map(deck => deck.id), [ids.id]);
		const restored = ok(await call('fukushu/materials/archive', { id: ids.id, expectedRevision: next.revision, archived: false }, alice.token));
		assert.deepEqual(restored, { revision: next.revision + 1, archivedAt: null });
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), { ...next, ...restored });
		const versions = ok(await call('fukushu/materials/card-versions', ids, alice.token));
		assert.equal(versions.currentVersion, 4);
		assert.deepEqual(versions.versions.map(item => item.version), [4, 3, 2, 1]);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { id: ids.id, questionId: material.questions[1].id, version: 1 }, alice.token)), { version: 1, recordedAt: null, kind: 'baseline', question: material.questions[1] });
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 1 }, alice.token)).question, originalQuestion);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 2 }, alice.token)).question, explainedQuestion);
		assert.deepEqual(ok(await call('fukushu/materials/card-version', { ...ids, version: 4 }, alice.token)).question, next.questions[0]);
		credentials.questionId = ids.questionId;
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	let queue;
	let submitted;
	let savedReview;
	await step('study queue uses real owner authentication and account read permissions', async () => {
		assert.equal((await call('fukushu/study/queue', { id: ids.id })).status, 401);
		assert.equal((await call('fukushu/study/queue', { id: ids.id }, bob.token)).status, 404);
		ok(await call('i/sudo/start', { password: alice.password }, alice.token));
		const writeOnly = ok(await call('miauth/gen-token', { session: randomUUID(), permission: ['write:account'] }, alice.token)).token;
		assert.equal((await call('fukushu/study/queue', { id: ids.id }, writeOnly, true)).status, 403);
		const readOnly = ok(await call('miauth/gen-token', { session: randomUUID(), permission: ['read:account'] }, alice.token)).token;
		queue = ok(await call('fukushu/study/queue', { id: ids.id }, readOnly, true));
		assert.equal(queue.deckId, ids.id);
		assert.equal(queue.items.length, 2);
		assert.ok(queue.items.every(item => item.isNew && item.stateRevision === 0));
		const item = queue.items.find(item => item.question.id === ids.questionId);
		assert.equal(item.questionVersion, 4);
		submitted = { id: ids.id, questionId: item.question.id, questionVersion: item.questionVersion, expectedStateRevision: item.stateRevision, requestId: randomUUID(), rating: 'good', durationMs: 1200 };
		assert.equal((await call('fukushu/study/review', submitted, readOnly, true)).status, 403);
		savedReview = ok(await call('fukushu/study/review', submitted, writeOnly, true));
		assert.equal(savedReview.id, submitted.requestId);
		assert.equal(savedReview.questionVersion, 4);
		assert.equal(savedReview.stateRevision, 1);
		assert.equal(savedReview.record.correct, true);
		assert.equal(savedReview.record.rating, 'good');
		assert.equal(savedReview.record.responseText, '');
		assert.equal(savedReview.card.reps, 1);
		assert.ok(Date.parse(savedReview.card.due) > Date.parse(savedReview.record.reviewedAt));
	});
	await step('review retries are idempotent and altered or stale submissions cannot reschedule', async () => {
		assert.deepEqual(ok(await call('fukushu/study/review', submitted, alice.token)), savedReview);
		const altered = await call('fukushu/study/review', { ...submitted, rating: 'easy' }, alice.token);
		assert.equal(altered.status, 409);
		assert.equal(altered.body.error.code, 'STUDY_CONFLICT');
		const stale = await call('fukushu/study/review', { ...submitted, requestId: randomUUID() }, alice.token);
		assert.equal(stale.status, 409);
		assert.equal(stale.body.error.code, 'STUDY_CONFLICT');
		const early = await call('fukushu/study/review', { ...submitted, requestId: randomUUID(), expectedStateRevision: 1 }, alice.token);
		assert.equal(early.status, 409);
		const history = ok(await call('fukushu/study/history', { id: ids.id }, alice.token));
		assert.equal(history.length, 1);
		assert.deepEqual(history[0], { ...savedReview, question: queue.items.find(item => item.question.id === ids.questionId).question });
		assert.equal((await call('fukushu/study/history', { id: ids.id }, bob.token)).status, 404);
	});
	await step('concurrent tabs save one result and history cursors retain both card snapshots', async () => {
		const item = queue.items.find(item => item.question.id !== ids.questionId);
		const input = { id: ids.id, questionId: item.question.id, questionVersion: item.questionVersion, expectedStateRevision: 0, durationMs: 3000 };
		const outcomes = await Promise.all([
			call('fukushu/study/review', { ...input, requestId: randomUUID(), rating: 'hard' }, alice.token),
			call('fukushu/study/review', { ...input, requestId: randomUUID(), rating: 'easy' }, alice.token),
		]);
		assert.deepEqual(outcomes.map(result => result.status).sort(), [200, 409]);
		const history = ok(await call('fukushu/study/history', { id: ids.id }, alice.token));
		assert.equal(history.length, 2);
		const first = ok(await call('fukushu/study/history', { id: ids.id, limit: 1 }, alice.token));
		const second = ok(await call('fukushu/study/history', { id: ids.id, beforeId: first[0].id, limit: 1 }, alice.token));
		assert.deepEqual([...first, ...second], history);
		const baseline = ok(await call('fukushu/materials/card-version', { id: ids.id, questionId: item.question.id, version: 1 }, alice.token));
		assert.ok(baseline.recordedAt);
		assert.deepEqual(baseline.question, item.question);
		assert.deepEqual(ok(await call('fukushu/study/queue', { id: ids.id }, alice.token)).items, []);
	});
	await step('first review then explanation edit preserves the saved baseline and archived history', async () => {
		const own = structuredClone(material);
		own.questions[1].payload.typeAnswer = true;
		own.questions[1].payload.acceptedAnswer = own.questions[1].payload.answer.value;
		ok(await call('fukushu/materials/create', { material: own }, bob.token));
		const item = ok(await call('fukushu/study/queue', { id: ids.id }, bob.token)).items.find(item => item.question.id === own.questions[0].id);
		const input = { id: ids.id, questionId: item.question.id, questionVersion: 1, expectedStateRevision: 0, requestId: randomUUID(), rating: 'good', durationMs: 800 };
		const review = ok(await call('fukushu/study/review', input, bob.token));
		const edited = ok(await call('fukushu/materials/update-card-explanation', { id: ids.id, questionId: item.question.id, expectedRevision: 1, explanation: '復習後に追加した解説' }, bob.token));
		assert.equal(edited.version, 2);
		const old = ok(await call('fukushu/materials/card-version', { id: ids.id, questionId: item.question.id, version: 1 }, bob.token));
		assert.deepEqual(old.question, item.question);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, bob.token)), [{ ...review, question: item.question }]);
		const archived = ok(await call('fukushu/materials/archive', { id: ids.id, expectedRevision: edited.revision, archived: true }, bob.token));
		assert.equal((await call('fukushu/study/queue', { id: ids.id }, bob.token)).status, 409);
		assert.deepEqual(ok(await call('fukushu/study/review', input, bob.token)), review);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, bob.token)), [{ ...review, question: item.question }]);
		ok(await call('fukushu/materials/archive', { id: ids.id, expectedRevision: archived.revision, archived: false }, bob.token));
		const remaining = ok(await call('fukushu/study/queue', { id: ids.id }, bob.token));
		assert.equal(remaining.items.length, 1);
		assert.equal(remaining.items[0].question.payload.typeAnswer, true);
		credentials.studyOwner = 'bob';
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	let backupFile;
	let backupBytes;
	let beforeBackup;
	let beforeHistory;
	await step('backup uses normal login, requires Drive visibility acknowledgement and denies scoped tokens', async () => {
		const input = { id: ids.id, acknowledgeDriveVisibility: true };
		const anonymous = await call('fukushu/backup/export', input);
		assert.equal(anonymous.status, 400);
		assert.equal(anonymous.body.error.code, 'ACCESS_DENIED');
		const delegated = ok(await call('miauth/gen-token', { session: randomUUID(), permission: ['read:account', 'write:account', 'read:drive', 'write:drive'] }, alice.token)).token;
		for (const denied of [await call('fukushu/backup/inspect-upstream', { fileId: file.id }, delegated, true), await call('fukushu/backup/export', input, delegated, true), await call('fukushu/backup/inspect', { fileId: file.id }, delegated, true), await call('fukushu/backup/restore', { fileId: file.id, confirmRestore: true }, delegated, true)]) {
			assert.equal(denied.status, 400);
			assert.equal(denied.body.error.code, 'ACCESS_DENIED');
		}
		assert.equal((await call('fukushu/backup/export', { id: ids.id }, alice.token)).status, 400);
		assert.equal((await call('fukushu/backup/export', { id: 'missing-deck', acknowledgeDriveVisibility: true }, alice.token)).status, 404);
	});
	await step('real queue exports the full deck and pinned history into Drive then sends exportCompleted', async () => {
		beforeBackup = ok(await call('fukushu/materials/show', { id: ids.id }, alice.token));
		beforeHistory = ok(await call('fukushu/study/history', { id: ids.id }, alice.token));
		ok(await call('fukushu/backup/export', { id: ids.id, acknowledgeDriveVisibility: true }, alice.token), 204);
		const deadline = Date.now() + 30_000;
		while (!backupFile && Date.now() < deadline) {
			const notifications = ok(await call('i/notifications', { includeTypes: ['exportCompleted'], limit: 10 }, alice.token));
			const completed = notifications.find(n => n.exportedEntity === 'fukushu');
			if (completed) backupFile = ok(await call('drive/files/show', { fileId: completed.fileId }, alice.token));
			else await setTimeout(300);
		}
		assert.ok(backupFile, 'Queue must produce a Drive file and a completion notification');
		assert.match(backupFile.name, /^fukushu-backup-.*\.json$/);
		assert.ok(backupFile.size > 0);
		assert.equal(new URL(backupFile.url).origin, origin, 'Synthetic test artifact must remain on the owned application');
		const response = await fetch(backupFile.url, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
		assert.equal(response.status, 200);
		const bytes = Buffer.from(await response.arrayBuffer());
		backupBytes = bytes;
		const envelope = JSON.parse(bytes.toString());
		assert.equal(envelope.format, 'misskey-fukushu-deck-backup');
		assert.equal(envelope.sha256, createHash('sha256').update(JSON.stringify(envelope.payload)).digest('hex'));
		assert.deepEqual(envelope.payload.material, { deck: beforeBackup.deck, questions: beforeBackup.questions });
		assert.equal(envelope.payload.reviews.length, 2);
		assert.equal(envelope.payload.versions.length, 5);
		assert.equal(envelope.payload.states.length, 2);
		for (const item of beforeHistory) {
			const saved = envelope.payload.reviews.find(row => row.id === item.id);
			assert.deepEqual(saved.data, item.record);
			assert.deepEqual(saved.after, item.card);
			assert.deepEqual(envelope.payload.versions.find(row => row.questionId === saved.questionId && row.version === saved.questionVersion).data, item.question);
			assert.equal(saved.request.requestId, item.id);
		}
		assert.equal(JSON.stringify(envelope).includes(alice.id), false);
		credentials.backupFileId = backupFile.id;
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	await step('restore inspection reads an owned Drive original without changing materials, versions or schedules', async () => {
		const report = ok(await call('fukushu/backup/inspect', { fileId: backupFile.id }, alice.token));
		assert.equal(report.restored, false);
		assert.equal(report.questions, 2);
		assert.equal(report.versions, 5);
		assert.equal(report.reviews, 2);
		assert.deepEqual(report.conflicts, { deck: true, questions: 2, reviews: 2 });
		const foreign = await call('fukushu/backup/inspect', { fileId: backupFile.id }, bob.token);
		assert.equal(foreign.status, 404);
		assert.equal(foreign.body.error.code, 'NO_SUCH_FILE');
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
	});
	await step('corrupt and upstream files are refused explicitly without partially importing history', async () => {
		for (const [data, code] of [['{}', 'INVALID_BACKUP'], [JSON.stringify({ format: 'gift-fsrs-learning-backup', version: 3 }), 'UPSTREAM_BACKUP_UNSUPPORTED']]) {
			const form = new FormData();
			form.set('i', alice.token);
			form.set('file', new Blob([data], { type: 'application/json' }), `${code}.json`);
			const uploaded = ok(await readResponse(await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) })));
			const rejected = await call('fukushu/backup/inspect', { fileId: uploaded.id }, alice.token);
			assert.equal(rejected.status, 400);
			assert.equal(rejected.body.error.code, code);
		}
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
	});
	await step('restore rejects anonymous, foreign originals, absent confirmation and existing IDs without writes', async () => {
		const input = { fileId: backupFile.id, confirmRestore: true };
		const anonymous = await call('fukushu/backup/restore', input);
		assert.equal(anonymous.status, 400); assert.equal(anonymous.body.error.code, 'ACCESS_DENIED');
		assert.equal((await call('fukushu/backup/restore', { fileId: backupFile.id }, alice.token)).status, 400);
		const foreign = await call('fukushu/backup/restore', input, bob.token);
		assert.equal(foreign.status, 404); assert.equal(foreign.body.error.code, 'NO_SUCH_FILE');
		const collision = await call('fukushu/backup/restore', input, alice.token);
		assert.equal(collision.status, 409); assert.equal(collision.body.error.code, 'BACKUP_CONFLICT');
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
	});
	await step('owned backup restores all versions and history to the authenticated destination exactly once', async () => {
		for (const name of ['carol', 'dana']) {
			const owner = credentials[name]; const form = new FormData();
			form.set('i', owner.token); form.set('file', new Blob([backupBytes], { type: 'application/json' }), 'native-restore.json');
			const uploaded = ok(await readResponse(await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) })));
			owner.backupFileId = uploaded.id;
			const inspection = ok(await call('fukushu/backup/inspect', { fileId: uploaded.id }, owner.token));
			assert.deepEqual(inspection.conflicts, { deck: false, questions: 0, reviews: 0 });
			if (name === 'dana') continue; // Fresh synthetic destination for Chrome verification.
			const input = { fileId: uploaded.id, confirmRestore: true, ownerId: alice.id };
			const result = ok(await call('fukushu/backup/restore', input, owner.token));
			assert.deepEqual(result, { restored: true, deckId: ids.id, archived: false, questions: 2, versions: 5, studyStates: 2, reviews: 2 });
			assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, owner.token)), beforeBackup);
			assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, owner.token)), beforeHistory);
			assert.deepEqual(ok(await call('fukushu/study/review', submitted, owner.token)), savedReview);
			for (const item of beforeHistory) {
				const questionId = item.record.questionId;
				assert.deepEqual(ok(await call('fukushu/materials/card-versions', { id: ids.id, questionId }, owner.token)), ok(await call('fukushu/materials/card-versions', { id: ids.id, questionId }, alice.token)));
			}
			const retry = await call('fukushu/backup/restore', input, owner.token);
			assert.equal(retry.status, 409); assert.equal(retry.body.error.code, 'BACKUP_CONFLICT');
			assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, owner.token)), beforeHistory);
		}
		credentials.restoreOwner = 'dana';
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
	});
	await step('upstream binary inspection uses owned Drive and reports unknown history without importing or changing schedules', async () => {
		const bytes = await readFile(new URL('./backend/fixtures/upstream-backup.fukushu', import.meta.url));
		// Only the verified Fukushu envelope receives a dedicated allowed MIME.
		const damaged = Buffer.from(bytes); damaged[damaged.length - 1] ^= 1;
		const deniedForm = new FormData(); deniedForm.set('i', credentials.dana.token);
		deniedForm.set('file', new Blob([damaged], { type: 'application/octet-stream' }), 'damaged.fukushu');
		const denied = await readResponse(await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: deniedForm, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) }));
		assert.equal(denied.status, 400); assert.equal(denied.body.error.code, 'UNALLOWED_FILE_TYPE');
		const owner = credentials.dana; const form = new FormData();
		form.set('i', owner.token); form.set('file', new Blob([bytes], { type: 'application/octet-stream' }), 'upstream-history.fukushu');
		const uploaded = ok(await readResponse(await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) })));
		const before = ok(await call('fukushu/materials/list', {}, owner.token));
		const input = { fileId: uploaded.id };
		const anonymous = await call('fukushu/backup/inspect-upstream', input);
		assert.equal(anonymous.status, 400); assert.equal(anonymous.body.error.code, 'ACCESS_DENIED');
		const foreign = await call('fukushu/backup/inspect-upstream', input, alice.token);
		assert.equal(foreign.status, 404); assert.equal(foreign.body.error.code, 'NO_SUCH_FILE');
		const report = ok(await call('fukushu/backup/inspect-upstream', { ...input, ownerId: alice.id }, owner.token));
		assert.equal(report.imported, false); assert.equal(report.canImport, false); assert.equal(report.exportedAt, null);
		assert.deepEqual(report.counts, { decks: 1, questions: 2, studyStates: 1, reviewLogs: 2, importSources: 1, media: 1, imports: 1 });
		for (const row of report.history) {
			assert.equal(row.questionSnapshot, 'unavailable'); assert.equal(row.cardBefore, null); assert.equal(row.cardAfter, null); assert.equal(row.scheduler, null);
			assert.equal(Object.hasOwn(row, 'question'), false); assert.equal(Object.hasOwn(row, 'questionVersion'), false);
		}
		assert.deepEqual(ok(await call('fukushu/materials/list', {}, owner.token)), before);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
		credentials.upstreamOwner = 'dana'; credentials.dana.upstreamFileId = uploaded.id;
		await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
	});
	let sourceFile;
	let sourceBefore;
	let sourceReview;
	const sourceRequestId = randomUUID();
	const sourceFrames = bytes => {
		const magic = Buffer.from('FUKUSHU-BACKUP-1\n');
		assert.deepEqual(bytes.subarray(0, magic.length), magic);
		assert.equal(createHash('sha256').update(bytes.subarray(0, -64)).digest('hex'), bytes.subarray(-64).toString());
		const frames = [];
		for (let offset = magic.length; offset < bytes.length - 64;) {
			const length = bytes.readUInt32LE(offset); offset += 4;
			const row = JSON.parse(bytes.subarray(offset, offset + length).toString()); offset += length;
			const binary = row.blobSize === undefined ? undefined : bytes.subarray(offset, offset + row.blobSize);
			offset += row.blobSize ?? 0;
			frames.push({ ...row, ...(binary === undefined ? {} : { binary }) });
		}
		return frames;
	};
	await step('ordinary user imports real source-generated APKG/reset records through authenticated Drive', async () => {
		const bytes = await readFile(new URL('./backend/fixtures/actual-upstream/actual-upstream.fukushu', import.meta.url));
		const form = new FormData(); form.set('i', alice.token);
		form.set('file', new Blob([bytes], { type: 'application/octet-stream' }), 'actual-upstream.fukushu');
		sourceFile = ok(await readResponse(await fetch(`${origin}/api/drive/files/create`, { method: 'POST', body: form, headers: { origin }, redirect: 'error', signal: AbortSignal.timeout(10_000) })));
		assert.equal(sourceFile.type, 'application/x-fukushu-backup');
		const input = { fileId: sourceFile.id, requestId: sourceRequestId, confirmRestore: true };
		const delegated = ok(await call('miauth/gen-token', { session: randomUUID(), permission: ['read:account', 'write:account', 'read:drive'] }, alice.token)).token;
		for (const denied of [await call('fukushu/upstream/restore', input), await call('fukushu/upstream/restore', input, delegated, true)]) {
			assert.equal(denied.status, 400); assert.equal(denied.body.error.code, 'ACCESS_DENIED');
		}
		assert.equal((await call('fukushu/upstream/restore', { fileId: sourceFile.id, requestId: sourceRequestId }, alice.token)).status, 400);
		assert.equal((await call('fukushu/upstream/restore', input, bob.token)).status, 404);
		const restored = ok(await call('fukushu/upstream/restore', { ...input, ownerId: bob.id }, alice.token));
		assert.equal(restored.sha256, createHash('sha256').update(bytes).digest('hex'));
		assert.deepEqual(ok(await call('fukushu/upstream/restore', input, alice.token)), restored);
		assert.equal((await call('fukushu/upstream/restore', { ...input, requestId: randomUUID() }, alice.token)).status, 409);
		sourceBefore = ok(await call('fukushu/upstream/show', {}, alice.token));
		assert.equal(sourceBefore.records.reviewLogs.length, 37);
		assert.equal(sourceBefore.records.reviewLogs.filter(row => row.id.startsWith('anki:')).length, 36);
		assert.equal(sourceBefore.records.settings[0].desiredRetention, 0.87);
		assert.equal((await call('fukushu/upstream/show', { ownerId: alice.id }, bob.token)).status, 404);
		assert.deepEqual(ok(await call('fukushu/materials/show', { id: ids.id }, alice.token)), beforeBackup);
		assert.deepEqual(ok(await call('fukushu/study/history', { id: ids.id }, alice.token)), beforeHistory);
	});
	await step('persistent source review keeps reset history and rejects duplicate changes or stale tabs', async () => {
		const expected = JSON.parse(await readFile(new URL('./backend/fixtures/actual-upstream/expected-continuation.json', import.meta.url), 'utf8'));
		const input = { ...expected.reset.request }; delete input.reviewedAt;
		const before = sourceBefore.records.studyStates.find(row => row.questionId === input.questionId);
		assert.equal(before.card.reps, 0);
		assert.equal(sourceBefore.records.reviewLogs.filter(row => row.questionId === input.questionId).length, 1);
		sourceReview = ok(await call('fukushu/upstream/review', input, alice.token));
		assert.equal(sourceReview.state.card.reps, 1); assert.equal(sourceReview.revision, 1);
		assert.deepEqual(ok(await call('fukushu/upstream/review', input, alice.token)), sourceReview);
		assert.equal((await call('fukushu/upstream/review', { ...input, rating: 'hard' }, alice.token)).status, 409);
		assert.equal((await call('fukushu/upstream/review', { ...input, requestId: randomUUID() }, alice.token)).status, 409);
		assert.equal((await call('fukushu/upstream/review', input, bob.token)).status, 404);
		const after = ok(await call('fukushu/upstream/show', {}, alice.token));
		assert.equal(after.records.reviewLogs.length, 38);
		for (const log of sourceBefore.records.reviewLogs) assert.deepEqual(after.records.reviewLogs.find(row => row.id === log.id), log);
	});
	await step('source export uses the real queue and preserves source IDs, current state and all binary payloads', async () => {
		assert.equal((await call('fukushu/upstream/export', {}, alice.token)).status, 400);
		ok(await call('fukushu/upstream/export', { acknowledgeDriveVisibility: true }, alice.token), 204);
		let outputFile;
		const deadline = Date.now() + 30_000;
		while (!outputFile && Date.now() < deadline) {
			const notifications = ok(await call('i/notifications', { includeTypes: ['exportCompleted'], limit: 10 }, alice.token));
			const completed = notifications.find(n => n.exportedEntity === 'fukushu' && n.fileId !== backupFile.id);
			if (completed) outputFile = ok(await call('drive/files/show', { fileId: completed.fileId }, alice.token));
			else await setTimeout(300);
		}
		assert.ok(outputFile); assert.match(outputFile.name, /\.fukushu$/);
		assert.equal(new URL(outputFile.url).origin, origin);
		const response = await fetch(outputFile.url, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
		assert.equal(response.status, 200);
		const output = Buffer.from(await response.arrayBuffer());
		const frames = sourceFrames(output);
		const original = sourceFrames(await readFile(new URL('./backend/fixtures/actual-upstream/actual-upstream.fukushu', import.meta.url)));
		assert.deepEqual(frames.filter(row => row.binary), original.filter(row => row.binary));
		for (const row of original.filter(row => row.store !== 'studyStates')) assert.deepEqual(frames.find(item => item.store === row.store && item.value.id === row.value.id), row);
		assert.deepEqual(frames.find(row => row.store === 'studyStates' && row.value.questionId === sourceReview.state.questionId).value, sourceReview.state);
		assert.deepEqual(frames.find(row => row.store === 'reviewLogs' && row.value.id === sourceReview.record.id).value, sourceReview.record);
		await writeFile(join(directory, 'persisted-export.fukushu'), output, { mode: 0o600 });
		await writeFile(join(directory, 'persisted-state.json'), JSON.stringify(sourceReview), { mode: 0o600 });
	});
	await step('native review cannot reuse an imported/source review ID and rolls back its schedule', async () => {
		const own = structuredClone(material); own.deck.id = 'collision-probe';
		own.questions.forEach((question, index) => { question.id = `collision-question-${index}`; question.deckId = own.deck.id; question.payload.id = question.id; question.payload.deckId = own.deck.id; });
		ok(await call('fukushu/materials/create', { material: own }, alice.token));
		const before = ok(await call('fukushu/study/queue', { id: own.deck.id }, alice.token));
		const item = before.items[0];
		const conflict = await call('fukushu/study/review', { id: own.deck.id, questionId: item.question.id, questionVersion: 1, expectedStateRevision: 0, requestId: sourceReview.record.id, rating: 'good', durationMs: 500 }, alice.token);
		assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'STUDY_CONFLICT');
		assert.deepEqual(ok(await call('fukushu/study/history', { id: own.deck.id }, alice.token)), []);
		assert.deepEqual(ok(await call('fukushu/study/queue', { id: own.deck.id }, alice.token)).items, before.items);
	});
	await step('owner reads imported media and confirms a GIFT update without replacing history', async () => {
		const { records } = sourceBefore;
		for (const m of records.media) {
			const result = ok(await call('fukushu/upstream/media', { id: m.id }, alice.token));
			assert.equal(result.mimeType, m.mimeType);
			assert.equal(createHash('sha256').update(Buffer.from(result.base64, 'base64')).digest('hex'), m.id);
			assert.equal((await call('fukushu/upstream/media', { id: m.id, ownerId: alice.id }, bob.token)).status, 404);
			const tail = ok(await call('fukushu/upstream/media', { id: m.id, offset: 1 }, alice.token));
			assert.equal(tail.totalBytes, m.size);
			assert.deepEqual(Buffer.from(tail.base64, 'base64'), Buffer.from(result.base64, 'base64').subarray(1));
			assert.equal((await call('fukushu/upstream/media', { id: m.id, offset: -1 }, alice.token)).status, 400);
			assert.equal((await call('fukushu/upstream/media', { id: m.id, offset: 0 })).status, 401);
		}
		const form = new FormData();
		form.set('i', alice.token);
		form.set('file', new Blob(['::stable-name:: Sky is blue. {TRUE}'], { type: 'text/plain' }), 'updated.gift.txt');
		const gift = ok(await readResponse(await fetch(origin + '/api/drive/files/create', { method: 'POST', body: form, headers: { origin }, redirect: 'error' })));
		const deck = records.decks.find(d => d.sourceType === 'gift');
		const input = { deckId: deck.id, fileId: gift.id };
		const preview = ok(await call('fukushu/upstream/update-gift', input, alice.token));
		assert.equal(preview.reset, 1); assert.equal(preview.applied, false);
		const apply = { ...input, confirmToken: preview.token };
		assert.equal(ok(await call('fukushu/upstream/update-gift', apply, alice.token)).applied, true);
		assert.equal((await call('fukushu/upstream/update-gift', apply, alice.token)).status, 409);
		const after = ok(await call('fukushu/upstream/show', {}, alice.token));
		assert.equal(after.records.reviewLogs.length, 38);
		assert.equal(after.records.studyStates.find(s => s.questionId === sourceReview.state.questionId).card.reps, 0);
		assert.equal(after.records.questions.find(q => q.id === sourceReview.state.questionId).payload.correctAnswer, true);
	});
	if (process.env.FUKUSHU_SCALE_FIXTURE) await step('normal Drive upload, queued large restore, review and streamed export', async () => {
		const path = join(directory, 'scale.fukushu');
		const blob = await openAsBlob(path);
		const endpoint = 'fukushu/upstream/restore-job';
		const upload = async user => {
			const form = new FormData();
			form.set('i', user.token);
			form.set('file', blob, 'scale-5000.fukushu');
			const uploaded = ok(await readResponse(await fetch(origin + '/api/drive/files/create', { method: 'POST', body: form, headers: { origin }, redirect: 'error' })));
			assert.equal(uploaded.size, blob.size);
			return uploaded.id;
		};
		const rss = async () => Number((await readFile('/proc/' + ready.backend_pid + '/status', 'utf8')).match(/^VmRSS:\s+(\d+)/m)[1]);
		const baselineKiB = await rss();
		let peakKiB = baselineKiB;
		const monitor = setInterval(async () => { peakKiB = Math.max(peakKiB, await rss()); }, 100);
		try {
			const started = performance.now();
			const fileId = await upload(bob);
			const uploaded = performance.now();
			const input = { fileId, requestId: randomUUID(), confirmRestore: true };
			const status = async (user = bob) => ok(await call(endpoint, { ...input, statusOnly: true }, user.token)).status;
			assert.equal(await status(), 'missing');
			assert.equal((await call(endpoint, input, alice.token)).status, 404);
			const jobs = await Promise.all([call(endpoint, input, bob.token), call(endpoint, input, bob.token)]);
			for (const job of jobs) assert.ok(['waiting', 'running', 'completed'].includes(ok(job).status));
			const until = Date.now() + 45_000;
			while (Date.now() < until) {
				const result = await status();
				if (result === 'completed') break;
				assert.ok(['waiting', 'running'].includes(result));
				await setTimeout(2000);
			}
			assert.equal(await status(), 'completed');
			assert.equal(await status(alice), 'missing');
			const restored = performance.now();
			const reviewInput = { questionId: 'anki:scale:4999', requestId: randomUUID(), expectedRevision: 0, durationMs: 300, answers: ['A'], rating: 'good', correct: true };
			assert.equal((await call('fukushu/upstream/review', { ...reviewInput, questionId: 'source-card' }, bob.token)).body.error.code, 'STUDY_UNAVAILABLE');
			const review = ok(await call('fukushu/upstream/review', reviewInput, bob.token));
			assert.equal(review.revision, 1);
			assert.deepEqual(ok(await call('fukushu/upstream/review', reviewInput, bob.token)), review);
			const reviewed = performance.now();
			ok(await call('fukushu/upstream/export', { acknowledgeDriveVisibility: true }, bob.token), 204);
			let file;
			const deadline = Date.now() + 40_000;
			while (!file && Date.now() < deadline) {
				const notes = ok(await call('i/notifications', { includeTypes: ['exportCompleted'], limit: 10 }, bob.token));
				const event = notes.find(n => n.exportedEntity === 'fukushu');
				if (event) file = ok(await call('drive/files/show', { fileId: event.fileId }, bob.token));
				else await setTimeout(500);
			}
			assert.ok(file);
			assert.equal(new URL(file.url).origin, origin);
			const exported = performance.now();
			const response = await fetch(file.url, { redirect: 'error' });
			assert.equal(response.status, 200);
			const rows = sourceFrames(Buffer.from(await response.arrayBuffer()));
			assert.equal(rows.filter(r => r.store === 'questions').length, 5000);
			const large = rows.find(r => r.blobSize === 24 * 1024 ** 2);
			assert.ok(large);
			assert.equal(createHash('sha256').update(large.binary).digest('hex'), large.value.id);
			const id = large.value.id;
			assert.equal((await call('fukushu/upstream/media', { id }, bob.token)).body.error.code, 'BACKUP_TOO_LARGE');
			assert.equal((await call('fukushu/upstream/media', { id, offset: 0 }, alice.token)).status, 404);
			const mediaDigest = createHash('sha256');
			for (let offset = 0; offset < large.binary.length;) {
				const page = ok(await call('fukushu/upstream/media', { id, offset }, bob.token));
				const bytes = Buffer.from(page.base64, 'base64');
				assert.equal(page.totalBytes, large.binary.length);
				assert.ok(bytes.length > 0 && bytes.length <= 1024 ** 2);
				assert.deepEqual(bytes, large.binary.subarray(offset, offset + bytes.length));
				mediaDigest.update(bytes);
				offset += bytes.length;
			}
			assert.equal(mediaDigest.digest('hex'), id);
			for (const offset of [256 * 1024 - 3, 8 * 1024 ** 2 - 3, large.binary.length - 3, large.binary.length, 2147483647]) {
				const page = ok(await call('fukushu/upstream/media', { id, offset }, bob.token));
				assert.deepEqual(Buffer.from(page.base64, 'base64'), large.binary.subarray(offset, offset + 1024 ** 2));
			}
			assert.deepEqual(rows.find(r => r.store === 'reviewLogs' && r.value.id === review.record.id).value, review.record);
			assert.deepEqual(rows.find(r => r.store === 'studyStates' && r.value.questionId === reviewInput.questionId).value.card, review.state.card);
			console.log(JSON.stringify({ bytes: blob.size, cards: 5000, baselineKiB, peakKiB, uploadMs: uploaded - started, importIncludingPollingMs: restored - uploaded, reviewAndReplayMs: reviewed - restored, exportIncludingPollingMs: exported - reviewed }));
		} finally { clearInterval(monitor); }
		// Fresh owner and source for the independent browser flow.
		await upload(credentials.dana);
	});
	await step('normal owner previews and appends a new GIFT deck, studies it and exports the original source', async () => {
		const owner = credentials.gift;
		const expected = ok(await call('fukushu/study/settings', {}, owner.token));
		const settings = { desiredRetention: 0.945, newQuestionsPerDay: 5, maxReviewsPerDay: 1 };
		assert.equal((await call('fukushu/study/settings', {})).status, 401);
		const update = (value, token = owner.token) => call('fukushu/study/update-settings', { expected, settings: value }, token);
		for (const invalid of [{ desiredRetention: 0.799 }, { newQuestionsPerDay: 201 }, { newQuestionsPerDay: 1.5 }, { maxReviewsPerDay: 0 }, { maxReviewsPerDay: 1001 }]) {
			assert.equal((await update({ ...settings, ...invalid })).status, 400);
		}
		assert.deepEqual(ok(await update(settings)), settings);
		assert.deepEqual(ok(await call('fukushu/study/settings', { ownerId: owner.id }, credentials.dana.token)), expected);
		const source = '$CATEGORY: Biology\n\n::leaf:: Leaves absorb light. {TRUE}\n\n::root:: Name the plant part. {=root}';
		const form = new FormData();
		form.set('i', owner.token); form.set('file', new Blob([source], { type: 'text/plain' }), 'biology.gift.txt');
		const file = ok(await readResponse(await fetch(origin + '/api/drive/files/create', { method: 'POST', body: form, headers: { origin } })));
		const input = { name: 'Biology GIFT', fileId: file.id, requestId: randomUUID() };
		const anonymous = await call('fukushu/upstream/create-gift', input);
		assert.equal(anonymous.status, 400);
		assert.equal(anonymous.body.error.code, 'ACCESS_DENIED');
		assert.equal((await call('fukushu/upstream/create-gift', { ...input, ownerId: owner.id }, alice.token)).status, 404);
		const preview = ok(await call('fukushu/upstream/create-gift', input, owner.token));
		assert.equal(preview.added, 2); assert.equal(preview.applied, false);
		const apply = () => call('fukushu/upstream/create-gift', { ...input, confirmToken: preview.token }, owner.token);
		const [created, replay] = await Promise.all([apply(), apply()]);
		assert.deepEqual(ok(created), ok(replay));
		const { records } = ok(await call('fukushu/upstream/show', { page: {} }, owner.token));
		const q = records.questions.find(q => q.deckId === input.requestId && q.kind === 'true-false');
		assert.ok(q);
		const review = ok(await call('fukushu/upstream/review', { questionId: q.id, requestId: randomUUID(), expectedRevision: 0, durationMs: 321, answers: ['true'], rating: 'good', correct: true }, owner.token));
		ok(await call('fukushu/upstream/export', { acknowledgeDriveVisibility: true }, owner.token), 204);
		let backup;
		const deadline = Date.now() + 40000;
		while (!backup && Date.now() < deadline) {
			const notes = ok(await call('i/notifications', { includeTypes: ['exportCompleted'], limit: 10 }, owner.token));
			const event = notes.find(n => n.exportedEntity === 'fukushu');
			if (event) backup = ok(await call('drive/files/show', { fileId: event.fileId }, owner.token));
			else await setTimeout(400);
		}
		assert.ok(backup);
		const response = await fetch(backup.url, { redirect: 'error' });
		assert.equal(response.status, 200);
		const bytes = Buffer.from(await response.arrayBuffer());
		const frames = sourceFrames(bytes);
		assert.equal(frames.find(f => f.store === 'decks' && f.value.id === input.requestId).value.sourceText, source);
		assert.deepEqual(frames.find(f => f.store === 'reviewLogs' && f.value.id === review.record.id).value, review.record);
		const now = new Date();
		const start = new Date(now);
		if (start.getHours() < 4) start.setDate(start.getDate() - 1);
		start.setHours(4, 0, 0, 0);
		const end = new Date(start);
		end.setDate(end.getDate() + 1);
		const day = { start: start.toISOString(), end: end.toISOString() };
		assert.equal((await call('fukushu/study/today', day)).status, 401);
		const today = ok(await call('fukushu/study/today', day, owner.token));
		const other = ok(await call('fukushu/study/today', { ...day, ownerId: owner.id }, credentials.dana.token));
		assert.deepEqual(other.items, []);
		assert.ok(today.items.some(item => item.origin === 'source' && item.question.deckId === input.requestId));
		await writeFile(join(directory, 'today.json'), JSON.stringify({ at: now.toISOString(), settings, record: review.record, questions: today.items.map(i => i.question.id) }));
		ok(await call('fukushu/materials/create', { material }, owner.token));
		const combined = ok(await call('fukushu/study/today', day, owner.token));
		const direct = combined.items.find(item => item.origin === 'native');
		assert.ok(direct);
		assert.ok(combined.items.some(item => item.origin === 'source'));
		const directRequest = { id: direct.deckId, questionId: direct.questionId, questionVersion: direct.version, expectedStateRevision: direct.revision, requestId: randomUUID(), rating: 'good', durationMs: 543 };
		const confirmed = ok(await call('fukushu/study/review', directRequest, owner.token));
		assert.deepEqual(ok(await call('fukushu/study/review', directRequest, owner.token)), confirmed);
		assert.equal((await call('fukushu/study/review', { ...directRequest, requestId: randomUUID() }, owner.token)).status, 409);
		assert.equal((await call('fukushu/materials/card-version', { id: direct.deckId, questionId: direct.questionId, version: direct.version }, credentials.dana.token)).status, 404);
		await writeFile(join(directory, 'newgift.fukushu'), bytes);
		await writeFile(join(directory, 'newgift.json'), JSON.stringify({ source, deckId: input.requestId, state: review.state, record: review.record }));
	});
});
