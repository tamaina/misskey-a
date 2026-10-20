/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomUUID } from 'node:crypto';
import { ORPCError } from '@orpc/server';
import { recordCatalogAudit } from './catalog-audit.js';
import { MiBillingPricingAsset } from './models/BillingPricingAsset.js';
import { MiBillingAssetDeployment } from './models/BillingAssetDeployment.js';
import { MiBillingWalletChain } from './models/BillingWalletChain.js';
import { MiBillingServiceOffer } from './models/BillingServiceOffer.js';
import { MiBillingCatalogPrice } from './models/BillingCatalogPrice.js';
import { priceId, validPriceCatalog } from './service-catalog.js';
import type { PricingAsset, AssetDeployment } from './catalog.schema.js';
import type { DataSource, EntityManager } from 'typeorm';
const conflict = () => { throw new ORPCError('BILLING_CONFLICT'); };
const missing = () => { throw new ORPCError('BILLING_NOT_FOUND'); };

async function lock(manager: EntityManager) { await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-price-catalog\', 0))'); }

export function createCatalogAdminStore(db: DataSource, now: () => number = Date.now, id: () => string = () => randomUUID().replaceAll('-', '')) {
	return {
		async listPrices() { return (await db.manager.find(MiBillingCatalogPrice, { order: { id: 'ASC' }, take: 1000 })).map(row => ({ priceId: row.id, offer: row.terms })); },
		async deleteChain(chainId: number, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager); if (!await manager.existsBy(MiBillingWalletChain, { chainId })) missing();
				const ids = new Set((await manager.findBy(MiBillingAssetDeployment, { chainId })).map(row => row.id));
				for (const row of await manager.find(MiBillingServiceOffer)) if (row.terms.deploymentId && ids.has(row.terms.deploymentId)) await manager.delete(MiBillingServiceOffer, row.id);
				await recordCatalogAudit(manager, actorId, id(), 'deleteChain', String(chainId), { chainId }, null);
				await manager.delete(MiBillingWalletChain, { chainId }); return { ok: true as const };
			});
		},
		async listAssets() { return (await db.getRepository(MiBillingPricingAsset).find({ order: { id: 'ASC' }, take: 1000 })).map(row => row.data); },
		async listDeployments() { return (await db.getRepository(MiBillingAssetDeployment).find({ order: { id: 'ASC' }, take: 1000 })).map(row => row.data); },
		async upsertAsset(data: PricingAsset, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager);
				const existing = await manager.findOneBy(MiBillingPricingAsset, { id: data.id });
				if (!existing && await manager.count(MiBillingPricingAsset) >= 1000) conflict();
				const duplicate = await manager.findOneBy(MiBillingPricingAsset, { pricingAssetKey: data.pricingAssetKey });
				if (duplicate && duplicate.id !== data.id) conflict();
				if (existing && existing.pricingAssetKey !== data.pricingAssetKey && (await manager.existsBy(MiBillingAssetDeployment, { assetId: data.id })
					|| (await manager.find(MiBillingCatalogPrice)).some(row => row.terms.pricingAssetKey === existing.pricingAssetKey))) conflict();
				await manager.upsert(MiBillingPricingAsset, { id: data.id, pricingAssetKey: data.pricingAssetKey, data, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
				await recordCatalogAudit(manager, actorId, id(), 'upsertAsset', data.id, existing?.data ?? null, data);
				return data;
			});
		},
		async upsertDeployment(input: AssetDeployment, actorId: string) {
			const data = { ...input, contractAddress: input.contractAddress.toLowerCase(), recipientAddress: input.recipientAddress.toLowerCase() };
			return db.transaction(async manager => {
				await lock(manager);
				const asset = await manager.findOneBy(MiBillingPricingAsset, { id: data.assetId });
				if (!asset) missing();
				if (!await manager.existsBy(MiBillingWalletChain, { chainId: data.chainId })) missing();
				const others = await manager.find(MiBillingAssetDeployment);
				if (!others.some(row => row.id === data.id) && others.length >= 1000) conflict();
				if (others.some(row => row.id !== data.id && row.chainId === data.chainId && row.contractAddress === data.contractAddress)) conflict();
				// No automatic exchange/decimal conversion; one pricing unit must remain exact.
				if (others.some(row => row.id !== data.id && row.assetId === data.assetId && row.data.decimals !== data.decimals)) conflict();
				const linked = (await manager.find(MiBillingServiceOffer)).filter(row => row.terms.deploymentId === data.id);
				if (linked.some(row => row.terms.decimals !== data.decimals || row.terms.pricingAssetKey !== asset!.pricingAssetKey)) conflict();
				await manager.upsert(MiBillingAssetDeployment, { id: data.id, assetId: data.assetId, chainId: data.chainId, contractAddress: data.contractAddress, data, updatedAt: new Date(now()), updatedByUserId: actorId }, ['id']);
				for (const row of linked) await manager.update(MiBillingServiceOffer, row.id, { terms: { ...row.terms, chainId: data.chainId, contractAddress: data.contractAddress, recipientAddress: data.recipientAddress, tokenSymbol: data.tokenSymbol }, updatedAt: new Date(now()), updatedByUserId: actorId });
				await recordCatalogAudit(manager, actorId, id(), 'upsertDeployment', data.id, others.find(row => row.id === data.id)?.data ?? null, data);
				return data;
			});
		},
		async deleteDeployment(deploymentId: string, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager); if (!await manager.existsBy(MiBillingAssetDeployment, { id: deploymentId })) missing();
				for (const row of await manager.find(MiBillingServiceOffer)) if (row.terms.deploymentId === deploymentId) await manager.delete(MiBillingServiceOffer, row.id);
				await recordCatalogAudit(manager, actorId, id(), 'deleteDeployment', deploymentId, (await manager.findOneByOrFail(MiBillingAssetDeployment, { id: deploymentId })).data, null);
				await manager.delete(MiBillingAssetDeployment, deploymentId); return { ok: true as const };
			});
		},
		async deleteAsset(assetId: string, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager); if (!await manager.existsBy(MiBillingPricingAsset, { id: assetId })) missing();
				const ids = new Set((await manager.findBy(MiBillingAssetDeployment, { assetId })).map(row => row.id));
				for (const row of await manager.find(MiBillingServiceOffer)) if (row.terms.deploymentId && ids.has(row.terms.deploymentId)) await manager.delete(MiBillingServiceOffer, row.id);
				const asset = await manager.findOneByOrFail(MiBillingPricingAsset, { id: assetId });
				for (const row of await manager.find(MiBillingCatalogPrice)) if (row.terms.pricingAssetKey === asset.pricingAssetKey) await manager.delete(MiBillingCatalogPrice, row.id);
				await recordCatalogAudit(manager, actorId, id(), 'deleteAsset', assetId, asset.data, null);
				await manager.delete(MiBillingPricingAsset, assetId); return { ok: true as const };
			});
		},
		async attach(sourcePriceId: string, deploymentId: string, offerId: string, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager);
				const source = await manager.findOneBy(MiBillingCatalogPrice, { id: sourcePriceId });
				const deployment = await manager.findOneBy(MiBillingAssetDeployment, { id: deploymentId });
				if (!source || !deployment) missing();
				const asset = await manager.findOneByOrFail(MiBillingPricingAsset, { id: deployment!.assetId });
				if (source!.terms.pricingAssetKey !== asset.pricingAssetKey || source!.terms.decimals !== deployment!.data.decimals || source!.terms.priceStartsAt == null) conflict();
				const terms = { ...source!.terms, id: offerId, catalogPriceId: source!.terms.catalogPriceId ?? source!.id, deploymentId, chainId: deployment!.chainId, contractAddress: deployment!.data.contractAddress, recipientAddress: deployment!.data.recipientAddress, tokenSymbol: deployment!.data.tokenSymbol };
				const rows = await manager.find(MiBillingServiceOffer);
				if (rows.some(row => row.id === offerId) || rows.length >= 1000) conflict();
				if (!validPriceCatalog(terms, [...rows, ...await manager.find(MiBillingCatalogPrice)].map(row => row.terms))) conflict();
				await manager.insert(MiBillingServiceOffer, { id: offerId, terms, updatedAt: new Date(now()), updatedByUserId: actorId });
				await recordCatalogAudit(manager, actorId, id(), 'attachDeployment', offerId, null, terms); return { ok: true as const };
			});
		},
		async deletePrice(catalogPriceId: string, actorId: string) {
			return db.transaction(async manager => {
				await lock(manager); const row = await manager.findOneBy(MiBillingCatalogPrice, { id: catalogPriceId }); if (!row) missing();
				for (const item of await manager.find(MiBillingServiceOffer)) if (priceId(item.terms) === priceId(row!.terms)) await manager.delete(MiBillingServiceOffer, item.id);
				await manager.delete(MiBillingCatalogPrice, priceId(row!.terms));
				await recordCatalogAudit(manager, actorId, id(), 'deletePrice', catalogPriceId, row!.terms, null);
				// Paid/pending orders and funded terms own immutable snapshots, and are retained.
				return { ok: true as const };
			});
		},
	};
}
