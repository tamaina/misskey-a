/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createRouterClient } from '@orpc/server';
import { PeerBroadcastStart1792101000000 as BroadcastMigration } from '../../../backend/migration/1792101000000-PeerBroadcastStart.js';
import { createPeerPaymentStore, createPeerPaymentRouter, publicPeerTransfer } from '../../../backend/built/features/billing/backend.js';
import { PeerPayments1791950000000 as Migration } from '../../../backend/migration/1791950000000-PeerPayments.js';
import { BillingWalletRegistration1791760200000 as WalletMigration } from '../../../backend/migration/1791760200000-BillingWalletRegistration.js';
const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { DataSource } = require('typeorm');
const url = process.env.MISSKEY_BILLING_TEST_DATABASE_URL;
const address = n => `0x${n.toString(16).padStart(40, '0')}`, hash = n => `0x${n.toString(16).padStart(64, '0')}`;
const token = { id: 'token', name: 'Synthetic token', chainId: 123456, contractAddress: address(3), tokenSymbol: 'TEST', decimals: 6, confirmationsRequired: 3, isEnabled: true };

test('synthetic opt-in addresses and atomic peer intent evidence', { skip: !url }, async t => {
	assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname));
	const schema = `peer_test_${randomUUID().replaceAll('-', '')}`;
	const db = new DataSource({ type: 'postgres', url, schema, extra: { options: `-c search_path=${schema}`, application_name: 'misskey-peer-synthetic' }, entities: (await import('../../../backend/built/postgres.js')).entities });
	await db.initialize(); const qr = db.createQueryRunner();
	let sequence = 0, now = Date.parse('2026-01-01T00:00:00Z');
	const store = createPeerPaymentStore(db, () => `synthetic-${++sequence}`, () => now);
	const input = { requestKey: 'key', walletId: 'alice-wallet', recipientUserId: 'bob', recipientAddress: address(2), tokenId: token.id, amountBaseUnits: '7' };
	const proof = row => ({ status: 'confirmed', evidence: { chainId: row.chainId, txHash: row.txHash, timestamp: row.createdAt,
																																																										transfers: [{ logIndex: 2, contractAddress: token.contractAddress, fromAddress: row.terms.fromAddress, toAddress: row.terms.toAddress, amountBaseUnits: row.terms.amountBaseUnits }] } });
	try {
		await qr.query(`CREATE SCHEMA "${schema}"`);
		await qr.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY, host varchar(128), "isSuspended" boolean NOT NULL DEFAULT false, "movedToUri" varchar(512))');
		await qr.query('INSERT INTO "user" (id) VALUES (\'alice\'),(\'bob\'),(\'carol\')');
		await qr.query('CREATE TABLE user_profile ("userId" varchar(32) PRIMARY KEY, "billingResidence" jsonb)');
		await qr.query('CREATE TABLE billing_policy (id varchar(32) PRIMARY KEY, revision integer, policy jsonb, "updatedAt" timestamptz, "updatedByUserId" varchar(32))');
		await qr.query('INSERT INTO user_profile SELECT id, $1::jsonb FROM "user"', [JSON.stringify({ country: 'JP', subdivision: 'JP-13', revision: 1, declaredAt: now, kind: 'self_declared' })]);
		await new WalletMigration().up(qr);
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'alice-wallet\',\'alice\',123456,$1,NULL,$3,$3),(\'bob-wallet\',\'bob\',123456,$2,\'private label\',$3,$3)', [address(1), address(2), now]);
		const migration = new Migration(); await migration.up(qr); await migration.down(qr); await migration.up(qr);
		await new BroadcastMigration().up(qr); await new BroadcastMigration().down(qr); await new BroadcastMigration().up(qr);
		const pending = (await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_peer_(token|intent)"|"billing_wallet"/.test(row.query) && !/billing_wallet_challenge/.test(row.query));
		assert.deepEqual(pending, [], 'Unapplied draft migration agrees with entity metadata');
		await store.saveToken(token);
		await t.test('old private links stay private, owner-only publication and strict public projection', async () => {
			assert.deepEqual(await store.publicWallets('bob'), []);
			assert.equal((await store.ownPublication('bob'))[0].isPublic, false);
			await assert.rejects(store.prepare('alice', input), error => error.code === 'PEER_UNAVAILABLE');
			await assert.rejects(store.publish('carol', 'bob-wallet', true), error => error.code === 'PEER_NOT_FOUND');
			await store.publish('bob', 'bob-wallet', true);
			assert.deepEqual(await store.publicWallets('bob'), [{ chainId: token.chainId, address: address(2) }]);
		});
		await t.test('prepare is idempotent, snapshots participants and rejects alien wallets/self recipients', async () => {
			const rows = await Promise.all([store.prepare('alice', input), store.prepare('alice', input)]); assert.equal(rows[0].id, rows[1].id);
			await assert.rejects(store.prepare('alice', { ...input, amountBaseUnits: '8' }), error => error.code === 'PEER_CONFLICT');
			await assert.rejects(store.prepare('carol', { ...input, requestKey: 'other' }), error => error.code === 'PEER_UNAVAILABLE');
			await assert.rejects(store.prepare('alice', { ...input, recipientUserId: 'alice', requestKey: 'self' }), error => error.code === 'PEER_UNAVAILABLE');
			const dto = publicPeerTransfer(rows[0]); assert.equal(dto.data.length, 138); assert.equal('senderWalletId' in dto, false); assert.equal('label' in dto, false);
		});
		await t.test('missing or newly incomplete residence blocks only new intent creation', async () => {
			const existing = await store.prepare('alice', input);
			await qr.query('UPDATE user_profile SET "billingResidence"=NULL WHERE "userId"=$1', ['alice']);
			await assert.rejects(store.prepare('alice', { ...input, requestKey: 'missing-residence' }), error => error.code === 'RESIDENCE_REQUIRED');
			assert.equal((await store.prepare('alice', input)).id, existing.id);
			await store.submit('alice', existing.id); await store.list('alice');
			const incomplete = { country: 'US', subdivision: null, revision: 2, declaredAt: now, kind: 'self_declared' };
			await qr.query('UPDATE user_profile SET "billingResidence"=$1::jsonb WHERE "userId"=$2', [JSON.stringify(incomplete), 'alice']);
			await qr.query('INSERT INTO billing_policy (id, policy) VALUES (\'server\', \'{"residenceRequiredSubdivisions":["US"]}\')');
			await assert.rejects(store.prepare('alice', { ...input, requestKey: 'incomplete-residence' }), error => error.code === 'RESIDENCE_REQUIRED');
			assert.equal((await store.prepare('alice', input)).id, existing.id);
			await qr.query('UPDATE user_profile SET "billingResidence"=$1::jsonb WHERE "userId"=$2', [JSON.stringify({ ...incomplete, subdivision: 'US-CA', revision: 3 }), 'alice']);
			assert.ok(await store.prepare('alice', { ...input, requestKey: 'registered-residence' }));
		});
		await t.test('broadcast start is sender-only, residence-gated and one-shot; unknown outcomes recover only by hash', async () => {
			const row = await store.prepare('alice', { ...input, requestKey: 'broadcast' });
			await assert.rejects(store.start('bob', row.id), error => error.code === 'PEER_NOT_FOUND');
			const saved = (await qr.query('SELECT "billingResidence" FROM user_profile WHERE "userId"=$1', ['alice']))[0].billingResidence;
			await qr.query('UPDATE user_profile SET "billingResidence"=NULL WHERE "userId"=$1', ['alice']);
			await assert.rejects(store.start('alice', row.id), error => error.code === 'RESIDENCE_REQUIRED');
			await qr.query('UPDATE user_profile SET "billingResidence"=$1::jsonb WHERE "userId"=$2', [JSON.stringify(saved), 'alice']);
			const attempts = await Promise.allSettled([store.start('alice', row.id), store.start('alice', row.id)]);
			assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
			assert.equal(attempts.find(item => item.status === 'rejected').reason.code, 'PEER_CONFLICT');
			assert.equal((await store.list('alice')).find(item => item.id === row.id).broadcastStartedAt, now);
			await assert.rejects(store.start('alice', row.id), error => error.code === 'PEER_CONFLICT');
			await qr.query('UPDATE user_profile SET "billingResidence"=NULL WHERE "userId"=$1', ['alice']);
			assert.equal((await store.submit('alice', row.id, hash(88))).txHash, hash(88));
			await store.apply('bob', row.id, hash(88), { status: 'pending' });
			assert.equal((await store.prepare('alice', { ...input, requestKey: 'broadcast' })).broadcastStartedAt, now);
			await qr.query('UPDATE user_profile SET "billingResidence"=$1::jsonb WHERE "userId"=$2', [JSON.stringify(saved), 'alice']);
			await assert.rejects(new BroadcastMigration().down(qr), /Retain broadcast/);
			const expired = await store.prepare('alice', { ...input, requestKey: 'expired-before-broadcast' });
			now += 1800001;
			try { await assert.rejects(store.start('alice', expired.id), error => error.code === 'PEER_UNAVAILABLE'); } finally { now -= 1800001; }
		});
		await t.test('withdrawal prevents new preparation while prior snapshots remain checkable', async () => {
			await store.publish('bob', 'bob-wallet', false); assert.deepEqual(await store.publicWallets('bob'), []);
			await assert.rejects(store.prepare('alice', { ...input, requestKey: 'withdrawn' }), error => error.code === 'PEER_UNAVAILABLE');
			assert.equal((await store.prepare('alice', input)).terms.toAddress, address(2)); await store.publish('bob', 'bob-wallet', true);
		});
		await t.test('only payer binds a hash; both participants retry and nonparticipants see nothing', async () => {
			const row = (await store.list('alice'))[0];
			await assert.rejects(store.submit('carol', row.id, hash(1)), error => error.code === 'PEER_NOT_FOUND');
			await assert.rejects(store.submit('bob', row.id, hash(1)), error => error.code === 'PEER_NOT_FOUND');
			const hinted = await store.submit('alice', row.id, hash(1));
			assert.equal((await store.apply('bob', row.id, hash(1), { status: 'pending' })).status, 'pending');
			const wrong = proof(hinted); wrong.evidence.transfers[0].amountBaseUnits = '8';
			await assert.rejects(store.apply('alice', row.id, hash(1), wrong), error => error.code === 'PEER_UNAVAILABLE');
			assert.equal((await store.submit('alice', row.id)).status, 'pending');
		});
		await t.test('late wallet approval/mining remains recordable after preparation expiry', async () => {
			const late = await store.prepare('alice', { ...input, requestKey: 'late' });
			now += 1800001;
			try {
				assert.equal((await store.submit('alice', late.id)).status, 'expired');
				const hinted = await store.submit('alice', late.id, hash(71));
				const evidence = proof(hinted); evidence.evidence.timestamp = now;
				assert.equal((await store.apply('alice', late.id, hash(71), evidence)).status, 'confirmed');
			} finally { now -= 1800001; }
		});
		await t.test('one confirmed event wins concurrent claims; losing intent rolls back and replay cannot remap', async () => {
			const a = await store.prepare('alice', input), b = await store.prepare('alice', { ...input, requestKey: 'second' });
			const ar = await store.submit('alice', a.id, hash(1)), br = await store.submit('alice', b.id, hash(1));
			const outcomes = await Promise.allSettled([store.apply('alice', a.id, hash(1), proof(ar)), store.apply('alice', b.id, hash(1), proof(br))]);
			assert.equal(outcomes.filter(row => row.status === 'fulfilled').length, 1); assert.equal(outcomes.find(row => row.status === 'rejected').reason.code, 'PEER_CONFLICT');
			const winner = (await store.list('alice')).find(row => row.status === 'confirmed' && row.txHash === hash(1)), loser = (await store.list('alice')).find(row => row.status === 'pending');
			assert.equal(loser.confirmedAt, null); assert.equal(loser.logIndex, null);
			assert.equal((await store.apply('bob', winner.id, hash(1), proof(winner))).confirmedAt, winner.confirmedAt);
			await qr.query('DELETE FROM billing_wallet WHERE id = \'bob-wallet\'');
			await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'carol-wallet\',\'carol\',123456,$1,NULL,$2,$2)', [address(2), now]);
			assert.deepEqual(await store.list('carol'), []); await assert.rejects(store.apply('carol', winner.id, hash(1), proof(winner)), error => error.code === 'PEER_NOT_FOUND');
		});
		await t.test('native principal/scope boundary, safe expired submission and account deletion retention', async () => {
			const client = createRouterClient(createPeerPaymentRouter({ store, readReceipt: async() => ({ status: 'pending' }), rpcUrl: async() => 'https://rpc.example.test' }), { context: { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async() => [{ id: 'alice', isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }], limitActor: () => null, rateLimitFactor: async() => 1, limit: async() => null } } });
			await assert.rejects(client.publish({ walletId: 'alice-wallet', isPublic: true }), error => error.code === 'ACCESS_DENIED');
			assert.ok((await client.list({})).every(row => row.senderUserId === 'alice'));
			const native = createRouterClient(createPeerPaymentRouter({ store, readReceipt: async () => ({ status: 'pending' }), rpcUrl: async () => 'https://rpc.example.test' }), { context: { credential: 'synthetic-native', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } } });
			assert.deepEqual(await native.publish({ walletId: 'alice-wallet', isPublic: true }), { isPublic: true });
			await assert.rejects(native.publish({ walletId: 'carol-wallet', isPublic: true }), error => error.code === 'PEER_NOT_FOUND');
			await qr.query('DELETE FROM "user" WHERE id=\'alice\'');
			assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_peer_intent WHERE status=\'confirmed\''))[0].count, 2);
			assert.equal((await store.list('bob')).find(row => row.status === 'confirmed').senderUserId, null);
		});
	} finally { await qr.query(`DROP SCHEMA "${schema}" CASCADE`); await qr.release(); await db.destroy(); }
});
