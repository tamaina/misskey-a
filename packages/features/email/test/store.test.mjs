/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { MailStore } from '../../../backend/built/features/email/backend.js';
import { MailFoundation1794697200000 } from '../../../backend/migration/1794697200000-MailFoundation.js';
import { MailSubmissions1794697200001 } from '../../../backend/migration/1794697200001-MailSubmissions.js';

// Optional real SQL suite. No dependency is added for PGlite: point the variable
// at a separately installed official package. It validates SQL, NOT concurrency.
// MAIL_TEST_DATABASE_URL selects a disposable PostgreSQL test database instead.
const connectionString = process.env.MAIL_TEST_DATABASE_URL;
const pgliteModule = process.env.MAIL_TEST_PGLITE_MODULE;

test('mail persistence against PostgreSQL SQL semantics', { skip: !connectionString && !pgliteModule }, async t => {
	let connection;
	if (connectionString) {
		const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
		const { Client } = require('pg');
		connection = new Client({ connectionString });
		await connection.connect();
	} else {
		const { PGlite } = await import(pgliteModule);
		connection = new PGlite();
	}
	const query = async (sql, params) => (await connection.query(sql, params)).rows;
	const db = {
		query,
		async transaction(work) {
			await query('BEGIN');
			try {
				const result = await work({ query });
				await query('COMMIT');
				return result;
			} catch (error) {
				await query('ROLLBACK');
				throw error;
			}
		},
	};
	const schema = `mail_test_${randomUUID().replaceAll('-', '')}`;
	const objects = new Map();
	const storage = {
		async put(key, raw) { objects.set(key, Uint8Array.from(raw)); },
		async get(key) {
			assert.ok(objects.has(key), 'raw object exists');
			return objects.get(key);
		},
		async delete(key) { objects.delete(key); },
	};
	const raw = Buffer.from('Subject: fixture\r\n\r\nbody');
	const deliveryId = 'trusted_mta_queue_12345';
	const sender = 'sender@example.com';
	const migration = new MailFoundation1794697200000();
	const migration2 = new MailSubmissions1794697200001();
	const store = new MailStore(db, storage, 'mail.example', BigInt(raw.length * 2));
	const reset = async () => {
		await query('TRUNCATE "user" CASCADE');
		await query('TRUNCATE "mail_raw" CASCADE');
		objects.clear();
		await query('INSERT INTO "user" ("id","usernameLower") VALUES (\'alice\',\'alice\'),(\'bob\',\'bob\')');
		await store.setEnabled('alice', true);
		await store.setEnabled('bob', true);
	};
	const usage = async userId => BigInt((await query('SELECT "usedBytes" FROM "mail_account" WHERE "userId"=$1', [userId]))[0].usedBytes);
	try {
		await query(`CREATE SCHEMA "${schema}"`);
		await query(`SET search_path TO "${schema}"`);
		await query('CREATE TABLE "user" ("id" varchar(32) PRIMARY KEY, "usernameLower" varchar(128), "host" varchar(128), "isSuspended" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false)');
		await migration.up({ query });
		await migration2.up({ query });

		await t.test('recipient opt-in, account state, and owner-scoped raw/deletion', async () => {
			await reset();
			const staged = await store.stage(raw);
			const accepted = await store.accept(staged.id, deliveryId, 'alice+tag@mail.example', sender);
			assert.deepEqual(await store.readRaw('alice', accepted.id), Uint8Array.from(raw));
			await assert.rejects(store.readRaw('bob', accepted.id), /NOT_FOUND/);
			await assert.rejects(store.remove('bob', accepted.id), /NOT_FOUND/);
			await store.setEnabled('bob', false);
			await assert.rejects(store.resolveRecipient('bob@mail.example'), /RECIPIENT_UNAVAILABLE/);
			await query('UPDATE "user" SET "isSuspended"=true WHERE "id"=$1', ['alice']);
			await assert.rejects(store.resolveRecipient('alice@mail.example'), /RECIPIENT_UNAVAILABLE/);
			assert.equal(await usage('alice'), BigInt(raw.length));
		});

		await t.test('recipient rename between initial resolution and acceptance is rejected', async () => {
			await reset();
			const staged = await store.stage(raw);
			const racing = new MailStore({
				...db,
				async transaction(work) {
					// Deterministic interleaving, not a multi-connection lock test.
					await query('UPDATE "user" SET "usernameLower"=$1 WHERE "id"=$2', ['renamed', 'alice']);
					return db.transaction(work);
				},
			}, storage, 'mail.example', 1000n);
			await assert.rejects(racing.accept(staged.id, deliveryId, 'alice@mail.example', sender), /RECIPIENT_UNAVAILABLE/);
			assert.equal(await usage('alice'), 0n);
			assert.equal((await query('SELECT * FROM "mail_delivery"')).length, 0);
		});

		await t.test('outbox DB failure rolls back delivery and quota before success', async () => {
			await reset();
			const staged = await store.stage(raw);
			const failing = new MailStore({
				...db,
				async transaction(work) {
					return db.transaction(manager => work({
						async query(sql, params) {
							if (sql.includes('INSERT INTO "mail_outbox"')) throw new Error('outbox write failed');
							return manager.query(sql, params);
						},
					}));
				},
			}, storage, 'mail.example', 1000n);
			await assert.rejects(failing.accept(staged.id, deliveryId, 'alice@mail.example', sender), /outbox write failed/);
			assert.equal(await usage('alice'), 0n);
			assert.equal((await query('SELECT * FROM "mail_delivery"')).length, 0);
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 0);
			assert.equal((await store.accept(staged.id, deliveryId, 'alice@mail.example', sender)).duplicate, false);
		});

		await t.test('retry uses raw hash and sender, not Message-ID; never charges twice', async () => {
			await reset();
			const first = await store.stage(raw);
			const accepted = await store.accept(first.id, deliveryId, 'alice@mail.example', sender);
			const retry = await store.stage(raw);
			assert.deepEqual(await store.accept(retry.id, deliveryId, 'alice@mail.example', sender), { id: accepted.id, duplicate: true });
			await assert.rejects(store.accept(retry.id, deliveryId, 'alice@mail.example', 'different@example.com'), /RETRY_CONFLICT/);
			const changed = await store.stage(Buffer.from('different content'));
			await assert.rejects(store.accept(changed.id, deliveryId, 'alice@mail.example', sender), /RETRY_CONFLICT/);
			assert.equal(await usage('alice'), BigInt(raw.length));
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 1);
			assert.equal((await query('SELECT * FROM "mail_delivery"')).length, 1);
		});

		await t.test('deletion tombstone stops retries from resurrecting inbox or quota', async () => {
			await reset();
			const first = await store.stage(raw);
			const accepted = await store.accept(first.id, deliveryId, 'alice@mail.example', sender);
			await store.remove('alice', accepted.id);
			await store.remove('alice', accepted.id);
			assert.equal(await usage('alice'), 0n);
			await assert.rejects(store.readRaw('alice', accepted.id), /NOT_FOUND/);
			const retry = await store.stage(raw);
			assert.deepEqual(await store.accept(retry.id, deliveryId, 'alice@mail.example', sender), { id: accepted.id, duplicate: true });
			assert.equal(await usage('alice'), 0n);
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 0);
			await store.completeParse(accepted.id, { text: 'late worker' });
			assert.equal((await query('SELECT "parsed" FROM "mail_delivery" WHERE "id"=$1', [accepted.id]))[0].parsed, null);
		});

		await t.test('quota rejection rolls back only that recipient and preserves others', async () => {
			await reset();
			const staged = await store.stage(raw);
			await store.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			await store.accept(staged.id, `${deliveryId}_2`, 'alice@mail.example', sender);
			await assert.rejects(store.accept(staged.id, `${deliveryId}_3`, 'alice@mail.example', sender), /QUOTA_EXCEEDED/);
			await store.accept(staged.id, `${deliveryId}_3`, 'bob@mail.example', sender);
			assert.equal(await usage('alice'), BigInt(raw.length * 2));
			assert.equal(await usage('bob'), BigInt(raw.length));
			assert.equal((await query('SELECT * FROM "mail_delivery"')).length, 3);
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 3);
		});

		await t.test('outbox survives queue loss and only parse completion removes it', async () => {
			await reset();
			const staged = await store.stage(raw);
			const accepted = await store.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			await assert.rejects(store.dispatch(async () => { throw new Error('Redis unavailable'); }), /Redis unavailable/);
			const enqueued = [];
			assert.equal(await store.dispatch(async id => { enqueued.push(id); }), 1);
			assert.equal(await store.dispatch(async id => { enqueued.push(id); }), 1);
			assert.deepEqual(enqueued, [accepted.id, accepted.id]);
			await store.completeParse(accepted.id, { text: 'decoded' });
			await store.completeParse(accepted.id, null);
			assert.equal(await store.dispatch(async () => assert.fail('completed work must not replay')), 0);
			assert.equal((await query('SELECT "parseState" FROM "mail_delivery" WHERE "id"=$1', [accepted.id]))[0].parseState, 'parsed');
			assert.deepEqual(await store.readRaw('alice', accepted.id), Uint8Array.from(raw));
		});

		await t.test('raw cleanup retains shared references and resumes failed object deletion', async () => {
			await reset();
			const staged = await store.stage(raw);
			const alice = await store.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			const bob = await store.accept(staged.id, deliveryId, 'bob@mail.example', sender);
			await query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			await store.remove('alice', alice.id);
			assert.equal(await store.collect(), 0);
			assert.deepEqual(await store.readRaw('bob', bob.id), Uint8Array.from(raw));
			await store.remove('bob', bob.id);
			const failing = new MailStore(db, { ...storage, async delete() { throw new Error('object service down'); } }, 'mail.example', 1000n);
			await assert.rejects(failing.collect(), /object service down/);
			assert.equal((await query('SELECT "state" FROM "mail_raw"'))[0].state, 'deleting');
			assert.equal(await store.collect(), 1);
			assert.equal(objects.size, 0);
			assert.equal((await query('SELECT * FROM "mail_raw"')).length, 0);
		});

		await t.test('upload and ready transition hold the same raw row lock used by collection', async () => {
			await reset();
			let rawLocked = false;
			let uploadedUnderLock = false;
			let finalizedUnderLock = false;
			const trackedDb = {
				...db,
				async transaction(work) {
					try {
						return await db.transaction(manager => work({
							async query(sql, params) {
								const rows = await manager.query(sql, params);
								if (sql.includes('FROM "mail_raw"') && sql.includes('FOR UPDATE')) rawLocked = true;
								if (sql.startsWith('UPDATE "mail_raw" SET "state"')) {
									assert.ok(rawLocked);
									assert.ok(uploadedUnderLock);
									finalizedUnderLock = true;
								}
								return rows;
							},
						}));
					} finally {
						rawLocked = false;
					}
				},
			};
			const tracked = new MailStore(trackedDb, {
				...storage,
				async put(key, bytes) {
					assert.ok(rawLocked, 'GC cannot acquire the row before upload/finalization finish');
					uploadedUnderLock = true;
					await storage.put(key, bytes);
				},
			}, 'mail.example', 1000n);
			const staged = await tracked.stage(raw);
			assert.ok(finalizedUnderLock);
			assert.equal(rawLocked, false);
			assert.equal((await query('SELECT "state" FROM "mail_raw" WHERE "id"=$1', [staged.id]))[0].state, 'ready');
		});

		await t.test('failed uploads stay discoverable and never become accepted', async () => {
			await reset();
			const failing = new MailStore(db, { ...storage, async put() { throw new Error('upload failed'); } }, 'mail.example', 1000n);
			await assert.rejects(failing.stage(raw), /upload failed/);
			const [staging] = await query('SELECT * FROM "mail_raw"');
			assert.equal(staging.state, 'staging');
			await assert.rejects(store.accept(staging.id, deliveryId, 'alice@mail.example', sender), /RAW_UNAVAILABLE/);
			await query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			assert.equal(await store.collect(), 1);
			assert.equal(await usage('alice'), 0n);
		});

		await t.test('physical spool quota counts orphan/retry uploads and recovers after collection', async () => {
			await reset();
			const limited = new MailStore(db, storage, 'mail.example', 1000n, raw.length, BigInt(raw.length));
			await limited.stage(raw);
			await assert.rejects(limited.stage(raw), /QUOTA_EXCEEDED/);
			assert.equal(objects.size, 1);
			assert.equal((await query('SELECT * FROM "mail_raw"')).length, 1);
			await query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			assert.equal(await limited.collect(), 1);
			await limited.stage(raw);
			assert.equal(objects.size, 1);
		});

		await t.test('parse projection rejects binary and oversized JSON without losing recovery work', async () => {
			await reset();
			const staged = await store.stage(raw);
			const accepted = await store.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			await assert.rejects(store.completeParse(accepted.id, { attachment: new Uint8Array([1, 2]) }), /Attachment bytes/);
			await assert.rejects(store.completeParse(accepted.id, { attachment: Buffer.from('binary') }), /Attachment bytes/);
			await assert.rejects(store.completeParse(accepted.id, { text: 'x'.repeat(1024 * 1024) }), /projection too large/);
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 1);
			assert.equal((await query('SELECT "parseState" FROM "mail_delivery"'))[0].parseState, 'pending');
			await store.completeParse(accepted.id, null);
			assert.equal((await query('SELECT "parseState" FROM "mail_delivery"'))[0].parseState, 'failed');
			assert.deepEqual(await store.readRaw('alice', accepted.id), Uint8Array.from(raw));
		});

		await t.test('verified forwarding without a local copy retains raw through the submission reference', async () => {
			await reset();
			const forwardingStore = new MailStore(db, storage, 'mail.example', 0n, 1000, 1000n, true);
			await query('INSERT INTO "mail_forwarding" ("userId","address","enabled","keepLocalCopy","revision","verifiedAt","updatedAt") VALUES (\'alice\',\'verified@example.com\',true,false,3,now(),now())');
			const staged = await forwardingStore.stage(raw);
			const accepted = await forwardingStore.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			const [delivery] = await query('SELECT * FROM "mail_delivery" WHERE "id"=$1', [accepted.id]);
			assert.equal(delivery.localStored, false);
			assert.equal(delivery.localError, 'disabled');
			assert.equal(delivery.rawId, null);
			assert.equal(await usage('alice'), 0n);
			await assert.rejects(forwardingStore.readRaw('alice', accepted.id), /NOT_FOUND/);
			assert.equal((await query('SELECT * FROM "mail_outbox"')).length, 0);
			const [submission] = await query('SELECT * FROM "mail_submission"');
			assert.equal(submission.forwardingRevision, 3);
			assert.deepEqual(submission.recipients, ['verified@example.com']);
			assert.equal(submission.rawId, staged.id);
			assert.equal(submission.envelopeFrom, sender);
			assert.equal((await forwardingStore.accept(staged.id, deliveryId, 'alice@mail.example', sender)).duplicate, true);
			assert.equal((await query('SELECT * FROM "mail_submission"')).length, 1);
			await forwardingStore.remove('alice', accepted.id);
			await query('UPDATE "mail_raw" SET "createdAt"=now()-interval \'2 days\'');
			assert.equal(await forwardingStore.collect(), 0, 'active forwarding remains a raw owner after inbox deletion');
			await query('UPDATE "mail_submission" SET "rawId"=NULL,"state"=\'submitted\'');
			assert.equal(await forwardingStore.collect(), 1);
		});

		await t.test('verified forwarding survives local quota; unverified or disabled forwarding cannot bypass quota', async () => {
			await reset();
			const forwardingStore = new MailStore(db, storage, 'mail.example', 0n, 1000, 1000n, true);
			await query('INSERT INTO "mail_forwarding" ("userId","address","enabled","keepLocalCopy","revision","verifiedAt","updatedAt") VALUES (\'alice\',\'verified@example.com\',true,true,7,now(),now())');
			const staged = await forwardingStore.stage(raw);
			const accepted = await forwardingStore.accept(staged.id, deliveryId, 'alice@mail.example', sender);
			const [delivery] = await query('SELECT * FROM "mail_delivery" WHERE "id"=$1', [accepted.id]);
			assert.equal(delivery.localError, 'quota');
			assert.equal(delivery.localStored, false);
			assert.equal(await usage('alice'), 0n);
			await query('UPDATE "mail_forwarding" SET "verifiedAt"=NULL');
			await assert.rejects(forwardingStore.accept(staged.id, `${deliveryId}_2`, 'alice@mail.example', sender), /QUOTA_EXCEEDED/);
			await query('UPDATE "mail_forwarding" SET "verifiedAt"=now(),"enabled"=false');
			await assert.rejects(forwardingStore.accept(staged.id, `${deliveryId}_3`, 'alice@mail.example', sender), /QUOTA_EXCEEDED/);
			await query('UPDATE "mail_forwarding" SET "enabled"=true');
			const globallyDisabled = new MailStore(db, storage, 'mail.example', 0n, 1000, 1000n, false);
			await assert.rejects(globallyDisabled.accept(staged.id, `${deliveryId}_4`, 'alice@mail.example', sender), /QUOTA_EXCEEDED/);
		});

		await t.test('migration can roll back and be reapplied', async () => {
			await migration2.down({ query });
			await migration.down({ query });
			assert.equal((await query('SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name LIKE \'mail_%\'', [schema])).length, 0);
			await migration.up({ query });
			await migration2.up({ query });
			assert.equal((await query('SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name LIKE \'mail_%\'', [schema])).length, 6);
		});
	} finally {
		await query('SET search_path TO public');
		await query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
		if (connectionString) await connection.end();
		else await connection.close();
	}
});

// These assertions need independent server connections. PGlite serializes its
// transactions and therefore cannot validate the production row/advisory locks.
test('mail concurrent retry and quota serialization on PostgreSQL', { skip: !connectionString }, async () => {
	const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
	const { Client, Pool } = require('pg');
	const admin = new Client({ connectionString });
	await admin.connect();
	const schema = `mail_concurrent_${randomUUID().replaceAll('-', '')}`;
	let pool;
	try {
		await admin.query(`CREATE SCHEMA "${schema}"`);
		pool = new Pool({ connectionString, options: `-c search_path=${schema}`, max: 4 });
		const db = {
			async query(sql, params) { return (await pool.query(sql, params)).rows; },
			async transaction(work) {
				const client = await pool.connect();
				try {
					await client.query('BEGIN');
					const result = await work({ async query(sql, params) { return (await client.query(sql, params)).rows; } });
					await client.query('COMMIT');
					return result;
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				} finally {
					client.release();
				}
			},
		};
		await db.query('CREATE TABLE "user" ("id" varchar(32) PRIMARY KEY, "usernameLower" varchar(128), "host" varchar(128), "isSuspended" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false)');
		await new MailFoundation1794697200000().up(db);
		await new MailSubmissions1794697200001().up(db);
		await db.query('INSERT INTO "user" ("id","usernameLower") VALUES (\'alice\',\'alice\')');
		const objects = new Map();
		const storage = {
			async put(key, bytes) { objects.set(key, bytes); },
			async get(key) { return objects.get(key); },
			async delete(key) { objects.delete(key); },
		};
		const raw = Buffer.from('Subject: concurrent\r\n\r\nbody');
		const store = new MailStore(db, storage, 'mail.example', BigInt(raw.length));
		await store.setEnabled('alice', true);
		const [a, b] = await Promise.all([store.stage(raw), store.stage(raw)]);
		const accepts = await Promise.all([
			store.accept(a.id, 'concurrent_retry_id_123', 'alice@mail.example', 'sender@example.com'),
			store.accept(b.id, 'concurrent_retry_id_123', 'alice@mail.example', 'sender@example.com'),
		]);
		assert.equal(accepts[0].id, accepts[1].id);
		assert.deepEqual(accepts.map(result => result.duplicate).sort(), [false, true]);
		assert.equal(BigInt((await db.query('SELECT "usedBytes" FROM "mail_account"'))[0].usedBytes), BigInt(raw.length));
		await Promise.all([store.remove('alice', accepts[0].id), store.remove('alice', accepts[0].id)]);
		assert.equal(BigInt((await db.query('SELECT "usedBytes" FROM "mail_account"'))[0].usedBytes), 0n);
		const quota = await Promise.allSettled([
			store.accept(a.id, 'concurrent_new_id_123', 'alice@mail.example', 'sender@example.com'),
			store.accept(b.id, 'concurrent_new_id_456', 'alice@mail.example', 'sender@example.com'),
		]);
		assert.equal(quota.filter(result => result.status === 'fulfilled').length, 1);
		const rejected = quota.find(result => result.status === 'rejected');
		assert.equal(rejected.reason.code, 'QUOTA_EXCEEDED');
		assert.equal(BigInt((await db.query('SELECT "usedBytes" FROM "mail_account"'))[0].usedBytes), BigInt(raw.length));
	} finally {
		if (pool) await pool.end();
		await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
		await admin.end();
	}
});
