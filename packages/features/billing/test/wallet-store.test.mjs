/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createRouterClient } from '@orpc/server';
import { createPostgresWalletStore, createWalletAuthentication, createPostgresWalletChainStore, createResidenceStore } from '../../../backend/built/features/billing/backend.js';
import { BillingWalletRegistration1791760200000 as Migration } from '../../../backend/migration/1791760200000-BillingWalletRegistration.js';
import { BillingWalletChainSettings1791763800000 as ChainMigration } from '../../../backend/migration/1791763800000-BillingWalletChainSettings.js';
import { composeNativeTestRouter, nativeTestDependencies } from '../../api/test/native-router-fixture.mjs';

const require = createRequire(new URL('../../../backend/package.json', import.meta.url));
const { DataSource } = require('typeorm');
const url = process.env.MISSKEY_BILLING_TEST_DATABASE_URL;

test('real PostgreSQL wallet ownership, atomic consumption, rollback and native account list', { skip: !url }, async () => {
	const parsed = new URL(url);
	assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname), 'Synthetic database must be on loopback');
	const schema = `billing_test_${randomUUID().replaceAll('-', '')}`;
	const db = new DataSource({ type: 'postgres', url, schema, extra: { options: `-c search_path=${schema}`, application_name: 'misskey-billing-synthetic' },
																													entities: (await import('../../../backend/built/postgres.js')).entities,
	});
	await db.initialize();
	const qr = db.createQueryRunner();
	const migration = new Migration();
	try {
		await qr.query(`CREATE SCHEMA "${schema}"`);
		await qr.query('CREATE TABLE "user" ("id" varchar(32) PRIMARY KEY)');
		await qr.query('INSERT INTO "user" ("id") VALUES (\'alice\'), (\'bob\')');
		await qr.query('CREATE TABLE user_profile ("userId" varchar(32) PRIMARY KEY, "billingResidence" jsonb)');
		await qr.query('CREATE TABLE billing_policy (id varchar(32) PRIMARY KEY, revision integer, policy jsonb, "updatedAt" timestamptz, "updatedByUserId" varchar(32))');
		await qr.query('INSERT INTO user_profile SELECT id, $1::jsonb FROM "user"', [JSON.stringify({ country: 'JP', subdivision: 'JP-13', revision: 1, declaredAt: 1, kind: 'self_declared' })]);
		await migration.up(qr); await migration.down(qr); await migration.up(qr);
		const chainMigration = new ChainMigration();
		await chainMigration.up(qr); await chainMigration.down(qr); await chainMigration.up(qr);
		const diff = await db.driver.createSchemaBuilder().log();
		// Check DDL targeting wallet tables/indexes, not another table merely referencing a wallet chain.
		const isWalletDdl = q => {
			const query = q.query.replace(/"[^"]+"\./g, '');
			return /(?:TABLE|ON) "billing_wallet(?:_challenge|_chain)?"/.test(query) || /(?:CREATE|DROP) (?:UNIQUE )?INDEX "billing_wallet[^"]*"/.test(query);
		};
		assert.deepEqual(diff.upQueries.filter(isWalletDdl), [], 'Entity metadata agrees with wallet migration');
		await qr.query('ALTER TABLE billing_wallet ADD COLUMN synthetic_drift integer');
		assert.ok((await db.driver.createSchemaBuilder().log()).upQueries.some(isWalletDdl), 'Wallet DDL drift is still detected');
		await qr.query('ALTER TABLE billing_wallet DROP COLUMN synthetic_drift');
		await qr.query('CREATE INDEX billing_wallet_synthetic_drift ON billing_wallet (label)');
		assert.ok((await db.driver.createSchemaBuilder().log()).upQueries.some(isWalletDdl), 'Wallet index DDL drift is still detected');
		await qr.query('DROP INDEX billing_wallet_synthetic_drift');
		let now = 1000;
		const chainStore = createPostgresWalletChainStore(db, () => now);
		const chain = { chainId: 123456, name: 'Synthetic chain', nativeCurrencyName: 'Synthetic coin', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null, isEnabled: true };
		const privateRpc = 'https://synthetic-fixture:fake@rpc.example.test/private-token';
		assert.deepEqual(await chainStore.chains(), []);
		const first = await chainStore.upsertSettings({ ...chain, rpcUrl: privateRpc }, 'alice');
		assert.deepEqual(first, { ...chain, hasRpc: true });
		assert.equal(JSON.stringify(await chainStore.listSettings()).includes(privateRpc), false);
		assert.equal(await chainStore.rpcUrl(chain.chainId), privateRpc);
		assert.equal((await chainStore.chains()).length, 1);
		await chainStore.upsertSettings(chain, 'bob'); // Omitted URL preserves it on retry.
		await chainStore.upsertSettings(chain, 'bob');
		assert.equal((await chainStore.listSettings()).length, 1);
		assert.equal(await chainStore.rpcUrl(chain.chainId), privateRpc);
		assert.equal((await qr.query('SELECT "updatedByUserId" FROM "billing_wallet_chain"'))[0].updatedByUserId, 'bob');
		await chainStore.upsertSettings({ ...chain, isEnabled: false }, 'alice');
		assert.deepEqual(await chainStore.chains(), []);
		assert.equal(await chainStore.rpcUrl(chain.chainId), null); // Current disablement stops registration and verification.
		await chainStore.upsertSettings({ ...chain, rpcUrl: 'https://replacement.example.test' }, 'alice');
		assert.equal(await chainStore.rpcUrl(chain.chainId), 'https://replacement.example.test');
		await chainStore.upsertSettings({ ...chain, rpcUrl: null }, 'alice');
		assert.equal(await chainStore.rpcUrl(chain.chainId), null);
		assert.deepEqual(await chainStore.chains(), []);
		assert.equal((await chainStore.listSettings())[0].hasRpc, false);

		const store = createPostgresWalletStore(db, () => now);
		const address = '0x0000000000000000000000000000000000000001';
		const challenge = (nonce, userId = 'alice') => ({ nonce, userId, chainId: 123456, address, domain: 'misskey.example.test', uri: 'https://misskey.example.test', message: 'Synthetic exact proof', createdAt: 1000, expiresAt: 601000, usedAt: null });
		const wallet = (id, userId = 'alice') => ({ id, userId, chainId: 123456, address, label: null, createdAt: 1000, updatedAt: 1000 });
		await store.insertChallenge(challenge('residence-missing'));
		const savedResidence = (await qr.query('SELECT "billingResidence" FROM user_profile WHERE "userId"=$1', ['alice']))[0].billingResidence;
		await qr.query('UPDATE user_profile SET "billingResidence"=NULL WHERE "userId"=$1', ['alice']);
		await assert.rejects(store.complete(challenge('residence-missing'), wallet('missing-residence-wallet'), now), error => error.code === 'RESIDENCE_REQUIRED');
		assert.equal((await store.getChallenge('residence-missing', 'alice')).usedAt, null); assert.equal((await store.list('alice')).length, 0);
		await qr.query('UPDATE user_profile SET "billingResidence"=$1::jsonb WHERE "userId"=$2', [JSON.stringify(savedResidence), 'alice']);
		await store.insertChallenge(challenge('race0001'));
		const raced = await Promise.all([store.complete(challenge('race0001'), wallet('wallet-a'), now), store.complete(challenge('race0001'), wallet('wallet-b'), now)]);
		assert.equal(raced.filter(Boolean).length, 1);
		assert.equal((await store.list('alice')).length, 1);
		assert.equal((await store.getChallenge('race0001', 'alice')).usedAt, now);
		assert.equal(await store.getChallenge('race0001', 'bob'), null);
		assert.equal(await store.complete(challenge('race0001'), wallet('replay'), now), null);
		await store.insertChallenge(challenge('duplicate', 'bob'));
		assert.equal(await store.complete(challenge('duplicate', 'bob'), wallet('wallet-bob', 'bob'), now), null);
		assert.equal((await store.getChallenge('duplicate', 'bob')).usedAt, null);
		assert.equal(await store.unlink(raced.find(Boolean).id, 'bob'), false);

		const auth = createWalletAuthentication({
			profiles: { findOneByOrFail: async () => ({ password: 'synthetic hash', twoFactorEnabled: true }) },
			passwordMatches: async (password, hash) => password === 'synthetic password' && hash === 'synthetic hash',
			auth: { twoFactorAuthenticate: async (_profile, token) => { assert.equal(token, 'synthetic OTP'); } },
			passkeys: { initiateAuthentication: async () => ({ challenge: 'fixture', userVerification: 'required' }), verifyAuthentication: async () => false },
		});
		const actor = { id: 'alice', isSuspended: false, movedToUri: null };
		const dependencies = nativeTestDependencies({ actor, events: [] });
		dependencies.wallets = { requireResidence: createResidenceStore(db).require, ...auth, store, origin: 'https://misskey.example.test', chainSettings: chainStore, chains: chainStore.chains, rpcUrl: chainStore.rpcUrl, id: () => 'native-linked', now: () => now, nonce: () => 'nativeNonce0001', verify: async () => true }; // Synthetic signature verifier; no network or signing.
		const context = { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [actor, { permission: ['read:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } };
		const router = composeNativeTestRouter(dependencies);
		const client = createRouterClient(router, { context });
		const rows = await client.wallets.list({});
		assert.equal(rows.length, 1); assert.equal('userId' in rows[0], false);
		await assert.rejects(client.wallets.unlink({ walletId: rows[0].id }), e => e.code === 'PERMISSION_DENIED');
		assert.equal(await store.unlink(rows[0].id, 'alice'), true);
		assert.equal(await store.complete(challenge('duplicate', 'bob'), wallet('wallet-bob', 'bob'), now) !== null, true);
		await store.unlink('wallet-bob', 'bob');

		await store.insertChallenge(challenge('rollback'));
		await qr.query('CREATE FUNCTION fail_wallet_consumption() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."usedAt" IS NOT NULL THEN RAISE EXCEPTION \'synthetic rollback\'; END IF; RETURN NEW; END $$');
		await qr.query('CREATE TRIGGER fail_consumption BEFORE UPDATE ON "billing_wallet_challenge" FOR EACH ROW EXECUTE FUNCTION fail_wallet_consumption()');
		await assert.rejects(store.complete(challenge('rollback'), wallet('rollback-wallet'), now), /synthetic rollback/);
		assert.equal(await store.find(123456, address), null);
		assert.equal((await store.getChallenge('rollback', 'alice')).usedAt, null);
		await qr.query('DROP TRIGGER fail_consumption ON "billing_wallet_challenge"');
		await store.insertChallenge(challenge('expireafterpolicy'));
		const policyLock = db.createQueryRunner(); await policyLock.startTransaction();
		await policyLock.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
		const policyWaiting = store.complete(challenge('expireafterpolicy'), wallet('expired-policy-wallet'), now);
		try {
			let blocked = false;
			for (let attempt = 0; attempt < 100 && !blocked; attempt++) {
				blocked = (await qr.query('SELECT 1 FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.application_name=\'misskey-billing-synthetic\' AND l.locktype=\'advisory\' AND NOT l.granted')).length > 0;
				if (!blocked) await new Promise(resolve => setTimeout(resolve, 10));
			}
			assert.equal(blocked, true, 'completion waits on the policy guard before sampling expiry');
			now = 601000;
		} finally { await policyLock.commitTransaction(); await policyLock.release(); }
		assert.equal(await policyWaiting, null);
		assert.equal((await store.getChallenge('expireafterpolicy', 'alice')).usedAt, null);
		assert.equal(await store.find(123456, address), null);
		now = 1000;
		await store.insertChallenge(challenge('expireafterlock'));
		const lock = db.createQueryRunner(); await lock.startTransaction();
		await lock.query('SELECT * FROM "billing_wallet_challenge" WHERE "nonce" = \'expireafterlock\' FOR UPDATE');
		const waiting = store.complete(challenge('expireafterlock'), wallet('expired-wallet'), now);
		now = 601000; await lock.commitTransaction(); await lock.release();
		assert.equal(await waiting, null);
		assert.equal((await store.getChallenge('expireafterlock', 'alice')).usedAt, null);
		const writeContext = { ...context, services: { ...context.services, authenticate: async () => [actor, { permission: ['read:account', 'write:account'] }] } };
		const writer = createRouterClient(router, { context: writeContext });
		await chainStore.upsertSettings({ ...chain, rpcUrl: 'https://rpc.example.test' }, 'alice');
		const proof = await writer.wallets.begin({ chainId: 123456, address, currentPassword: 'synthetic password', twoFactorToken: 'synthetic OTP' });
		await chainStore.upsertSettings({ ...chain, isEnabled: false }, 'alice');
		await assert.rejects(writer.wallets.verify({ ...proof, signature: '0x1234' }), e => e.code === 'WALLET_CHAIN_UNSUPPORTED');
		await assert.rejects(writer.wallets.begin({ chainId: 123456, address, currentPassword: 'synthetic password', twoFactorToken: 'synthetic OTP' }), e => e.code === 'WALLET_CHAIN_UNSUPPORTED');
		await chainStore.upsertSettings(chain, 'alice');
		const linked = await writer.wallets.verify({ ...proof, signature: '0x1234' });
		assert.equal(linked.id, 'native-linked'); assert.equal((await writer.wallets.list({})).length, 1);
		await assert.rejects(writer.wallets.verify({ ...proof, signature: '0x1234' }), e => e.code === 'WALLET_CHALLENGE_NOT_FOUND');
		assert.deepEqual(await writer.wallets.unlink({ walletId: linked.id }), { ok: true });
		await qr.query('DELETE FROM "user" WHERE "id" = \'alice\'');
		assert.equal(await store.getChallenge('rollback', 'alice'), null);
		assert.equal((await qr.query('SELECT "updatedByUserId" FROM "billing_wallet_chain"'))[0].updatedByUserId, null);
	} finally {
		await qr.query(`DROP SCHEMA "${schema}" CASCADE`);
		await qr.release(); await db.destroy();
	}
});
