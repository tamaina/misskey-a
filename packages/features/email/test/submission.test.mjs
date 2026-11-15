/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MailStore, UserMailboxService, parseIncomingMail } from '../../../backend/built/features/email/backend.js';
import { hasMailSql, mailSqlFixture } from './sql-fixture.mjs';

test('mail submission and forwarding SQL state machine', { skip: !hasMailSql }, async t => {
	const fixture = await mailSqlFixture();
	const { db } = fixture;
	const objects = new Map();
	let uploads = 0;
	const storage = {
		async put(key, bytes) { uploads++; objects.set(key, Uint8Array.from(bytes)); },
		async get(key) {
			if (!objects.has(key)) throw new Error('object missing');
			return objects.get(key);
		},
		async delete(key) { objects.delete(key); },
	};
	let settings;
	let store;
	let service;
	let submitted;
	let outcomes;
	let queued;
	const input = () => ({ to: ['first@example.com', 'second@example.com'], cc: [], bcc: ['hidden@example.com'], subject: 'Fixture', body: 'Hello', format: 'text', idempotencyKey: randomUUID() });
	const getSubmission = async id => (await db.query('SELECT * FROM "mail_submission" WHERE "id"=$1', [id]))[0];
	const usage = async () => BigInt((await db.query('SELECT "usedBytes" FROM "mail_account" WHERE "userId"=\'alice\''))[0].usedBytes);
	const reset = async () => {
		await db.query('TRUNCATE "user" CASCADE');
		await db.query('TRUNCATE "mail_raw" CASCADE');
		objects.clear(); uploads = 0; submitted = []; outcomes = []; queued = [];
		settings = { enabled: true, domain: 'mail.example', quotaBytes: 100_000, maxBytes: 25_000, spoolBytes: 1_000_000, maxRecipients: 20, sendsPerHour: 20,
															outbound: { host: '127.0.0.1', port: 1, tls: 'implicit' }, forwarding: { enabled: true, trustedIngress: true, loopChecked: true, forwardingRelay: true } };
		store = new MailStore(db, storage, settings.domain, BigInt(settings.quotaBytes), settings.maxBytes, BigInt(settings.spoolBytes), true);
		await db.query('INSERT INTO "user" ("id","username","usernameLower") VALUES (\'alice\',\'alice\',\'alice\'),(\'bob\',\'bob\',\'bob\')');
		await store.setEnabled('alice', true);
		await store.setEnabled('bob', true);
		const runtime = { settings, async getContext() { return { settings, store, storage }; }, async enqueueSubmission(id) { queued.push(id); } };
		service = new UserMailboxService({ url: 'https://social.example' }, db, runtime);
		// Explicit in-memory transport: these tests NEVER open an SMTP connection.
		service.transport = {
			async submit(raw, envelope) {
				submitted.push({ raw: Buffer.from(raw), envelope: structuredClone(envelope) });
				const result = outcomes.shift();
				if (result instanceof Error) throw result;
				return result ?? { state: 'submitted', accepted: envelope.to, rejected: [], retryableRecipients: [] };
			},
			close() {},
		};
	};
	const configureVerified = async () => {
		await service.configureForwarding('alice', { address: 'verified@example.com', keepLocalCopy: false });
		const [confirmation] = await db.query('SELECT * FROM "mail_submission" WHERE "kind"=\'confirmation\' ORDER BY "createdAt" DESC LIMIT 1');
		const [raw] = await db.query('SELECT "objectKey" FROM "mail_raw" WHERE "id"=$1', [confirmation.rawId]);
		const parsed = await parseIncomingMail(await storage.get(raw.objectKey));
		const token = /[?&]verify=([A-Za-z0-9_-]+)/.exec(parsed.text)?.[1];
		assert.ok(token);
		return { token, confirmation };
	};
	try {
		await t.test('sent copy is owner-only, charged once, and retry tombstones do not resend', async () => {
			await reset();
			const request = input();
			const sent = await service.send('alice', request);
			const firstUsage = await usage();
			assert.ok(firstUsage > 0n);
			assert.deepEqual(await service.send('alice', request), sent);
			assert.equal(await usage(), firstUsage);
			await assert.rejects(service.send('alice', { ...request, body: 'Changed' }), /CONFLICT/);
			assert.equal((await service.sent('bob', {})).length, 0);
			await assert.rejects(service.delete('bob', sent.id), /NOT_FOUND/);
			await service.delete('alice', sent.id);
			await service.delete('alice', sent.id);
			assert.equal(await usage(), 0n);
			const retry = await service.send('alice', request);
			assert.equal(retry.id, sent.id);
			assert.equal(retry.state, 'cancelled');
			await service.processSubmission(sent.id);
			assert.equal(submitted.length, 0);
		});

		await t.test('composed sender identity is revalidated during admission', async () => {
			for (const operation of ['send', 'confirmation']) {
				await reset();
				const stage = store.stage.bind(store);
				store.stage = async (bytes, admit) => {
					await db.query('UPDATE "user" SET "username"=\'renamed\',"usernameLower"=\'renamed\' WHERE "id"=\'alice\'');
					return stage(bytes, admit);
				};
				if (operation === 'send') await assert.rejects(service.send('alice', input()), /DISABLED|CONFLICT/);
				else await assert.rejects(service.configureForwarding('alice', { address: 'verified@example.com', keepLocalCopy: true }), /DISABLED|CONFLICT/);
				assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
				assert.equal(await usage(), 0n);
			}
		});

		await t.test('quota and hourly limit reject without submission or double charge', async () => {
			await reset();
			settings.quotaBytes = 1;
			for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(service.send('alice', input()), /QUOTA_EXCEEDED/);
			assert.equal(objects.size, 0);
			assert.equal(uploads, 0);
			assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 0);
			assert.equal(await usage(), 0n);
			assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
			settings.quotaBytes = 100_000;
			settings.sendsPerHour = 1;
			await service.send('alice', input());
			const charged = await usage();
			for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(service.send('alice', input()), /RATE_LIMITED/);
			assert.equal(objects.size, 1);
			assert.equal(uploads, 1);
			assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 1);
			assert.equal(await usage(), charged);
		});

		await t.test('forwarding cooldown rejects without uploading or retaining spool rows', async () => {
			await reset();
			await configureVerified();
			for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(service.configureForwarding('alice', { address: 'other@example.com', keepLocalCopy: true }), /RATE_LIMITED/);
			assert.equal(objects.size, 1);
			assert.equal(uploads, 1);
			assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 1);
			assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 1);
		});

		await t.test('upload failure rolls back admission but retains its journal for delayed collection', async () => {
			for (const operation of ['send', 'confirmation']) {
				await reset();
				const put = storage.put;
				storage.put = async (key, bytes) => { await put(key, bytes); throw new Error('upload failed'); };
				try {
					if (operation === 'send') await assert.rejects(service.send('alice', input()), /upload failed/);
					else await assert.rejects(service.configureForwarding('alice', { address: 'verified@example.com', keepLocalCopy: true }), /upload failed/);
				} finally { storage.put = put; }
				assert.equal(await usage(), 0n);
				assert.equal(objects.size, 1);
				assert.equal((await db.query('SELECT * FROM "mail_raw"'))[0].state, 'staging');
				assert.equal(await store.collect(), 0);
				await db.query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
				assert.equal(await store.collect(), 1);
				assert.equal(objects.size, 0);
				assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
				assert.equal((await db.query('SELECT * FROM "mail_forwarding"')).length, 0);
			}
		});

		await t.test('late completion of an aborted upload still has a durable spool journal', async () => {
			await reset();
			const put = storage.put;
			let finishRemotePut;
			storage.put = async (key, bytes) => {
				finishRemotePut = () => put(key, bytes);
				throw new Error('upload timed out');
			};
			try { await assert.rejects(service.send('alice', input()), /upload timed out/); } finally { storage.put = put; }
			assert.equal(await store.collect(), 0);
			assert.equal(objects.size, 0);
			await finishRemotePut();
			assert.equal(objects.size, 1);
			const [raw] = await db.query('SELECT * FROM "mail_raw"');
			assert.equal(raw.state, 'staging');
			assert.ok(raw.size > 0);
			assert.equal(await usage(), 0n);
			assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
			await db.query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			assert.equal(await store.collect(), 1);
			assert.equal(objects.size, 0);
		});

		await t.test('instance send limit rejects without object I/O or retained spool', async () => {
			await reset();
			await db.query(`INSERT INTO "mail_submission" ("id","userId","idempotencyKey","contentHash","kind","envelopeFrom","recipients","metadata","state","createdAt","expiresAt","nextAttemptAt","size")
				SELECT md5(n::text)::uuid,'bob',n::text,'hash','send','bob@mail.example','[]','{}','submitted',now(),now(),now(),0 FROM generate_series(1,500) n`);
			const remove = storage.delete;
			storage.delete = async () => { throw new Error('must not contact storage'); };
			try { await assert.rejects(service.send('alice', input()), /RATE_LIMITED/); } finally { storage.delete = remove; }
			assert.equal(objects.size, 0);
			assert.equal(uploads, 0);
			assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 0);
			assert.equal(await usage(), 0n);
		});

		await t.test('idempotency race rechecks before upload and discards losing reservation', async () => {
			for (const conflict of [false, true]) {
				await reset();
				const request = input();
				const stage = store.stage.bind(store);
				let winner;
				store.stage = async (bytes, admit) => {
					store.stage = stage;
					winner = await service.send('alice', conflict ? { ...request, body: 'different' } : request);
					return stage(bytes, admit);
				};
				if (conflict) await assert.rejects(service.send('alice', request), /CONFLICT/);
				else assert.deepEqual(await service.send('alice', request), winner);
				assert.equal(objects.size, 1);
				assert.equal(uploads, 1);
				assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 1);
				const rows = await db.query('SELECT * FROM "mail_submission"');
				assert.equal(rows.length, 1);
				assert.equal(await usage(), BigInt(rows[0].size));
			}
		});

		await t.test('uncertain successful commit never removes referenced raw bytes', async () => {
			await reset();
			const transaction = db.transaction.bind(db);
			let calls = 0;
			db.transaction = async work => {
				const result = await transaction(work);
				if (++calls === 2) throw new Error('commit acknowledgement lost');
				return result;
			};
			const request = input();
			try { await assert.rejects(service.send('alice', request), /commit acknowledgement lost/); } finally { db.transaction = transaction; }
			assert.equal(objects.size, 1);
			assert.equal((await db.query('SELECT * FROM "mail_raw"'))[0].state, 'ready');
			const retry = await service.send('alice', request);
			await service.processSubmission(retry.id);
			assert.equal((await getSubmission(retry.id)).state, 'submitted');
			assert.equal(objects.size, 1);
		});

		await t.test('failed finalization and failed cleanup keep uploaded bytes discoverable', async () => {
			await reset();
			const transaction = db.transaction.bind(db);
			const remove = storage.delete;
			db.transaction = work => transaction(manager => work({ async query(sql, params) {
				if (sql.startsWith('UPDATE "mail_raw" SET "state" = \'ready\'')) throw new Error('finalization failed');
				return manager.query(sql, params);
			} }));
			storage.delete = async () => { throw new Error('cleanup failed'); };
			try { await assert.rejects(service.send('alice', input()), /finalization failed/); } finally {
				db.transaction = transaction;
				storage.delete = remove;
			}
			assert.equal(await usage(), 0n);
			assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
			assert.equal((await db.query('SELECT * FROM "mail_raw"'))[0].state, 'staging');
			assert.equal(objects.size, 1);
			assert.equal(await store.collect(), 0);
			await db.query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			storage.delete = async () => { throw new Error('cleanup failed'); };
			try { await assert.rejects(store.collect(), /cleanup failed/); } finally { storage.delete = remove; }
			assert.equal((await db.query('SELECT * FROM "mail_raw"'))[0].state, 'deleting');
			assert.equal(await store.collect(), 1);
			assert.equal(objects.size, 0);
			assert.equal((await db.query('SELECT * FROM "mail_raw"')).length, 0);
		});

		await t.test('collection claim before upload is rejected as service unavailable', async () => {
			for (const operation of ['send', 'confirmation']) {
				await reset();
				const transaction = db.transaction.bind(db);
				let calls = 0;
				db.transaction = async work => {
					if (++calls === 2) await db.query('UPDATE "mail_raw" SET "state"=\'deleting\'');
					return transaction(work);
				};
				try {
					const promise = operation === 'send' ? service.send('alice', input()) : service.configureForwarding('alice', { address: 'verified@example.com', keepLocalCopy: true });
					await assert.rejects(promise, error => error.code === 'UNAVAILABLE');
				} finally { db.transaction = transaction; }
				assert.equal(objects.size, 0);
				assert.equal(await usage(), 0n);
				assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
			}
		});

		await t.test('recipient claim guard renews only a live matching attempt', async () => {
			for (const invalid of ['expired', 'unknown', 'replaced']) {
				await reset();
				const sent = await service.send('alice', input());
				service.transport = { async submit(_raw, _envelope, canSubmit) {
					assert.equal(await canSubmit(), true);
					const row = await getSubmission(sent.id);
					assert.ok(new Date(row.leaseUntil).getTime() > Date.now());
					if (invalid === 'expired') await db.query('UPDATE "mail_submission" SET "leaseUntil"=now()-interval \'1 second\' WHERE "id"=$1', [sent.id]);
					if (invalid === 'unknown') await db.query('UPDATE "mail_submission" SET "state"=\'unknown\' WHERE "id"=$1', [sent.id]);
					if (invalid === 'replaced') await db.query('UPDATE "mail_submission" SET "attemptId"=$2 WHERE "id"=$1', [sent.id, randomUUID()]);
					assert.equal(await canSubmit(), false);
					return { state: 'unknown', accepted: [], rejected: [], retryableRecipients: [] };
				}, close() {} };
				await service.processSubmission(sent.id);
				assert.equal(submitted.length, 0);
			}
		});

		await t.test('partial SMTP delivery retries only explicitly temporary recipients', async () => {
			await reset();
			const sent = await service.send('alice', input());
			outcomes.push({ state: 'submitted', accepted: ['first@example.com'], rejected: ['second@example.com', 'hidden@example.com'], retryableRecipients: ['second@example.com'], response: 'partial' });
			await service.processSubmission(sent.id);
			let row = await getSubmission(sent.id);
			assert.equal(row.state, 'queued');
			assert.deepEqual(row.recipients, ['second@example.com']);
			await service.processSubmission(sent.id);
			assert.equal(submitted.length, 1, 'backoff is honored');
			await db.query('UPDATE "mail_submission" SET "nextAttemptAt"=now()-interval \'1 minute\' WHERE "id"=$1', [sent.id]);
			await service.processSubmission(sent.id);
			row = await getSubmission(sent.id);
			assert.equal(row.state, 'submitted');
			assert.deepEqual(submitted[1].envelope.to, ['second@example.com']);
			assert.deepEqual(row.result.accepted, ['first@example.com', 'second@example.com']);
			assert.deepEqual(row.result.rejected, ['hidden@example.com']);
			assert.equal(submitted[0].raw.equals(submitted[1].raw), true, 'retries preserve Message-ID and MIME bytes');
			assert.doesNotMatch(submitted[0].raw.toString(), /^Bcc:/im);
		});

		await t.test('expired sending lease becomes unknown and is never automatically resent', async () => {
			await reset();
			const sent = await service.send('alice', input());
			await db.query('UPDATE "mail_submission" SET "state"=\'sending\',"attemptId"=$2,"leaseUntil"=now()-interval \'1 second\' WHERE "id"=$1', [sent.id, randomUUID()]);
			await service.dispatchSubmissions();
			assert.equal((await getSubmission(sent.id)).state, 'unknown');
			assert.equal(queued.length, 0);
			await service.processSubmission(sent.id);
			assert.equal(submitted.length, 0);
			const unknown = await service.send('alice', input());
			outcomes.push(new Error('socket closed after DATA'));
			await service.processSubmission(unknown.id);
			assert.equal((await getSubmission(unknown.id)).state, 'unknown');
			await service.processSubmission(unknown.id);
			assert.equal(submitted.length, 1);
		});

		await t.test('active submission cannot be deleted, collected, or claimed by a duplicate queue wake', { timeout: 10_000 }, async () => {
			await reset();
			const sent = await service.send('alice', input());
			let begin;
			let finish;
			const started = new Promise(resolve => { begin = resolve; });
			const barrier = new Promise(resolve => { finish = resolve; });
			let attempts = 0;
			service.transport = { async submit(_raw, envelope) {
				attempts++;
				begin();
				await barrier;
				return { state: 'submitted', accepted: envelope.to, rejected: [], retryableRecipients: [] };
			}, close() {} };
			const active = service.processSubmission(sent.id);
			await started;
			try {
				assert.equal((await getSubmission(sent.id)).state, 'sending');
				await assert.rejects(service.delete('alice', sent.id), /CONFLICT/);
				await db.query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
				assert.equal(await store.collect(), 0);
				await service.processSubmission(sent.id);
				assert.equal(attempts, 1);
			} finally {
				finish();
				await active;
			}
			assert.equal((await getSubmission(sent.id)).state, 'submitted');
		});

		await t.test('temporary raw-storage failure retries without opening SMTP', async () => {
			await reset();
			const sent = await service.send('alice', input());
			const saved = [...objects]; objects.clear();
			await service.processSubmission(sent.id);
			assert.equal((await getSubmission(sent.id)).state, 'queued');
			assert.equal(submitted.length, 0);
			for (const [key, value] of saved) objects.set(key, value);
			await db.query('UPDATE "mail_submission" SET "nextAttemptAt"=now()-interval \'1 minute\' WHERE "id"=$1', [sent.id]);
			await service.processSubmission(sent.id);
			assert.equal((await getSubmission(sent.id)).state, 'submitted');
		});

		await t.test('confirmation is owner-bound, one-use, and revision changes cancel queued forwards', async () => {
			await reset();
			const { token } = await configureVerified();
			assert.equal((await service.state('alice')).forwarding.verified, false);
			await assert.rejects(service.confirmForwarding('bob', { token }), /INVALID_INPUT/);
			await service.confirmForwarding('alice', { token });
			await assert.rejects(service.confirmForwarding('alice', { token }), /INVALID_INPUT/);
			assert.equal((await service.state('alice')).forwarding.verified, true);
			const raw = await store.stage(Buffer.from('Subject: original\r\n\r\nOriginal body'));
			await store.accept(raw.id, 'trusted_mta_delivery_123', 'alice@mail.example', 'original@example.com');
			const [forward] = await db.query('SELECT * FROM "mail_submission" WHERE "kind"=\'forward\'');
			await service.configureForwarding('alice', { address: null, keepLocalCopy: true });
			await service.processSubmission(forward.id);
			assert.equal((await getSubmission(forward.id)).state, 'cancelled');
			assert.equal(submitted.length, 0);
			await service.dispatchSubmissions();
			assert.equal((await getSubmission(forward.id)).rawId, null);
		});

		await t.test('invalid, expired, replaced and consumed forwarding tokens fail with TypeORM query results', async () => {
			await reset();
			const { token } = await configureVerified();
			await assert.rejects(service.confirmForwarding('alice', { token: 'invalid-token' }), /INVALID_INPUT/);
			assert.equal((await service.state('alice')).forwarding.verified, false);
			await db.query('UPDATE "mail_forwarding" SET "expiresAt"=now()-interval \'1 second\' WHERE "userId"=\'alice\'');
			await assert.rejects(service.confirmForwarding('alice', { token }), /INVALID_INPUT/);
			await db.query('UPDATE "mail_forwarding" SET "updatedAt"=now()-interval \'2 minutes\' WHERE "userId"=\'alice\'');
			const replacement = await configureVerified();
			await assert.rejects(service.confirmForwarding('alice', { token }), /INVALID_INPUT/);
			await service.confirmForwarding('alice', { token: replacement.token });
			await assert.rejects(service.confirmForwarding('alice', { token: replacement.token }), /INVALID_INPUT/);
			assert.equal((await service.state('alice')).forwarding.verified, true);
		});

		await t.test('queued forwarding stops when trusted-MTA safety contract is withdrawn', async () => {
			await reset();
			const { token } = await configureVerified();
			await service.confirmForwarding('alice', { token });
			const raw = await store.stage(Buffer.from('Subject: original\r\n\r\nOriginal body'));
			await store.accept(raw.id, 'trusted_mta_delivery_123', 'alice@mail.example', 'original@example.com');
			const [forward] = await db.query('SELECT * FROM "mail_submission" WHERE "kind"=\'forward\'');
			settings.forwarding.loopChecked = false;
			await service.processSubmission(forward.id);
			assert.equal((await getSubmission(forward.id)).state, 'cancelled');
			assert.equal(submitted.length, 0);
		});

		await t.test('forwarding worker independently rejects stale revision or changed destination', async () => {
			for (const changed of ['revision', 'address']) {
				await reset();
				const { token } = await configureVerified();
				await service.confirmForwarding('alice', { token });
				const raw = await store.stage(Buffer.from('Subject: original\r\n\r\nOriginal body'));
				await store.accept(raw.id, 'trusted_mta_delivery_123', 'alice@mail.example', 'original@example.com');
				const [forward] = await db.query('SELECT * FROM "mail_submission" WHERE "kind"=\'forward\'');
				// Bypass configure's eager cancellation to test the worker's final guard.
				if (changed === 'revision') await db.query('UPDATE "mail_forwarding" SET "revision"="revision"+1');
				else await db.query('UPDATE "mail_forwarding" SET "address"=\'changed@example.com\'');
				await service.processSubmission(forward.id);
				assert.equal((await getSubmission(forward.id)).state, 'cancelled');
				assert.equal(submitted.length, 0);
			}
		});

		await t.test('expired confirmation is rejected and outgoing identity changes cancel queued sends', async () => {
			await reset();
			const { token } = await configureVerified();
			await db.query('UPDATE "mail_forwarding" SET "expiresAt"=now()-interval \'1 second\'');
			await assert.rejects(service.confirmForwarding('alice', { token }), /INVALID_INPUT/);
			assert.equal((await service.state('alice')).forwarding.verified, false);
			const sent = await service.send('alice', input());
			await db.query('UPDATE "user" SET "username"=\'renamed\',"usernameLower"=\'renamed\' WHERE "id"=\'alice\'');
			await service.processSubmission(sent.id);
			assert.equal((await getSubmission(sent.id)).state, 'cancelled');
			assert.equal(submitted.length, 0);
		});

		await t.test('expired queue preserves prior successes and does not resend them', async () => {
			await reset();
			const sent = await service.send('alice', input());
			outcomes.push({ state: 'submitted', accepted: ['first@example.com'], rejected: ['second@example.com', 'hidden@example.com'], retryableRecipients: ['second@example.com'] });
			await service.processSubmission(sent.id);
			await db.query('UPDATE "mail_submission" SET "expiresAt"=now()-interval \'1 second\' WHERE "id"=$1', [sent.id]);
			await service.dispatchSubmissions();
			const row = await getSubmission(sent.id);
			assert.equal(row.state, 'submitted');
			assert.deepEqual(row.result.accepted, ['first@example.com']);
			assert.deepEqual(row.result.retryableRecipients, []);
			assert.equal(queued.length, 0);
			assert.equal(submitted.length, 1);
		});

		await t.test('worker-side expiry preserves partial successes without waiting for dispatcher', async () => {
			await reset();
			const sent = await service.send('alice', input());
			outcomes.push({ state: 'submitted', accepted: ['first@example.com'], rejected: ['second@example.com'], retryableRecipients: ['second@example.com'] });
			await service.processSubmission(sent.id);
			await db.query('UPDATE "mail_submission" SET "expiresAt"=now()-interval \'1 second\',"nextAttemptAt"=now()-interval \'1 second\' WHERE "id"=$1', [sent.id]);
			await service.processSubmission(sent.id);
			const row = await getSubmission(sent.id);
			assert.equal(row.state, 'submitted');
			assert.deepEqual(row.result.accepted, ['first@example.com']);
			assert.deepEqual(row.result.retryableRecipients, []);
			assert.equal(submitted.length, 1);
		});

		await t.test('sent-copy reference prevents raw GC; deletion releases quota and raw', async () => {
			await reset();
			const sent = await service.send('alice', input());
			await service.processSubmission(sent.id);
			await db.query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			assert.equal(await store.collect(), 0);
			await service.delete('alice', sent.id);
			assert.equal(await usage(), 0n);
			assert.equal(await store.collect(), 1);
			assert.equal(objects.size, 0);
		});
	} finally {
		await fixture.close();
	}
});
