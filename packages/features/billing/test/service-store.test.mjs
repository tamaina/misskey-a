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
import { PeerPayments1791950000000 as PeerMigration } from '../../../backend/migration/1791950000000-PeerPayments.js';
import { PeerBroadcastStart1792101000000 as BroadcastMigration } from '../../../backend/migration/1792101000000-PeerBroadcastStart.js';
import { createServiceBillingStore, createCatalogAdminStore, createCatalogAdminRouter, createServiceBillingRouter, createBillingPolicyStore, createPurchaseNotifier, createBillingReportsStore, createBillingReportsRouter, activePaidRoleIds, createResidenceStore } from '../../../backend/built/features/billing/backend.js';
import { BillingServiceSubscriptions1791838800000 as Migration } from '../../../backend/migration/1791838800000-BillingServiceSubscriptions.js';
import { BillingFundedTerms1792010000000 } from '../../../backend/migration/1792010000000-BillingFundedTerms.js';
import { BillingWalletRegistration1791760200000 as WalletMigration } from '../../../backend/migration/1791760200000-BillingWalletRegistration.js';
import { BillingWalletChainSettings1791763800000 } from '../../../backend/migration/1791763800000-BillingWalletChainSettings.js';
import { BillingCatalogAdministration1792020000000 as CatalogMigration } from '../../../backend/migration/1792020000000-BillingCatalogAdministration.js';
import { BillingTaxResidency1792021000000 as PolicyMigration } from '../../../backend/migration/1792021000000-BillingTaxResidency.js';
import { BillingNotifications1792022000000 as NotificationMigration } from '../../../backend/migration/1792022000000-BillingNotifications.js';
import { BillingOrderReports1792023000000 as ReportsMigration } from '../../../backend/migration/1792023000000-BillingOrderReports.js';
import { AccountDeclaredResidence1792100000000 as ResidenceMigration } from '../../../backend/migration/1792100000000-AccountDeclaredResidence.js';
const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { DataSource } = require('typeorm');
const url = process.env.MISSKEY_BILLING_TEST_DATABASE_URL;
const address = n => `0x${n.toString(16).padStart(40, '0')}`;
const hash = n => `0x${n.toString(16).padStart(64, '0')}`;
const offer = { id: 'offer', serviceKey: 'synthetic-service', name: 'Synthetic term', chainId: 123456, contractAddress: address(3), recipientAddress: address(9), tokenSymbol: 'TEST', decimals: 6, amountBaseUnits: '7', duration: 1, durationUnit: 'months', confirmationsRequired: 3, isEnabled: true };

test('synthetic PostgreSQL subscriptions and paid role intervals', { skip: !url }, async t => {
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
		await qr.query('CREATE TABLE moderation_log (id varchar(32) PRIMARY KEY, "userId" varchar(32) NOT NULL, type varchar(128) NOT NULL, info jsonb NOT NULL)');
		const migration = new Migration(); await migration.up(qr); await migration.down(qr); await migration.up(qr);
		await new WalletMigration().up(qr); await new PeerMigration().up(qr); await new BroadcastMigration().up(qr);
		await new BillingFundedTerms1792010000000().up(qr);
		await new BillingWalletChainSettings1791763800000().up(qr);
		const seed = { ...offer, id: 'migration-price', priceStartsAt: now - 10, priceExpiresAt: now + 10 };
		await qr.query('INSERT INTO billing_service_offer (id, terms, "updatedAt", "updatedByUserId") VALUES ($1, $2::jsonb, $3, $4)', [seed.id, JSON.stringify(seed), new Date(now), 'alice']);
		await new CatalogMigration().up(qr);
		assert.deepEqual((await qr.query('SELECT terms FROM billing_catalog_price WHERE id=$1', [seed.id]))[0].terms, seed);
		await assert.rejects(new CatalogMigration().down(qr), /Cannot discard/);
		await qr.query('DELETE FROM billing_catalog_price WHERE id=$1', [seed.id]);
		await qr.query('DELETE FROM billing_service_offer WHERE id=$1', [seed.id]);
		await new CatalogMigration().down(qr); await new CatalogMigration().up(qr);
		await new PolicyMigration().up(qr); await new PolicyMigration().down(qr); await new PolicyMigration().up(qr);
		await new NotificationMigration().up(qr); await new NotificationMigration().down(qr); await new NotificationMigration().up(qr);
		await new ReportsMigration().up(qr); await new ReportsMigration().down(qr); await new ReportsMigration().up(qr);
		await qr.query('CREATE TABLE user_profile ("userId" varchar(32) PRIMARY KEY, email varchar(128), "emailVerified" boolean)');
		await new ResidenceMigration().up(qr); await new ResidenceMigration().down(qr); await new ResidenceMigration().up(qr);
		const residence = { country: 'JP', subdivision: 'JP-13', revision: 1, declaredAt: now, kind: 'self_declared' };
		await qr.query('INSERT INTO user_profile ("userId", "billingResidence") SELECT id, $1::jsonb FROM "user"', [JSON.stringify(residence)]);
		const pending = (await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_service_(offer|order)"/.test(row.query));
		assert.deepEqual(pending, [], 'Migration and entity DDL agree');
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'alice-wallet\',\'alice\',123456,$1,NULL,$3,$3),(\'bob-wallet\',\'bob\',123456,$2,NULL,$3,$3)', [address(1), address(2), now]);
		await qr.query('CREATE TABLE role (id varchar(32) PRIMARY KEY, target varchar(16), "isAdministrator" boolean, "isModerator" boolean)');
		await qr.query('INSERT INTO role VALUES (\'normal\',\'manual\',false,false),(\'admin\',\'manual\',true,false),(\'auto\',\'conditional\',false,false)');
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
		await t.test('native account creates quoted term and checks synthetic receipt', async () => {
			const readReceipt = async (chainId, txHash) => ({ status: 'confirmed', evidence: { chainId, txHash, timestamp: now, transfers: [{ logIndex: 2, contractAddress: offer.contractAddress, fromAddress: address(2), toAddress: txHash === hash(10) ? offer.recipientAddress : address(1), amountBaseUnits: '7' }] } });
			const client = createRouterClient(createServiceBillingRouter({ store, readReceipt, rpcUrl: async () => 'https://rpc.example.test' }), { context: { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: 'bob', isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } } });
			const order = await client.createOrder({ offerId: offer.id, walletId: 'bob-wallet', requestKey: 'native-term', quotedOffer: offer });
			assert.equal((await client.checkOrder({ orderId: order.id, txHash: hash(10) })).status, 'paid');
			assert.equal((await client.checkOrder({ orderId: order.id })).status, 'paid');
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
		await t.test('paid roles start and expire exactly, reject elevated mappings', async () => {
			const mapped = { ...offer, id: 'role-offer', serviceKey: 'role-service', roleId: 'normal' };
			await assert.rejects(store.saveOffer({ ...mapped, roleId: 'admin' }, 'alice'), error => error.code === 'BILLING_UNAVAILABLE');
			await assert.rejects(store.saveOffer({ ...mapped, roleId: 'auto' }, 'alice'), error => error.code === 'BILLING_UNAVAILABLE');
			await store.saveOffer(mapped, 'alice');
			const order = await store.createOrder('bob', mapped.id, 'bob-wallet', 'role-term', mapped);
			const hinted = await store.submitTransaction('bob', order.id, hash(71));
			assert.deepEqual(await activePaidRoleIds(db, 'bob', now), []);
			const paid = await store.applyReceipt('bob', order.id, hash(71), proof(hinted));
			assert.deepEqual(await activePaidRoleIds(db, 'bob', paid.startsAt - 1), []);
			assert.deepEqual(await activePaidRoleIds(db, 'bob', paid.startsAt), ['normal']);
			assert.deepEqual(await activePaidRoleIds(db, 'bob', paid.endsAt), []);
			assert.deepEqual(await activePaidRoleIds(db, 'alice', paid.startsAt), []);
			await qr.query('UPDATE role SET "isModerator" = true WHERE id = \'normal\'');
			assert.deepEqual(await activePaidRoleIds(db, 'bob', paid.startsAt), [], 'Later role edits cannot make payment confer moderation');
			await qr.query('UPDATE role SET "isModerator" = false WHERE id = \'normal\'');
			assert.equal((await store.applyReceipt('bob', order.id, hash(71), proof(hinted))).endsAt, paid.endsAt);
		});
		await t.test('scheduled catalog availability and concurrent source price rules are native SQL enforced', async () => {
			const originalTime = now;
			try {
				const scheduled = { ...offer, serviceKey: 'scheduled-plan', priceStartsAt: now + 10, priceExpiresAt: now + 20 };
				const results = await Promise.allSettled([store.saveOffer({ ...scheduled, id: 'scheduled-a' }, 'alice'), store.saveOffer({ ...scheduled, id: 'scheduled-b' }, 'alice')]);
				assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
				const price = (await store.listOffers()).find(row => row.serviceKey === 'scheduled-plan');
				await assert.rejects(store.quoteOrder('bob', price.id), error => error.code === 'BILLING_UNAVAILABLE');
				now += 10;
				assert.equal((await store.quoteOrder('bob', price.id)).quote.baseAmountBaseUnits, price.amountBaseUnits);
				assert.equal((await store.listCatalog()).filter(row => row.offer.id === price.id).length, 1);
				await assert.rejects(store.saveOffer({ ...price, amountBaseUnits: '8' }, 'alice'), error => error.code === 'BILLING_CONFLICT');
				const shared = { ...scheduled, id: 'shared-first', serviceKey: 'shared-plan', catalogPriceId: 'logical-price', pricingAssetKey: 'same-pricing-units' };
				await store.saveOffer(shared, 'alice');
				await store.saveOffer({ ...shared, id: 'shared-second', chainId: 123457, contractAddress: address(4) }, 'alice');
				assert.equal((await store.listCatalog()).find(row => row.offer.id === shared.id).priceHistory.length, 1);
				await assert.rejects(store.saveOffer({ ...offer, id: 'logical-price' }, 'alice'), error => error.code === 'BILLING_CONFLICT');
				await store.saveOffer({ ...shared, priceExpiresAt: now + 100 }, 'alice');
				assert.equal((await store.listOffers()).find(row => row.id === 'shared-second').priceExpiresAt, now + 100);
				const alias = { ...price, id: 'fallback-alias', catalogPriceId: price.id };
				await store.saveOffer(alias, 'alice');
				await assert.rejects(store.saveOffer({ ...alias, id: 'false-alias', amountBaseUnits: '6', priceStartsAt: now + 20, priceExpiresAt: null }, 'alice'), error => error.code === 'BILLING_CONFLICT');
				await store.saveOffer({ ...alias, priceExpiresAt: now + 5 }, 'alice');
				assert.equal((await store.listOffers()).find(row => row.id === price.id).priceExpiresAt, now + 5);
				const free = { ...scheduled, id: 'free-price', serviceKey: 'free-plan', amountBaseUnits: '0', priceExpiresAt: now + 100 };
				await store.saveOffer(free, 'alice');
				const zero = await store.createOrder('carol', free.id, 'bob-wallet', 'invalid-owner-free', free).catch(error => error);
				assert.equal(zero.code, 'BILLING_UNAVAILABLE');
				await qr.query('INSERT INTO "user" (id) VALUES ($1)', ['catalog-buyer']);
				await qr.query('INSERT INTO user_profile ("userId", "billingResidence") VALUES ($1, $2::jsonb)', ['catalog-buyer', JSON.stringify(residence)]);
				await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES ($1,$2,123456,$3,NULL,$4,$4)', ['catalog-wallet', 'catalog-buyer', address(5), now]);
				const zeroQuote = await store.quoteOrder('catalog-buyer', free.id);
				const zeroPaid = await store.createOrder('catalog-buyer', free.id, 'catalog-wallet', 'free-order', free, zeroQuote);
				assert.equal(zeroPaid.status, 'paid'); assert.equal(zeroPaid.txHash, null); assert.equal(zeroPaid.cashAmountBaseUnits, '0');
				now += 10;
				await assert.rejects(store.createOrder('bob', price.id, 'bob-wallet', 'expired-price', price), error => error.code === 'BILLING_UNAVAILABLE');
			} finally { now = originalTime; }
		});
		await t.test('managed assets/deployments retain independent price history and immutable orders', async () => {
			const admin = createCatalogAdminStore(db, () => now);
			const asset = { id: 'managed-asset', pricingAssetKey: 'managed-units', name: 'Synthetic asset', symbol: 'T', currencyCode: 'JPY', isEnabled: true };
			const router = createCatalogAdminRouter(admin, { metadata: async () => ({ tokenSymbol: 'T', tokenName: 'Token', decimals: 6 }), test: async chainId => ({ chainId, ok: true }) }, async () => 'https://synthetic.example.test');
			const native = (isAdmin, permission) => createRouterClient(router, { context: { credential: 'synthetic', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, { permission }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null }, authorization: { rootUserId: () => null, roles: async () => [{ isAdministrator: isAdmin }], policyAllowed: async () => false } } });
			await assert.rejects(native(false, ['write:admin:meta']).upsertPricingAsset(asset));
			await assert.rejects(native(true, ['read:admin:meta']).upsertPricingAsset(asset));
			await native(true, ['write:admin:meta']).upsertPricingAsset(asset);
			assert.deepEqual(await native(true, ['read:admin:meta']).listPricingAssets({}), [asset]);

			await qr.query('INSERT INTO billing_wallet_chain ("chainId",name,"nativeCurrencyName","nativeCurrencySymbol","nativeCurrencyDecimals","blockExplorerUrl","isEnabled","rpcUrl","updatedAt","updatedByUserId") VALUES (123456,\'Synthetic\',\'Native\',\'N\',18,NULL,true,NULL,$1,\'alice\') ON CONFLICT DO NOTHING', [now]);
			const deployment = { id: 'managed-deployment', assetId: asset.id, chainId: 123456, tokenSymbol: 'T', tokenName: 'Token', contractAddress: address(99), recipientAddress: address(9), decimals: 6, isEnabled: true };
			await admin.upsertDeployment(deployment, 'alice');
			await assert.rejects(admin.upsertDeployment({ ...deployment, id: 'duplicate' }, 'alice'), error => error.code === 'BILLING_CONFLICT');
			await assert.rejects(admin.upsertDeployment({ ...deployment, id: 'wrong-decimals', contractAddress: address(98), decimals: 18 }, 'alice'), error => error.code === 'BILLING_CONFLICT');
			const terms = { ...offer, id: 'managed-offer', serviceKey: 'managed-plan', pricingAssetKey: asset.pricingAssetKey, deploymentId: deployment.id, contractAddress: deployment.contractAddress, priceStartsAt: now - 100, priceExpiresAt: now + 1000 };
			const saved = await store.saveOffer(terms, 'alice');
			assert.equal(saved.currencyCode, 'JPY');
			assert.equal((await store.listCatalog()).find(row => row.offer.id === terms.id).priceHistory.length, 1);
			await admin.upsertAsset({ ...asset, isEnabled: false }, 'alice');
			assert.equal((await store.listCatalog()).some(row => row.offer.id === terms.id), false);
			await assert.rejects(store.quoteOrder('alice', terms.id), error => error.code === 'BILLING_UNAVAILABLE');
			await admin.upsertAsset(asset, 'alice');
			await admin.deleteDeployment(deployment.id, 'alice');
			assert.equal((await admin.listPrices()).some(row => row.priceId === terms.id), true);
			await assert.rejects(admin.upsertAsset({ ...asset, pricingAssetKey: 'changed-key' }, 'alice'), error => error.code === 'BILLING_CONFLICT');
			await admin.upsertDeployment(deployment, 'alice');
			await admin.attach(terms.id, deployment.id, 'reattached-offer', 'alice');
			assert.equal((await store.listCatalog()).find(row => row.offer.id === 'reattached-offer').priceHistory.length, 1);
			await admin.attach(terms.id, deployment.id, 'disabled-offer', 'alice');
			const disabled = (await store.listOffers()).find(row => row.id === 'disabled-offer');
			await store.saveOffer({ ...disabled, isEnabled: false }, 'alice');
			assert.equal((await admin.listPrices()).find(row => row.priceId === terms.id).offer.isEnabled, true);
			await assert.rejects(store.saveOffer({ ...terms, amountBaseUnits: '8' }, 'alice'), error => error.code === 'BILLING_CONFLICT');
			await admin.deletePrice(terms.id, 'alice');
			assert.equal((await admin.listPrices()).some(row => row.priceId === terms.id), false);
			assert.equal((await store.listOffers()).some(row => row.id === 'reattached-offer'), false);
			assert.ok((await qr.query('SELECT count(*)::int AS count FROM moderation_log WHERE type=\'billingCatalog\''))[0].count > 0);
			const ddl = (await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_(pricing_asset|asset_deployment|catalog_price)"/.test(row.query));
			assert.deepEqual(ddl, [], 'Catalog migration and entity DDL agree');
			await admin.deleteAsset(asset.id, 'alice');
			await admin.deleteChain(deployment.chainId, 'alice');
		});
		await t.test('trusted geography, versioned consent and immutable paid receipt survive policy changes', async () => {
			const policyStore = createBillingPolicyStore(db, () => `policy-${++sequence}`, () => now);
			const policy = { isEnabled: true, trustedProxyCidrs: ['127.0.0.1/32'], regionRules: { mode: 'allow', rules: [{ country: 'JP' }] }, taxName: 'Tax', taxRate: '0.1', seller: { name: 'Synthetic seller', address: 'Synthetic address', invoiceRegistrationNumber: 'Synthetic registration' }, statementText: 'Synthetic residency statement' };
			await policyStore.upsert({ revision: 0, policy }, 'alice');
			await assert.rejects(policyStore.upsert({ revision: 0, policy }, 'alice'), error => error.code === 'BILLING_CONFLICT');
			const context = { transportPeerIp: '127.0.0.1', headers: { 'cf-ipcountry': 'JP' } };
			await assert.rejects(policyStore.requirements({ ...context, transportPeerIp: '192.0.2.1' }), error => error.code === 'BILLING_UNAVAILABLE');
			const [a, b] = await Promise.all([policyStore.requirements(context), policyStore.requirements(context)]);
			assert.equal(a.statement.id, b.statement.id);
			const taxable = { ...offer, id: 'taxable', serviceKey: 'taxable', currencyCode: 'JPY', amountBaseUnits: '100' };
			await store.saveOffer(taxable, 'alice');
			await assert.rejects(store.createOrder('bob', taxable.id, 'bob-wallet', 'no-consent', taxable, undefined, context), error => error.code === 'BILLING_CONFLICT');
			const purchase = { ...context, consent: { statementId: a.statement.id, agreed: true } };
			const row = await store.createOrder('bob', taxable.id, 'bob-wallet', 'tax-retry', taxable, undefined, purchase);
			assert.equal(row.receiptSnapshot.tax.taxBaseUnits, '10');
			await assert.rejects(store.getReceipt('bob', row.id), error => error.code === 'BILLING_NOT_FOUND');
			const reserved = await store.submitTransaction('bob', row.id, hash(900));
			const evidence = proof(reserved); evidence.evidence.transfers[0].amountBaseUnits = '100';
			await store.applyReceipt('bob', row.id, hash(900), evidence);
			await assert.rejects(store.getReceipt('alice', row.id), error => error.code === 'BILLING_NOT_FOUND');
			await policyStore.upsert({ revision: 1, policy: { ...policy, statementText: 'New statement', taxRate: '0.2', seller: { ...policy.seller, name: 'New seller' } } }, 'alice');
			const changed = await policyStore.requirements(context);
			assert.notEqual(changed.statement.id, a.statement.id);
			await assert.rejects(store.createOrder('bob', taxable.id, 'bob-wallet', 'old-consent', taxable, undefined, purchase), error => error.code === 'BILLING_CONFLICT');
			assert.equal((await store.createOrder('bob', taxable.id, 'bob-wallet', 'tax-retry', taxable, undefined, purchase)).id, row.id);
			const receipt = await store.getReceipt('bob', row.id);
			assert.equal(receipt.receiptSnapshot.seller.name, 'Synthetic seller');
			assert.equal(receipt.receiptSnapshot.statement.statement, policy.statementText);
			assert.equal(receipt.receiptSnapshot.tax.taxBaseUnits, '10');
			await assert.rejects(new PolicyMigration().down(qr), /Cannot discard/);
			const ddl = (await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_(policy|residency_statement|service_order)"/.test(row.query));
			assert.deepEqual(ddl, [], 'Policy migration and entity DDL agree');
			await policyStore.upsert({ revision: 2, policy: { ...policy, isEnabled: false } }, 'alice');
		});
		await t.test('purchase email reserves one attempt across concurrency and never resends unknown outcomes', async () => {
			await qr.query('UPDATE user_profile SET email = CASE WHEN "userId"=\'bob\' THEN \'synthetic@example.invalid\' WHEN "userId"=\'catalog-buyer\' THEN \'zero@example.invalid\' ELSE NULL END, "emailVerified" = "userId" <> \'alice\'');
			const paid = (await store.listOrders('bob')).find(row => row.offer.id === 'taxable');
			let calls = 0;
			const notify = createPurchaseNotifier(db, 'https://synthetic.example.invalid', async (to, subject, lines) => {
				calls++; assert.equal(to, 'synthetic@example.invalid'); assert.match(subject, /レシート/);
				assert.ok(lines.some(line => line.includes('Synthetic seller'))); assert.ok(lines.some(line => line.includes('0.00001 JPY')));
				throw new Error('Synthetic unknown SMTP outcome');
			}, () => now);
			const outcomes = await Promise.allSettled([notify(paid.id), notify(paid.id)]);
			assert.equal(outcomes.filter(row => row.status === 'rejected').length, 1); assert.equal(calls, 1);
			await notify(paid.id); assert.equal(calls, 1);
			await notify((await store.listOrders('alice')).find(row => row.status === 'paid').id); assert.equal(calls, 1);
			let zeroCalls = 0;
			const zero = (await store.listOrders('catalog-buyer')).find(row => row.status === 'paid');
			const zeroNotify = createPurchaseNotifier(db, 'https://synthetic.example.invalid', async (to, _subject, lines) => { zeroCalls++; assert.equal(to, 'zero@example.invalid'); assert.ok(lines.some(line => line === '支払額: 0 TEST')); }, () => now);
			await Promise.all([zeroNotify(zero.id), zeroNotify(zero.id)]); assert.equal(zeroCalls, 1);
			const seen = [];
			const native = createRouterClient(createServiceBillingRouter({ store, readReceipt: async () => ({ status: 'pending' }), rpcUrl: async () => null, notifyPurchase: async orderId => { seen.push(orderId); await zeroNotify(orderId); } }), { context: {
				credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: 'catalog-buyer', isSuspended: false, movedToUri: null }, { permission: ['write:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null }, authorization: { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false },
			} });
			assert.equal((await native.checkOrder({ orderId: zero.id })).status, 'paid'); await native.checkOrder({ orderId: zero.id });
			assert.deepEqual(seen, [zero.id, zero.id]); assert.equal(zeroCalls, 1);
			assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_notification'))[0].count, 3);
			await assert.rejects(new NotificationMigration().down(qr), /Cannot discard/);
			assert.deepEqual((await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_notification"/.test(row.query)), []);
		});
		await t.test('admin order confirmation audit rolls back atomically and sales preserve units, precision and unknown tax', async () => {
			const originalTime = now; now += 2000000;
			try {
				const reports = createBillingReportsStore(db);
				const policyStore = createBillingPolicyStore(db, () => `report-policy-${++sequence}`, () => now);
				const saved = await policyStore.get();
				await policyStore.upsert({ revision: saved.revision, policy: { ...saved.policy, isEnabled: true } }, 'alice');
				const context = { transportPeerIp: '127.0.0.1', headers: { 'cf-ipcountry': 'JP' } };
				const requirements = await policyStore.requirements(context);
				const large = { ...offer, id: 'report-offer', serviceKey: 'report-plan', pricingAssetKey: 'report-unit', currencyCode: 'JPY', amountBaseUnits: '90071992547409931234567890' };
				await store.saveOffer(large, 'alice');
				const created = await store.createOrder('bob', large.id, 'bob-wallet', 'report-large', large, undefined, { ...context, consent: { statementId: requirements.statement.id, agreed: true } });
				await store.submitTransaction('bob', created.id, hash(902));
				const router = createBillingReportsRouter(reports, { store, rpcUrl: async () => 'https://synthetic.invalid', readReceipt: async (_chain, txHash) => { const current = await reports.find(created.id); const result = proof(current); result.evidence.txHash = txHash; result.evidence.transfers[0].amountBaseUnits = large.amountBaseUnits; return result; } });
				const native = (admin, permission) => createRouterClient(router, { context: { credential: 'synthetic', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, { permission }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null }, authorization: { rootUserId: () => null, roles: async () => [{ isAdministrator: admin }], policyAllowed: async () => false } } });
				await assert.rejects(native(false, ['read:admin:meta']).listAdminBillingOrders({}));
				const ownerHistory = await native(false, ['read:account']).listBillingOrderHistory({ limit: 1 });
				assert.equal(ownerHistory.items.length, 1); assert.ok((await store.listOrders('alice')).some(row => row.id === ownerHistory.items[0].id));
				await assert.rejects(native(false, ['read:account']).listBillingOrderHistory({ userId: 'bob' }));
				await assert.rejects(native(true, ['read:admin:meta']).checkAdminBillingOrder({ orderId: created.id }));
				await qr.query('CREATE FUNCTION abort_confirmation_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.info->>\'action\' = \'confirmServiceOrder\' THEN RAISE EXCEPTION \'synthetic audit rollback\'; END IF; RETURN NEW; END $$');
				await qr.query('CREATE TRIGGER abort_confirmation_audit BEFORE INSERT ON moderation_log FOR EACH ROW EXECUTE FUNCTION abort_confirmation_audit()');
				await assert.rejects(native(true, ['write:admin:meta']).checkAdminBillingOrder({ orderId: created.id }));
				assert.equal((await reports.find(created.id)).status, 'pending');
				assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_transaction_claim WHERE "txHash"=$1', [hash(902)]))[0].count, 0);
				await qr.query('DROP TRIGGER abort_confirmation_audit ON moderation_log');
				const paid = await native(true, ['write:admin:meta']).checkAdminBillingOrder({ orderId: created.id });
				assert.equal(paid.order.status, 'paid'); assert.equal(paid.userId, 'bob');
				await native(true, ['write:admin:meta']).checkAdminBillingOrder({ orderId: created.id });
				assert.equal((await qr.query('SELECT count(*)::int AS count FROM moderation_log WHERE info->>\'action\'=\'confirmServiceOrder\''))[0].count, 1);
				const entity = await reports.find(created.id);
				const repository = db.getRepository((await import('../../../backend/built/features/billing/backend.js')).MiBillingServiceOrder);
				const add = async (suffix, overrides) => repository.insert({ ...entity, id: `report-${suffix}`, requestKey: `report-${suffix}`, txHash: hash(1000 + suffix), ...overrides });
				await add(1, { cashAmountBaseUnits: '1', receiptSnapshot: null });
				await add(2, { offer: { ...large, currencyCode: 'USD' }, receiptSnapshot: { ...entity.receiptSnapshot, tax: { ...entity.receiptSnapshot.tax, currencyCode: 'USD' } } });
				await add(3, { offer: { ...large, decimals: 0 } });
				await add(4, { paidAt: now + 1 });
				await add(5, { paidAt: now - 1 });
				const railKey = `rail:chain:${offer.chainId}:token:${offer.contractAddress.toLowerCase()}`;
				await add(6, { offer: { ...large, pricingAssetKey: railKey } });
				await add(7, { offer: { ...large, pricingAssetKey: undefined } });
				const summary = await native(true, ['read:admin:meta']).getBillingSalesSummary({ from: now, to: now + 1 });
				assert.equal(summary.count, 6); assert.equal(summary.unknownTaxCount, 1); assert.equal(summary.byCurrency.length, 5);
				assert.ok(summary.byCurrency.some(bucket => bucket.assetKey === railKey)); assert.ok(summary.byCurrency.some(bucket => bucket.assetKey === `asset:${railKey}`));
				const mixed = summary.byCurrency.find(bucket => bucket.assetKey === 'asset:report-unit' && bucket.currencyCode === 'JPY' && bucket.decimals === 6);
				assert.equal(mixed.grossBaseUnits, (BigInt(large.amountBaseUnits) + 1n).toString()); assert.equal(mixed.netBaseUnits, null); assert.equal(mixed.taxBaseUnits, null);
				assert.ok(summary.byTax.some(bucket => bucket.taxName === 'Tax' && bucket.taxBaseUnits !== null));
				assert.ok(summary.byTax.some(bucket => bucket.taxName === null && bucket.taxBaseUnits === null));
				const page = await native(true, ['read:admin:meta']).listAdminBillingOrders({ userId: 'bob', limit: 1 });
				assert.equal(page.items.length, 1); assert.equal(page.items[0].userId, 'bob'); assert.ok(page.nextCursor);
				const next = await native(true, ['read:admin:meta']).listAdminBillingOrders({ userId: 'bob', limit: 1, cursor: page.nextCursor });
				assert.notEqual(next.items[0].order.id, page.items[0].order.id);
				await assert.rejects(reports.summary(now, now));
				await new ReportsMigration().down(qr); await new ReportsMigration().up(qr);
				assert.deepEqual((await db.driver.createSchemaBuilder().log()).upQueries.filter(row => /"billing_service_order"/.test(row.query)), []);
				await policyStore.upsert({ revision: saved.revision + 1, policy: { ...saved.policy, isEnabled: false } }, 'alice');
			} finally { now = originalTime; }
		});
		await t.test('registered residence gates only new purchases and freezes original self declaration', async () => {
			const residences = createResidenceStore(db, () => now);
			const existing = (await store.listOrders('alice'))[0];
			await qr.query('UPDATE user_profile SET "billingResidence" = NULL WHERE "userId" = $1', ['alice']);
			assert.equal((await residences.get('alice')).isReady, false);
			await assert.rejects(store.createOrder('alice', offer.id, 'alice-wallet', 'residence-missing', offer), error => error.code === 'RESIDENCE_REQUIRED');
			const replay = await store.createOrder('alice', existing.offer.id, existing.walletId, existing.requestKey, existing.offer, existing.quote ? { revision: existing.billingRevision, quote: existing.quote } : undefined, existing.receiptSnapshot ? { headers: {}, consent: { statementId: existing.receiptSnapshot.statement.id, agreed: true } } : undefined);
			assert.equal(replay.id, existing.id); assert.deepEqual(replay.declaredResidence, existing.declaredResidence);
			await store.listOrders('alice'); await store.submitTransaction('alice', existing.id);
			const saved = await residences.save('alice', { revision: 0, residence: { country: 'US', subdivision: 'US-CA' } });
			assert.equal(saved.kind, 'self_declared');
			await assert.rejects(residences.save('alice', { revision: 0, residence: { country: 'JP', subdivision: null } }), error => error.code === 'RESIDENCE_CONFLICT');
			const nextOffer = { ...offer, id: 'residence-offer', serviceKey: 'residence-service' }; await store.saveOffer(nextOffer, 'alice');
			const next = await store.createOrder('alice', nextOffer.id, 'alice-wallet', 'residence-valid', nextOffer);
			assert.deepEqual(next.declaredResidence, saved);
			await residences.save('alice', { revision: saved.revision, residence: { country: 'JP', subdivision: 'JP-13' } });
			assert.deepEqual((await store.listOrders('alice')).find(row => row.id === next.id).declaredResidence, saved);
			const policyLock = db.createQueryRunner(); await policyLock.startTransaction();
			await policyLock.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
			const saving = residences.save('alice', { revision: saved.revision + 1, residence: { country: 'US', subdivision: null } });
			// Observe the wait, then publish a stricter rule while holding the same lock.
			let blocked = false;
			try {
				for (let attempt = 0; attempt < 100 && !blocked; attempt++) {
					blocked = (await qr.query('SELECT 1 FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.application_name=\'misskey-billing-service-synthetic\' AND l.locktype=\'advisory\' AND NOT l.granted')).length > 0;
					if (!blocked) await new Promise(resolve => setTimeout(resolve, 10));
				}
				assert.equal(blocked, true, 'residence save waits for current policy');
				await policyLock.query('UPDATE billing_policy SET policy=jsonb_set(policy, \'{residenceRequiredSubdivisions}\', \'["US"]\'::jsonb) WHERE id=\'server\'');
			} finally { await policyLock.commitTransaction(); await policyLock.release(); }
			await assert.rejects(saving, error => error.code === 'RESIDENCE_REQUIRED');
			assert.equal((await residences.get('alice')).residence.country, 'JP');
			await assert.rejects(new ResidenceMigration().down(qr), /Retain/);
		});
		await t.test('paid evidence remains claimed after account deletion', async () => {
			await qr.query('DELETE FROM "user" WHERE id = \'alice\'');
			assert.equal((await qr.query('SELECT count(*)::int AS count FROM billing_service_order WHERE "txHash" = $1 AND status = \'paid\'', [hash(1)]))[0].count, 1);
		});
	} finally { await qr.query(`DROP SCHEMA "${schema}" CASCADE`); await qr.release(); await db.destroy(); }
});
