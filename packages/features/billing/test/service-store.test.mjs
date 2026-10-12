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
import { createServiceBillingStore, createServiceBillingRouter } from '../../../backend/built/features/billing/backend.js';
import { BillingServiceSubscriptions1791838800000 as Migration } from '../../../backend/migration/1791838800000-BillingServiceSubscriptions.js';
import { BillingWalletRegistration1791760200000 as WalletMigration } from '../../../backend/migration/1791760200000-BillingWalletRegistration.js';
const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { DataSource } = require('typeorm');
const url = process.env.MISSKEY_BILLING_TEST_DATABASE_URL;
const address = n => `0x${n.toString(16).padStart(40, '0')}`;
const hash = n => `0x${n.toString(16).padStart(64, '0')}`;
const offer = { id: 'offer', serviceKey: 'synthetic-service', name: 'Synthetic term', chainId: 123456, contractAddress: address(3), recipientAddress: address(9), tokenSymbol: 'TEST', decimals: 6, amountBaseUnits: '7', duration: 1, durationUnit: 'months', confirmationsRequired: 3, isEnabled: true };

test('synthetic PostgreSQL subscriptions and participant-only transfer capture', { skip: !url }, async t => {
	assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname));
	const schema = `billing_service_test_${randomUUID().replaceAll('-', '')}`;
	const db = new DataSource({ type: 'postgres', url, schema, extra: { options: `-c search_path=${schema}`, application_name: 'misskey-billing-service-synthetic' }, entities: (await import('../../../backend/built/postgres.js')).entities });
	await db.initialize(); const qr = db.createQueryRunner();
	let now = Date.parse('2026-01-31T12:34:56Z'), sequence = 0;
	const store = createServiceBillingStore(db, () => `synthetic-${++sequence}`, () => now);
	const proof = row => ({ status: 'confirmed', evidence: { chainId: row.chainId, txHash: row.txHash, timestamp: row.createdAt, transfers: [{ logIndex: 2, contractAddress: row.offer.contractAddress, fromAddress: row.payerAddress, toAddress: row.offer.recipientAddress, amountBaseUnits: '7' }] } });
	try {
		await qr.query(`CREATE SCHEMA "${schema}"`);
		await qr.query('CREATE TABLE "user" ("id" varchar(32) PRIMARY KEY)');
		await qr.query('INSERT INTO "user" ("id") VALUES (\'alice\'), (\'bob\'), (\'carol\')');
		const migration = new Migration(); await migration.up(qr); await migration.down(qr); await migration.up(qr);
		await new WalletMigration().up(qr);
		const pending = (await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_service_(offer|order)"|"billing_detected_transfer"/.test(row.query));
		assert.deepEqual(pending, [], 'Migration and entity DDL agree');
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'alice-wallet\',\'alice\',123456,$1,NULL,$3,$3),(\'bob-wallet\',\'bob\',123456,$2,NULL,$3,$3)', [address(1), address(2), now]);
		await store.saveOffer(offer, 'alice');
		await t.test('concurrent idempotent creation, input conflict and immutable offer snapshot', async () => {
			const rows = await Promise.all([store.createOrder('alice', offer.id, 'alice-wallet', 'retry-key', offer), store.createOrder('alice', offer.id, 'alice-wallet', 'retry-key', offer)]);
			assert.equal(rows[0].id, rows[1].id); assert.equal((await store.listOrders('alice')).length, 1);
			await assert.rejects(store.createOrder('alice', offer.id, 'bob-wallet', 'retry-key', offer), error => error.code === 'BILLING_CONFLICT');
			await assert.rejects(store.createOrder('bob', offer.id, 'alice-wallet', 'other', offer), error => error.code === 'BILLING_UNAVAILABLE');
			await store.saveOffer({ ...offer, amountBaseUnits: '99', isEnabled: false }, 'alice');
			assert.equal((await store.listOrders('alice'))[0].offer.amountBaseUnits, '7');
			assert.equal((await store.createOrder('alice', offer.id, 'alice-wallet', 'retry-key', offer)).id, rows[0].id);
			await assert.rejects(store.createOrder('alice', offer.id, 'alice-wallet', 'disabled', offer));
			await store.saveOffer(offer, 'alice');
			await assert.rejects(store.createOrder('alice', offer.id, 'alice-wallet', 'stale-quote', { ...offer, amountBaseUnits: '6' }), error => error.code === 'BILLING_CONFLICT');
		});
		await t.test('confirmed payment claim is globally unique and its term is replay-safe', async () => {
			const first = (await store.listOrders('alice'))[0];
			const reserved = await store.submitTransaction('alice', first.id, hash(1));
			const second = await store.createOrder('alice', offer.id, 'alice-wallet', 'second', offer);
			const secondHint = await store.submitTransaction('alice', second.id, hash(1));
			assert.equal(secondHint.status, 'pending');
			await assert.rejects(store.submitTransaction('bob', first.id, hash(1)), error => error.code === 'BILLING_NOT_FOUND');
			await assert.rejects(store.submitTransaction('alice', first.id, hash(2)), error => error.code === 'BILLING_CONFLICT');
			const outcomes = await Promise.all([store.applyReceipt('alice', first.id, hash(1), proof(reserved)), store.applyReceipt('alice', first.id, hash(1), proof(reserved))]);
			assert.equal(outcomes[0].endsAt, outcomes[1].endsAt); assert.equal(new Date(outcomes[0].endsAt).toISOString(), '2026-02-28T12:34:56.000Z');
			assert.equal((await store.listOrders('alice')).filter(row => row.status === 'paid').length, 1);
			await assert.rejects(store.applyReceipt('alice', second.id, hash(1), proof(secondHint)), error => error.code === 'BILLING_CONFLICT');
			assert.equal((await store.submitTransaction('alice', second.id)).status, 'pending');
		});
		await t.test('concurrent same-service renewals serialize without overlapping periods', async () => {
			const a = await store.createOrder('alice', offer.id, 'alice-wallet', 'renew-a', offer);
			const b = await store.createOrder('alice', offer.id, 'alice-wallet', 'renew-b', offer);
			const ar = await store.submitTransaction('alice', a.id, hash(3)); const br = await store.submitTransaction('alice', b.id, hash(4));
			const rows = await Promise.all([store.applyReceipt('alice', a.id, hash(3), proof(ar)), store.applyReceipt('alice', b.id, hash(4), proof(br))]);
			rows.sort((x, y) => x.startsAt - y.startsAt); assert.equal(rows[0].endsAt, rows[1].startsAt);
			assert.equal(new Date(rows[1].endsAt).toISOString(), '2026-04-28T12:34:56.000Z');
		});
		await t.test('pending, expired unsubmitted order and invalid evidence grant nothing', async () => {
			const a = await store.createOrder('bob', offer.id, 'bob-wallet', 'bad', offer); const ar = await store.submitTransaction('bob', a.id, hash(5));
			assert.equal((await store.applyReceipt('bob', a.id, hash(5), { status: 'pending' })).status, 'pending');
			const wrong = proof(ar); wrong.evidence.transfers[0].contractAddress = address(8);
			const failed = await store.applyReceipt('bob', a.id, hash(5), wrong); assert.equal(failed.status, 'failed'); assert.equal(failed.endsAt, null);
			const expired = await store.createOrder('bob', offer.id, 'bob-wallet', 'expired', offer); now += 1800000;
			assert.equal((await store.submitTransaction('bob', expired.id, hash(6))).status, 'expired'); now -= 1800000;
		});
		await t.test('native scope/admin boundary and owner-only DTO history', async () => {
			function client(userId = 'alice', admin = true, permission = null) {
				return createRouterClient(createServiceBillingRouter({ store, readReceipt: async () => ({ status: 'pending' }), rpcUrl: async () => 'https://rpc.example.test' }), { context: {
					credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: userId, isSuspended: false, movedToUri: null }, permission ? { permission } : null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
					authorization: { rootUserId: () => null, roles: async () => [{ isAdministrator: admin }], policyAllowed: async () => false },
				} });
			}

			await assert.rejects(client('alice', false).upsertOffer(offer));
			await assert.rejects(client('alice', true, ['read:account']).createOrder({ offerId: offer.id, walletId: 'alice-wallet', requestKey: 'denied', quotedOffer: offer }));
			const own = await client('bob', false, ['read:account']).listOrders({}); assert.equal(own.length, 2); assert.equal('userId' in own[0], false); assert.equal('requestKey' in own[0], false);
			await assert.rejects(client().upsertOffer({ ...offer, amountBaseUnits: '0' }));
			await assert.rejects(client().upsertOffer({ ...offer, amountBaseUnits: (2n ** 256n).toString() }));
			await assert.rejects(client().upsertOffer({ ...offer, userId: 'bob' }));
		});
		await t.test('failure of paid-period update rolls back and permits safe retry', async () => {
			const a = await store.createOrder('alice', offer.id, 'alice-wallet', 'rollback', offer); const ar = await store.submitTransaction('alice', a.id, hash(7));
			await qr.query('CREATE FUNCTION fail_service_term() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = \'paid\' THEN RAISE EXCEPTION \'synthetic rollback\'; END IF; RETURN NEW; END $$');
			await qr.query('CREATE TRIGGER fail_service_term BEFORE UPDATE ON billing_service_order FOR EACH ROW EXECUTE FUNCTION fail_service_term()');
			await assert.rejects(store.applyReceipt('alice', a.id, hash(7), proof(ar)));
			assert.equal((await store.submitTransaction('alice', a.id)).status, 'pending');
			await qr.query('DROP TRIGGER fail_service_term ON billing_service_order');
			assert.equal((await store.applyReceipt('alice', a.id, hash(7), proof(ar))).status, 'paid');
		});
		await t.test('native account creates quoted term and checks synthetic receipt, then detects its transfer', async () => {
			const readReceipt = async (chainId, txHash) => ({ status: 'confirmed', evidence: { chainId, txHash, timestamp: now, transfers: [{ logIndex: 2, contractAddress: offer.contractAddress, fromAddress: address(2), toAddress: txHash === hash(10) ? offer.recipientAddress : address(1), amountBaseUnits: '7' }] } });
			const client = createRouterClient(createServiceBillingRouter({ store, readReceipt, rpcUrl: async () => 'https://rpc.example.test' }), { context: { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: 'bob', isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } } });
			const order = await client.createOrder({ offerId: offer.id, walletId: 'bob-wallet', requestKey: 'native-term', quotedOffer: offer });
			assert.equal((await client.checkOrder({ orderId: order.id, txHash: hash(10) })).status, 'paid');
			assert.equal((await client.checkOrder({ orderId: order.id })).status, 'paid');
			const detected = await client.detectTransfer({ offerId: offer.id, txHash: hash(11), logIndex: 2 });
			assert.equal(detected.status, 'confirmed'); assert.equal(detected.transfer.senderUserId, 'bob'); assert.equal(detected.transfer.recipientUserId, 'alice');
			await assert.rejects(client.detectTransfer({ offerId: offer.id, txHash: hash(11), logIndex: 3 }), error => error.code === 'BILLING_TRANSACTION_INVALID');
		});
		await t.test('nonmatching or pending submissions do not exclude a matching confirmed claim', async () => {
			const client = (userId, readReceipt) => createRouterClient(createServiceBillingRouter({ store, readReceipt, rpcUrl: async () => 'https://rpc.example.test' }), { context: { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: userId, isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } } });
			for (const mode of ['invalid-first', 'pending-first', 'concurrent']) {
				const index = 20 + ['invalid-first', 'pending-first', 'concurrent'].indexOf(mode);
				const a = await store.createOrder('alice', offer.id, 'alice-wallet', `matching-${mode}`, offer);
				const b = await store.createOrder('bob', offer.id, 'bob-wallet', `nonmatching-${mode}`, offer);
				const evidence = proof({ ...a, txHash: hash(index) });
				const alice = client('alice', async () => evidence);
				const bob = client('bob', async () => mode === 'pending-first' ? { status: 'pending' } : evidence);
				const inputA = { orderId: a.id, txHash: hash(index) }; const inputB = { orderId: b.id, txHash: hash(index) };
				if (mode === 'concurrent') {
					const [wrong, right] = await Promise.all([bob.checkOrder(inputB), alice.checkOrder(inputA)]);
					assert.equal(wrong.status, 'failed'); assert.equal(right.status, 'paid');
				} else {
					assert.equal((await bob.checkOrder(inputB)).status, mode === 'pending-first' ? 'pending' : 'failed');
					assert.equal((await alice.checkOrder(inputA)).status, 'paid');
				}
				assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_service_order WHERE "chainId" = $1 AND "txHash" = $2 AND status = \'paid\'', [offer.chainId, hash(index)]))[0].count, 1);
			}
		});
		await t.test('concurrent matching claims have one winner and a fully rolled-back loser', async () => {
			const a = await store.createOrder('alice', offer.id, 'alice-wallet', 'claim-race-a', offer);
			const b = await store.createOrder('alice', offer.id, 'alice-wallet', 'claim-race-b', offer);
			const [ah, bh] = await Promise.all([store.submitTransaction('alice', a.id, hash(23)), store.submitTransaction('alice', b.id, hash(23))]);
			const outcomes = await Promise.allSettled([store.applyReceipt('alice', a.id, hash(23), proof(ah)), store.applyReceipt('alice', b.id, hash(23), proof(bh))]);
			assert.equal(outcomes.filter(row => row.status === 'fulfilled').length, 1);
			const rejected = outcomes.find(row => row.status === 'rejected'); assert.equal(rejected.reason.code, 'BILLING_CONFLICT');
			const rows = (await store.listOrders('alice')).filter(row => row.id === a.id || row.id === b.id);
			assert.equal(rows.filter(row => row.status === 'paid').length, 1);
			const loser = rows.find(row => row.status === 'pending'); assert.equal(loser.paidAt, null); assert.equal(loser.startsAt, null); assert.equal(loser.endsAt, null);
		});
		await t.test('pending verification recovers after the submission deadline without consuming evidence twice', async () => {
			const a = await store.createOrder('alice', offer.id, 'alice-wallet', 'pre-confirmation-recovery', offer);
			const hint = await store.submitTransaction('alice', a.id, hash(24));
			assert.equal((await store.applyReceipt('alice', a.id, hash(24), { status: 'pending' })).status, 'pending');
			now += 1800001;
			try {
				const stillPending = await store.submitTransaction('alice', a.id);
				assert.equal(stillPending.status, 'pending');
				const paid = await store.applyReceipt('alice', a.id, hash(24), proof(hint));
				assert.equal(paid.status, 'paid');
				assert.equal((await store.applyReceipt('alice', a.id, hash(24), proof(hint))).endsAt, paid.endsAt);
			} finally { now -= 1800001; }
		});
		await t.test('transfer event is participant-only, idempotent and cannot be reassigned after unlink', async () => {
			const log = { logIndex: 2, contractAddress: address(3), fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' };
			await assert.rejects(store.recordTransfer('carol', offer.chainId, hash(8), log, now), error => error.code === 'BILLING_NOT_FOUND');
			await assert.rejects(store.recordTransfer('alice', offer.chainId, hash(9), log, now - 2001));
			const rows = await Promise.all([store.recordTransfer('alice', offer.chainId, hash(8), log, now), store.recordTransfer('bob', offer.chainId, hash(8), log, now)]);
			assert.equal(rows[0].id, rows[1].id); assert.equal((await store.listTransfers('carol')).length, 0);
			await qr.query('UPDATE billing_wallet SET "userId" = \'carol\' WHERE id = \'alice-wallet\'');
			await assert.rejects(store.recordTransfer('carol', offer.chainId, hash(8), log, now));
			assert.equal((await store.recordTransfer('alice', offer.chainId, hash(8), log, now)).id, rows[0].id);
			await qr.query('DELETE FROM "user" WHERE id = \'alice\'');
			assert.equal((await store.listTransfers('bob')).find(row => row.txHash === hash(8)).senderUserId, null);
			assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_service_order WHERE "txHash" = $1 AND status = \'paid\'', [hash(1)]))[0].count, 1, 'Evidence claim survives account deletion');
		});
	} finally { await qr.query(`DROP SCHEMA "${schema}" CASCADE`); await qr.release(); await db.destroy(); }
});
