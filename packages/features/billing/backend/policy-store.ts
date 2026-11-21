/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { calculateIncludedTaxBaseUnits } from '../shared/billing-tax.js';
import { MiBillingPolicy } from './models/BillingPolicy.js';
import { MiBillingResidencyStatement } from './models/BillingResidencyStatement.js';
import { receiptSnapshot } from './policy.schema.js';
import { validateTrustedProxyCidrs, trustedRegionSnapshot, isBillingRegionAllowed } from './policy-region.js';
import { recordCatalogAudit } from './catalog-audit.js';
import type { BillingPolicy, ResidencyConsent, ReceiptSnapshot } from './policy.schema.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { DataSource, EntityManager } from 'typeorm';
export type PurchaseContext = Pick<ApiContext, 'transportPeerIp' | 'headers'> & { consent?: ResidencyConsent };
const unavailable = (): never => { throw new ORPCError('BILLING_UNAVAILABLE'); };
const conflict = (): never => { throw new ORPCError('BILLING_CONFLICT'); };

async function lock(manager: EntityManager) { await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))'); }

async function requirements(manager: EntityManager, context: Pick<PurchaseContext, 'transportPeerIp' | 'headers'>, id: () => string, at: number) {
	await lock(manager);
	const policy = await manager.findOneBy(MiBillingPolicy, { id: 'server' });
	if (!policy?.policy.isEnabled) return { isRequired: false as const, country: null, statement: null, policy: null, region: null };
	const region = trustedRegionSnapshot(context.transportPeerIp, context.headers, policy.policy.trustedProxyCidrs);
	if (!region || !isBillingRegionAllowed(policy.policy.regionRules, region)) return unavailable();

	let statement = await manager.findOneBy(MiBillingResidencyStatement, { country: region.country!, isEnabled: true });
	if (statement?.statement !== policy.policy.statementText) {
		if (statement) await manager.update(MiBillingResidencyStatement, statement.id, { isEnabled: false, retiredAt: new Date(at) });
		statement = manager.create(MiBillingResidencyStatement, { id: id(), country: region.country!, statement: policy.policy.statementText, isEnabled: true, createdAt: new Date(at), retiredAt: null });
		await manager.insert(MiBillingResidencyStatement, statement);
	}
	return { isRequired: true as const, country: region.country, statement: { id: statement.id, country: statement.country, statement: statement.statement }, policy: policy.policy, region };
}

/** Runs inside the same user/order transaction; settings and active statement cannot change between checks and snapshot. */
export async function createReceiptSnapshot(manager: EntityManager, context: PurchaseContext | undefined, amount: string, currencyCode: string | undefined, at: number, id: () => string): Promise<ReceiptSnapshot | null> {
	const current = await requirements(manager, context ?? { headers: {} }, id, at);
	if (!current.isRequired) return null;
	if (!context?.consent?.agreed || context.consent.statementId !== current.statement?.id || !currencyCode || !/^[A-Z]{3}$/.test(currencyCode)) conflict();
	const tax = calculateIncludedTaxBaseUnits(amount, current.policy!.taxRate);
	return v.parse(receiptSnapshot, { version: 1, consentedAt: at, region: current.region, statement: current.statement, seller: current.policy!.seller,
																																			tax: { name: current.policy!.taxName, rate: current.policy!.taxRate, currencyCode, includedBaseUnits: amount, excludedBaseUnits: tax.excludedBaseUnits, taxBaseUnits: tax.taxBaseUnits } });
}

export function createBillingPolicyStore(db: DataSource, id: () => string, now: () => number = Date.now) {
	return {
		async get() { const row = await db.manager.findOneBy(MiBillingPolicy, { id: 'server' }); return row ? { revision: row.revision, policy: row.policy } : null; },
		async requirements(context: Pick<PurchaseContext, 'transportPeerIp' | 'headers'>) { return db.transaction(async manager => { const result = await requirements(manager, context, id, now()); return { isRequired: result.isRequired, country: result.country, statement: result.statement }; }); },
		async upsert(input: { revision: number; policy: BillingPolicy }, actorId: string) {
			try { validateTrustedProxyCidrs(input.policy.trustedProxyCidrs); } catch { unavailable(); }
			return db.transaction(async manager => {
				await lock(manager); const row = await manager.findOneBy(MiBillingPolicy, { id: 'server' });
				if ((row?.revision ?? 0) !== input.revision || input.revision >= 2147483647) conflict();
				const active = await manager.findBy(MiBillingResidencyStatement, { isEnabled: true });
				for (const previous of active) if (previous.statement !== input.policy.statementText) await manager.update(MiBillingResidencyStatement, previous.id, { isEnabled: false, retiredAt: new Date(now()) });
				const revision = input.revision + 1;
				await manager.upsert(MiBillingPolicy, { id: 'server', revision, policy: input.policy, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
				await recordCatalogAudit(manager, actorId, id(), 'upsertPurchasePolicy', 'server', row?.policy ?? null, input.policy);
				return { revision, policy: input.policy };
			});
		},
	};
}
