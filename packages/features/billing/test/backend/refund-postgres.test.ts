/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { BillingCountryEligibility1792138000000 as CountryMigration } from '../../../../backend/migration/1792138000000-BillingCountryEligibility.js';
import { PeerCountryEligibility1792138000001 as PeerCountryMigration } from '../../../../backend/migration/1792138000001-PeerCountryEligibility.js';

import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { expect, test } from 'vitest';
import { createRouterClient } from '@orpc/server';
import { entities } from '@features/persistence/backend/postgres.js';
import { PeerPayments1791950000000 as PeerMigration } from '../../../../backend/migration/1791950000000-PeerPayments.js';
import { PeerBroadcastStart1792101000000 as BroadcastMigration } from '../../../../backend/migration/1792101000000-PeerBroadcastStart.js';
import { createServiceBillingStore } from '../../backend/service-store.js';
import { createBillingPolicyStore } from '../../backend/policy-store.js';
import { createRefundStore } from '../../backend/refund-store.js';
import { createRefundRouter } from '../../backend/refund.implementation.js';
import { activePaidRoleIds } from '../../backend/service-role.provider.js';
import { BillingServiceSubscriptions1791838800000 } from '../../../../backend/migration/1791838800000-BillingServiceSubscriptions.js';
import { BillingWalletRegistration1791760200000 } from '../../../../backend/migration/1791760200000-BillingWalletRegistration.js';
import { BillingFundedTerms1792010000000 } from '../../../../backend/migration/1792010000000-BillingFundedTerms.js';
import { BillingWalletChainSettings1791763800000 } from '../../../../backend/migration/1791763800000-BillingWalletChainSettings.js';
import { BillingCatalogAdministration1792020000000 } from '../../../../backend/migration/1792020000000-BillingCatalogAdministration.js';
import { AccountDeclaredResidence1792100000000 } from '../../../../backend/migration/1792100000000-AccountDeclaredResidence.js';
import { BillingOrderReports1792023000000 } from '../../../../backend/migration/1792023000000-BillingOrderReports.js';
import { BillingNotifications1792022000000 } from '../../../../backend/migration/1792022000000-BillingNotifications.js';
import { BillingTaxResidency1792021000000 } from '../../../../backend/migration/1792021000000-BillingTaxResidency.js';
import { BillingRefunds1792011000000 } from '../../../../backend/migration/1792011000000-BillingRefunds.js';
import type { ServiceOffer } from '../../backend/api.definition.js';
import type { ReceiptReader, ReceiptResult } from '../../backend/transfer-confirmation.js';
import type { RefundData } from '../../shared/refund-types.js';
const url = process.env.MISSKEY_BILLING_TEST_DATABASE_URL;
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
const day = 86400000;
test.skipIf(!url)('native PostgreSQL refund API, claims, all-group atomic expiry and rollback', async () => {
	const schema = `refund_${randomUUID().replaceAll('-', '')}`;
	const db = new DataSource({ type: 'postgres', url, schema, extra: { options: `-c search_path=${schema}` }, entities });
	await db.initialize(); const qr = db.createQueryRunner();
	let now = Date.parse('2026-10-14T00:00:00Z'), sequence = 0;
	const started = now, id = () => `test-${(++sequence).toString().padStart(8, '0')}`;
	const purchase = createServiceBillingStore(db, id, () => now);
	const receipts = new Map<string, ReceiptResult>();
	let reads = 0, disappear = false;
	const read: ReceiptReader = async (_chain, tx) => { reads++; return disappear && reads === 4 ? { status: 'pending' } : receipts.get(tx) ?? { status: 'pending' }; };
	const refunds = createRefundStore(db, id, read, () => now);
	const offer: ServiceOffer = { id: 'basic', serviceKey: 'basic', planGroup: 'plan', sortOrder: 1, name: 'Synthetic', chainId: 1, roleId: 'normal', contractAddress: address(3), recipientAddress: address(9), tokenSymbol: 'TEST', decimals: 6, amountBaseUnits: '100', duration: 10, durationUnit: 'days', confirmationsRequired: 2, isEnabled: true };

	async function buy(key: string, wallet: string, n: number) {
		const quoted = await purchase.quoteOrder('alice', offer.id);
		const row = await purchase.createOrder('alice', offer.id, wallet, key, offer, quoted);
		await purchase.submitTransaction('alice', row.id, hash(n));
		return purchase.applyReceipt('alice', row.id, hash(n), { status: 'confirmed', evidence: { chainId: row.chainId, txHash: hash(n), timestamp: row.createdAt, transfers: [{ logIndex: 0, contractAddress: offer.contractAddress, fromAddress: row.payerAddress, toAddress: offer.recipientAddress, amountBaseUnits: row.cashAmountBaseUnits! }] } });
	}

	async function prepareTransfers(row: RefundData, offset: number) {
		for (const group of row.quote!.groups) {
			row = await refunds.start(row.id, group.id, row.version, address(9), 'admin');
			row = await refunds.submit(row.id, group.id, hash(offset + Number(group.id)), 'admin');
			const transfer = row.transfers.find(item => item.id === group.id)!;
			receipts.set(transfer.txHash!, { status: 'confirmed', evidence: { chainId: group.chainId, txHash: transfer.txHash!, timestamp: transfer.startedAt!, blockHash: hash(999), blockNumber: '100', transfers: [{ logIndex: 1, contractAddress: group.contractAddress, fromAddress: transfer.senderAddress!, toAddress: group.payerAddress, amountBaseUnits: group.amountBaseUnits }] } });
		}
		return row;
	}

	try {
		await qr.query(`CREATE SCHEMA "${schema}"`);
		await qr.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		await qr.query('INSERT INTO "user" VALUES (\'alice\'),(\'bob\'),(\'admin\'),(\'carol\'),(\'dave\')');
		await qr.query('CREATE TABLE role (id varchar(32) PRIMARY KEY, target varchar(16), "isAdministrator" boolean, "isModerator" boolean)');
		await qr.query('INSERT INTO role VALUES (\'normal\',\'manual\',false,false)');
		await new BillingWalletRegistration1791760200000().up(qr); await new PeerMigration().up(qr); await new BroadcastMigration().up(qr);
		await new BillingServiceSubscriptions1791838800000().up(qr);
		const funded = new BillingFundedTerms1792010000000(), migration = new BillingRefunds1792011000000();
		await funded.up(qr); await migration.up(qr); await migration.down(qr); await funded.down(qr); await funded.up(qr); await migration.up(qr);
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'wallet-a\',\'alice\',1,$1,NULL,$3,$3),(\'wallet-b\',\'alice\',1,$2,NULL,$3,$3)', [address(1), address(2), now]);
		await new BillingWalletChainSettings1791763800000().up(qr);
		await new BillingCatalogAdministration1792020000000().up(qr);
		await new BillingTaxResidency1792021000000().up(qr);
		await new BillingNotifications1792022000000().up(qr);
		await new BillingOrderReports1792023000000().up(qr);
		await qr.query('CREATE TABLE user_profile ("userId" varchar(32) PRIMARY KEY)');
		await new AccountDeclaredResidence1792100000000().up(qr);
		await new CountryMigration().up(qr); await new CountryMigration().down(qr); await new CountryMigration().up(qr);
		await new PeerCountryMigration().up(qr); await new PeerCountryMigration().down(qr); await new PeerCountryMigration().up(qr);
		await qr.query('INSERT INTO billing_policy (id, revision, policy, \"updatedAt\") VALUES ($1,0,$2::jsonb,$3)', ['server', JSON.stringify({ isEnabled: false, countryEligibility: { operatorCountry: 'JP', mode: 'allow', allowedCountries: ['JP', 'US'] } }), new Date(now)]);
		await qr.query('INSERT INTO user_profile ("userId", "billingResidence") SELECT id, $1::jsonb FROM "user"', [JSON.stringify({ country: 'JP', subdivision: 'JP-13', revision: 1, declaredAt: now, kind: 'self_declared' })]);
		await qr.query('CREATE TABLE moderation_log (id varchar(32) PRIMARY KEY, "userId" varchar(32) NOT NULL, type varchar(128) NOT NULL, info jsonb NOT NULL)');
		await purchase.saveOffer(offer, 'admin');
		const first = await buy('first', 'wallet-a', 1); now += day; const second = await buy('second', 'wallet-b', 2);
		const policyStore = createBillingPolicyStore(db, () => `policy-${++sequence}`, () => now);
		const seller = { name: 'Refund seller', address: 'Synthetic address', invoiceRegistrationNumber: 'Synthetic number' };
		const policy = { countryEligibility: { operatorCountry: 'JP' as const, mode: 'allow' as const, allowedCountries: ['JP', 'US'] as Array<'JP' | 'US'> }, isEnabled: false, trustedProxyCidrs: [], regionRules: { mode: 'allow' as const, rules: [{ country: 'JP' }] }, taxName: 'Tax', taxRate: '0.2', seller, statementText: 'Synthetic statement' };
		await policyStore.upsert({ revision: 0, policy }, 'admin');
		const region: Record<string, unknown> = Object.fromEntries(['country', 'isEUCountry', 'city', 'continent', 'latitude', 'longitude', 'postalCode', 'metroCode', 'region', 'regionCode', 'timezone'].map(key => [key, null])); region.country = 'JP';
		await qr.query('UPDATE billing_service_order SET "receiptSnapshot"=$1::jsonb WHERE id=$2', [JSON.stringify({ version: 1, consentedAt: started, region, statement: { id: 'synthetic-statement', country: 'JP', statement: 'Original statement' }, seller: { ...seller, name: 'Purchase seller' }, tax: { name: 'Original tax', rate: '0.1', currencyCode: 'JPY', includedBaseUnits: '100', excludedBaseUnits: '90', taxBaseUnits: '10' } }), first.id]);
		expect(await activePaidRoleIds(db, 'alice', now)).toEqual(['normal']);
		const requested = await refunds.request('alice', 'request', started + 5 * day, 'end after five days');
		expect(requested.quote!.groups.map(group => group.amountBaseUnits).sort()).toEqual(['100', '50']);
		await expect(refunds.show(requested.id, 'bob')).rejects.toMatchObject({ code: 'BILLING_NOT_FOUND' });
		const publicClient = createRouterClient(createRefundRouter(refunds), { context: { credential: 'synthetic', headers: {}, ip: '127.0.0.1', services: { authenticate: async () => [{ id: 'alice', isSuspended: false, movedToUri: null }, { permission: ['read:account', 'write:account'] }], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null }, authorization: { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false } } });
		await expect(publicClient.adminShowRefund({ requestId: requested.id })).rejects.toThrow();
		expect((await publicClient.showRefund({ requestId: requested.id })).id).toBe(requested.id);
		await expect(refunds.decide(requested.id, requested.version, 'admin', 'approve', started, 'too early')).rejects.toMatchObject({ code: 'BILLING_CONFLICT' });
		now += day;
		const outcomes = await Promise.allSettled([refunds.decide(requested.id, requested.version, 'admin', 'approve', undefined, 'approved'), refunds.decide(requested.id, requested.version, 'admin', 'approve', undefined, 'approved')]);
		expect(outcomes.filter(item => item.status === 'fulfilled')).toHaveLength(1);
		let prepared = await refunds.show(requested.id); expect(prepared.effectiveCutoffAt).toBe(requested.requestedCutoffAt);
		await expect(purchase.quoteOrder('alice', offer.id)).rejects.toMatchObject({ code: 'BILLING_CONFLICT' });
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'dave-wallet\',\'dave\',1,$1,NULL,$2,$2)', [address(5), now]);
		const unrelatedQuote = await purchase.quoteOrder('dave', offer.id);
		const unrelated = await purchase.createOrder('dave', offer.id, 'dave-wallet', 'nonmatching-hint', offer, unrelatedQuote);
		await purchase.submitTransaction('dave', unrelated.id, hash(100));
		prepared = await prepareTransfers(prepared, 100);
		expect((await purchase.applyReceipt('dave', unrelated.id, hash(100), receipts.get(hash(100))!)).status).toBe('failed');
		await expect(refunds.cancel(prepared.id, 'alice', 'alice')).rejects.toMatchObject({ code: 'BILLING_CONFLICT' });
		expect((await refunds.submit(prepared.id, '0', prepared.transfers[0].txHash!, 'admin')).version).toBe(prepared.version);
		await expect(refunds.submit(prepared.id, '0', hash(200), 'admin')).rejects.toMatchObject({ code: 'BILLING_CONFLICT' });
		const lastHash = prepared.transfers.at(-1)!.txHash!, last = receipts.get(lastHash)!; receipts.delete(lastHash);
		expect((await refunds.check(prepared.id, 'admin')).status).toBe('processing');
		expect(await activePaidRoleIds(db, 'alice', started + 6 * day)).toEqual(['normal']);
		receipts.set(lastHash, last); disappear = true; reads = 0;
		expect((await refunds.check(prepared.id, 'admin')).status).toBe('processing'); disappear = false;
		await qr.query('CREATE FUNCTION abort_refund() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.data->>\'status\' = \'completed\' THEN RAISE EXCEPTION \'rollback fixture\'; END IF; RETURN NEW; END $$');
		await qr.query('CREATE TRIGGER abort_refund BEFORE UPDATE ON billing_refund FOR EACH ROW EXECUTE FUNCTION abort_refund()');
		await expect(refunds.check(prepared.id, 'admin')).rejects.toThrow('rollback fixture');
		expect(await activePaidRoleIds(db, 'alice', started + 6 * day)).toEqual(['normal']);
		await qr.query('DROP TRIGGER abort_refund ON billing_refund');
		const completed = await refunds.check(prepared.id, 'admin'); expect(completed.status).toBe('completed'); expect(completed.document!.originalPurchases).toHaveLength(2);
		expect(completed.document!.seller).toEqual(seller); expect(completed.document!.adjustmentReason).toBe('approved');
		expect(completed.document!.taxAdjustments!.find(line => line.sourceOrderId === first.id)!.tax).toMatchObject({ name: 'Original tax', rate: '0.1', includedBaseUnits: '50', excludedBaseUnits: '45', taxBaseUnits: '5' });
		expect(completed.document!.taxAdjustments!.find(line => line.sourceOrderId === second.id)!.tax).toBeNull();
		await policyStore.upsert({ revision: 1, policy: { ...policy, seller: { ...seller, name: 'New seller' } } }, 'admin');
		expect((await publicClient.refundDocument({ requestId: completed.id })).seller).toEqual(seller);
		expect(await activePaidRoleIds(db, 'alice', started + 5 * day - 1)).toEqual(['normal']);
		expect(await activePaidRoleIds(db, 'alice', started + 5 * day)).toEqual([]);
		expect((await refunds.check(prepared.id, 'admin')).version).toBe(completed.version);
		const original = await purchase.listOrders('alice'); expect(original.find(row => row.id === first.id)!.endsAt).toBe(first.endsAt); expect(original.find(row => row.id === second.id)!.status).toBe('paid');
		const partial = await refunds.request('alice', 'partial-two', started + 3 * day, 'second partial');
		expect(partial.quote!.groups.map(group => group.amountBaseUnits)).toEqual(['20']);
		let partialPrepared = await refunds.decide(partial.id, partial.version, 'admin', 'approve', undefined, 'approved'); partialPrepared = await prepareTransfers(partialPrepared, 300); await refunds.check(partialPrepared.id, 'admin');
		const state = (await qr.query('SELECT data FROM billing_account_state WHERE "userId" = \'alice\''))[0].data;
		expect(state.refunded[first.id]).toBe('70'); expect(state.refunded[second.id]).toBe('100');
		const immediate = await refunds.request('alice', 'immediate', undefined, 'now'); now += 1000;
		expect((await refunds.request('alice', 'immediate', undefined, 'now')).requestedCutoffAt).toBe(immediate.requestedCutoffAt);
		await expect(refunds.request('alice', 'immediate', immediate.requestedCutoffAt, 'now')).rejects.toMatchObject({ code: 'BILLING_CONFLICT' });
		await refunds.cancel(immediate.id, 'alice', 'alice');
		const freshQuote = await purchase.quoteOrder('alice', offer.id); const pending = await purchase.createOrder('alice', offer.id, 'wallet-a', 'proof-reuse', offer, freshQuote);
		await expect(purchase.submitTransaction('alice', pending.id, hash(100))).rejects.toMatchObject({ code: 'BILLING_CONFLICT' }); await purchase.cancelOrder('alice', pending.id);
		await qr.query('INSERT INTO billing_service_order (id,"userId","requestKey","walletId",offer,"chainId","payerAddress",status,"txHash","createdAt","expiresAt","paidAt","startsAt","endsAt") VALUES (\'legacy\',\'bob\',\'legacy\',\'old\',$1,1,$2,\'paid\',$3,$4,$5,$4,$4,$6)', [offer, address(5), hash(400), now, now + day, now + 10 * day]);
		const railA = { ...offer, id: 'rail-a', serviceKey: 'rail-a', planGroup: 'rails', pricingAssetKey: 'USD' };
		const railB = { ...railA, id: 'rail-b', serviceKey: 'rail-b', sortOrder: 2, chainId: 2, contractAddress: address(4), amountBaseUnits: '200' };
		await qr.query('INSERT INTO billing_wallet (id,"userId","chainId",address,label,"createdAt","updatedAt") VALUES (\'carol-a\',\'carol\',1,$1,NULL,$3,$3),(\'carol-b\',\'carol\',2,$2,NULL,$3,$3)', [address(6), address(7), now]);
		await purchase.saveOffer(railA, 'admin'); await purchase.saveOffer(railB, 'admin');

		async function buyRail(terms: ServiceOffer, wallet: string, tx: number) {
			const quote = await purchase.quoteOrder('carol', terms.id);
			const row = await purchase.createOrder('carol', terms.id, wallet, String(tx), terms, quote);
			await purchase.submitTransaction('carol', row.id, hash(tx));
			return purchase.applyReceipt('carol', row.id, hash(tx), { status: 'confirmed', evidence: { chainId: row.chainId, txHash: hash(tx), timestamp: row.createdAt, transfers: [{ logIndex: 1, contractAddress: row.offer.contractAddress, fromAddress: row.payerAddress, toAddress: row.offer.recipientAddress, amountBaseUnits: row.cashAmountBaseUnits! }] } });
		}

		await buyRail(railA, 'carol-a', 500); now += 5 * day; const upgraded = await buyRail(railB, 'carol-b', 501);
		expect(upgraded.cashAmountBaseUnits).toBe('150');
		const mixed = await refunds.request('carol', 'mixed-rails', now + day, 'original rails');
		expect(mixed.quote!.groups.map(group => [group.chainId, group.contractAddress, group.payerAddress, group.amountBaseUnits])).toEqual([[1, address(3), address(6), '45'], [2, address(4), address(7), '135']]);
		let mixedPrepared = await refunds.decide(mixed.id, mixed.version, 'admin', 'approve', undefined, 'approved'); mixedPrepared = await prepareTransfers(mixedPrepared, 600);
		expect((await refunds.check(mixedPrepared.id, 'admin')).document!.originalPurchases).toHaveLength(2);
		const legacy = await refunds.request('bob', 'unknown', undefined, 'legacy'); expect(legacy.status).toBe('review_required');
		const reviewed = await refunds.decide(legacy.id, legacy.version, 'admin', 'approve', undefined, 'review'); expect(reviewed.status).toBe('review_required');
	} finally { await qr.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await qr.release(); await db.destroy(); }
}, 60000);
