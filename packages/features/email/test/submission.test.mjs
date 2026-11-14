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
	const storage = {
		async put(key, bytes) { objects.set(key, Uint8Array.from(bytes)); },
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
		objects.clear(); submitted = []; outcomes = []; queued = [];
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
		const [confirmation] = await db.query('SELECT * FROM "mail_submission" WHERE "kind"=\'confirmation\'');
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

		await t.test('send and forwarding confirmation reject raw already claimed by collection', async () => {
			for (const operation of ['send', 'confirmation']) {
				await reset();
				const stage = store.stage.bind(store);
				store.stage = async bytes => {
					const raw = await stage(bytes);
					await db.query('UPDATE "mail_raw" SET "state"=\'deleting\' WHERE "id"=$1', [raw.id]);
					return raw;
				};
				if (operation === 'send') await assert.rejects(service.send('alice', input()), /UNAVAILABLE/);
				else await assert.rejects(service.configureForwarding('alice', { address: 'verified@example.com', keepLocalCopy: true }), /UNAVAILABLE/);
				assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
				assert.equal(await usage(), 0n);
			}
		});

		await t.test('composed sender identity is revalidated after staging', async () => {
			for (const operation of ['send', 'confirmation']) {
				await reset();
				const stage = store.stage.bind(store);
				store.stage = async bytes => {
					const raw = await stage(bytes);
					await db.query('UPDATE "user" SET "username"=\'renamed\',"usernameLower"=\'renamed\' WHERE "id"=\'alice\'');
					return raw;
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
			await assert.rejects(service.send('alice', input()), /QUOTA_EXCEEDED/);
			assert.equal(await usage(), 0n);
			assert.equal((await db.query('SELECT * FROM "mail_submission"')).length, 0);
			settings.quotaBytes = 100_000;
			settings.sendsPerHour = 1;
			await service.send('alice', input());
			const charged = await usage();
			await assert.rejects(service.send('alice', input()), /RATE_LIMITED/);
			assert.equal(await usage(), charged);
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
