/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { LessThan } from 'typeorm';
import { ORPCError } from '@orpc/server';
import { MiBillingServiceOrder } from './models/BillingServiceOrder.js';
import type { BillingSalesSummary, SalesBucket } from './reports.contract.js';
import type { DataSource, EntityManager } from 'typeorm';
const unit = {
	assetKey: 'CASE WHEN o.offer->>\'pricingAssetKey\' IS NOT NULL THEN concat(\'asset:\', o.offer->>\'pricingAssetKey\') ELSE concat(\'rail:chain:\', o."chainId", \':token:\', lower(o.offer->>\'contractAddress\')) END',
	currencyCode: 'coalesce(o."receiptSnapshot"->\'tax\'->>\'currencyCode\', o.offer->>\'currencyCode\')', decimals: '(o.offer->>\'decimals\')::integer',
};

/** Group financial units before summing; no implicit cross-asset/currency conversion. */
async function buckets(manager: EntityManager, from: number, to: number, dimensions: Record<string, string>): Promise<SalesBucket[]> {
	const grouping = { ...unit, ...dimensions };
	const qb = manager.getRepository(MiBillingServiceOrder).createQueryBuilder('o').select([]).where('o.status = :paid AND o."paidAt" >= :from AND o."paidAt" < :to', { paid: 'paid', from, to });
	for (const [name, expression] of Object.entries(grouping)) { qb.addSelect(expression, name); qb.addGroupBy(expression); qb.addOrderBy(expression, 'ASC', 'NULLS LAST'); }
	qb.addSelect('count(*)', 'count').addSelect('count(*) FILTER (WHERE o."receiptSnapshot" IS NULL)', 'unknownTaxCount');
	qb.addSelect('sum(coalesce(o."cashAmountBaseUnits", o.offer->>\'amountBaseUnits\')::numeric)::text', 'grossBaseUnits');
	qb.addSelect('CASE WHEN count(*) FILTER (WHERE o."receiptSnapshot" IS NULL) > 0 THEN NULL ELSE sum((o."receiptSnapshot"->\'tax\'->>\'excludedBaseUnits\')::numeric)::text END', 'netBaseUnits');
	qb.addSelect('CASE WHEN count(*) FILTER (WHERE o."receiptSnapshot" IS NULL) > 0 THEN NULL ELSE sum((o."receiptSnapshot"->\'tax\'->>\'taxBaseUnits\')::numeric)::text END', 'taxBaseUnits');
	const rows = await qb.getRawMany<Record<string, string | null>>();
	return rows.map(row => ({ ...row, count: Number(row.count), unknownTaxCount: Number(row.unknownTaxCount), decimals: Number(row.decimals) } as SalesBucket));
}

export function createBillingReportsStore(db: DataSource) {
	return {
		async list(input: { userId?: string; cursor?: string; limit: number }) {
			const rows = await db.getRepository(MiBillingServiceOrder).find({ where: { ...(input.userId ? { userId: input.userId } : {}), ...(input.cursor ? { id: LessThan(input.cursor) } : {}) }, order: { id: 'DESC' }, take: input.limit + 1 });
			return { items: rows.slice(0, input.limit), nextCursor: rows.length > input.limit ? rows[input.limit - 1].id : null };
		},
		async find(orderId: string) { const row = await db.manager.findOneBy(MiBillingServiceOrder, { id: orderId }); if (!row) throw new ORPCError('BILLING_NOT_FOUND'); return row; },
		async summary(from: number, to: number): Promise<BillingSalesSummary> {
			if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || from >= to) throw new ORPCError('BILLING_CONFLICT');
			return db.transaction('REPEATABLE READ', async manager => {
				const byCurrency = await buckets(manager, from, to, {});
				const byTax = await buckets(manager, from, to, { taxName: 'o."receiptSnapshot"->\'tax\'->>\'name\'', taxRate: 'o."receiptSnapshot"->\'tax\'->>\'rate\'' });
				const byPlan = await buckets(manager, from, to, { serviceKey: 'o.offer->>\'serviceKey\'', planName: 'o.offer->>\'name\'' });
				const byAsset = await buckets(manager, from, to, { tokenSymbol: 'o.offer->>\'tokenSymbol\'' });
				return { from, to, count: byCurrency.reduce((sum, bucket) => sum + bucket.count, 0), unknownTaxCount: byCurrency.reduce((sum, bucket) => sum + bucket.unknownTaxCount, 0), byCurrency, byTax, byPlan, byAsset };
			});
		},
	};
}
export type BillingReportsStore = ReturnType<typeof createBillingReportsStore>;
