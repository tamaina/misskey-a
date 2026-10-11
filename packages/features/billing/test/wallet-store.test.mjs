/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createRouterClient } from '@orpc/server';
import { createPostgresWalletStore, createWalletAuthentication } from '../../../backend/built/features/billing/backend.js';
import { BillingWalletRegistration1791760200000 as Migration } from '../../../backend/migration/1791760200000-BillingWalletRegistration.js';
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
		await qr.query(`INSERT INTO "user" ("id") VALUES ('alice'), ('bob')`);
		await migration.up(qr); await migration.down(qr); await migration.up(qr);
		const diff = await db.driver.createSchemaBuilder().log();
		assert.equal(diff.upQueries.filter(q => q.query.includes('billing_wallet')).length, 0, 'Entity metadata agrees with migration');
		let now = 1000;
		const store = createPostgresWalletStore(db, () => now);
		const address = '0x0000000000000000000000000000000000000001';
		const challenge = (nonce, userId = 'alice') => ({ nonce, userId, chainId: 123456, address, domain: 'misskey.example.test', uri: 'https://misskey.example.test', message: 'Synthetic exact proof', createdAt: 1000, expiresAt: 601000, usedAt: null });
		const wallet = (id, userId = 'alice') => ({ id, userId, chainId: 123456, address, label: null, createdAt: 1000, updatedAt: 1000 });
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

		const recent = new Map();
		const auth = createWalletAuthentication({
			profiles: { findOneByOrFail: async () => ({ password: 'synthetic hash', twoFactorEnabled: true }) },
			passwordMatches: async (password, hash) => password === 'synthetic password' && hash === 'synthetic hash',
			auth: { twoFactorAuthenticate: async (_profile, token) => { assert.equal(token, 'synthetic OTP'); } },
			passkeys: { initiateAuthentication: async () => ({ challenge: 'fixture', userVerification: 'required' }), verifyAuthentication: async () => false },
			recent: { get: async key => recent.get(key) ?? null, setex: async (key, _seconds, value) => { recent.set(key, value); } },
		});
		const actor = { id: 'alice', isSuspended: false, movedToUri: null };
		const dependencies = nativeTestDependencies({ actor, events: [] });
		dependencies.wallets = { ...auth, store, origin: 'https://misskey.example.test', chains: async () => [], rpcUrl: async () => 'https://rpc.example.test', id: () => 'native-linked', now: () => now, nonce: () => 'nativeNonce0001', verify: async () => true }; // Synthetic signature verifier; no network or signing.
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
		await qr.query(`CREATE FUNCTION fail_wallet_consumption() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."usedAt" IS NOT NULL THEN RAISE EXCEPTION 'synthetic rollback'; END IF; RETURN NEW; END $$`);
		await qr.query('CREATE TRIGGER fail_consumption BEFORE UPDATE ON "billing_wallet_challenge" FOR EACH ROW EXECUTE FUNCTION fail_wallet_consumption()');
		await assert.rejects(store.complete(challenge('rollback'), wallet('rollback-wallet'), now), /synthetic rollback/);
		assert.equal(await store.find(123456, address), null);
		assert.equal((await store.getChallenge('rollback', 'alice')).usedAt, null);
		await qr.query('DROP TRIGGER fail_consumption ON "billing_wallet_challenge"');
		await store.insertChallenge(challenge('expireafterlock'));
		const lock = db.createQueryRunner(); await lock.startTransaction();
		await lock.query(`SELECT * FROM "billing_wallet_challenge" WHERE "nonce" = 'expireafterlock' FOR UPDATE`);
		const waiting = store.complete(challenge('expireafterlock'), wallet('expired-wallet'), now);
		now = 601000; await lock.commitTransaction(); await lock.release();
		assert.equal(await waiting, null);
		assert.equal((await store.getChallenge('expireafterlock', 'alice')).usedAt, null);
		const writeContext = { ...context, services: { ...context.services, authenticate: async () => [actor, { permission: ['read:account', 'write:account'] }] } };
		const writer = createRouterClient(router, { context: writeContext });
		const proof = await writer.wallets.begin({ chainId: 123456, address, currentPassword: 'synthetic password', twoFactorToken: 'synthetic OTP' });
		const linked = await writer.wallets.verify({ ...proof, signature: '0x1234' });
		assert.equal(linked.id, 'native-linked'); assert.equal((await writer.wallets.list({})).length, 1);
		await assert.rejects(writer.wallets.verify({ ...proof, signature: '0x1234' }), e => e.code === 'WALLET_CHALLENGE_NOT_FOUND');
		assert.deepEqual(await writer.wallets.unlink({ walletId: linked.id }), { ok: true });
		await qr.query(`DELETE FROM "user" WHERE "id" = 'alice'`);
		assert.equal(await store.getChallenge('rollback', 'alice'), null);
	} finally {
		await qr.query(`DROP SCHEMA "${schema}" CASCADE`);
		await qr.release(); await db.destroy();
	}
});
