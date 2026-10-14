/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { serviceOffer } from './api.definition.js';
import { pricingAsset, assetDeployment, tokenMetadata } from './catalog.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(32));
const chainId = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER));
const address = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{40}$/));
const procedure = oc.errors({ ...commonErrors, BILLING_NOT_FOUND: { status: 404, data: apiErrorData }, BILLING_CONFLICT: { status: 409, data: apiErrorData }, BILLING_UNAVAILABLE: { status: 400, data: apiErrorData } });

function admin<const Name extends string>(name: Name, write = false) {
	return procedure.$meta({ requestName: name, requireCredential: true, requireAdmin: true, kind: write ? 'write:admin:meta' : 'read:admin:meta', ...(write ? { limit: { duration: 60000, max: 10 } } : {}) } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: `/${name}` });
}

export const catalogAdminContract = {
	listCatalogPrices: admin('admin/billing/prices/list').input(v.strictObject({})).output(v.array(v.strictObject({ priceId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)), offer: serviceOffer }))),
	deleteBillingChain: admin('admin/billing/chains/delete', true).input(v.strictObject({ chainId })).output(v.strictObject({ ok: v.literal(true) })),
	listPricingAssets: admin('admin/billing/assets/list').input(v.strictObject({})).output(v.array(pricingAsset)),
	upsertPricingAsset: admin('admin/billing/assets/upsert', true).input(pricingAsset).output(pricingAsset),
	deletePricingAsset: admin('admin/billing/assets/delete', true).input(v.strictObject({ assetId: id })).output(v.strictObject({ ok: v.literal(true) })),
	listAssetDeployments: admin('admin/billing/deployments/list').input(v.strictObject({})).output(v.array(assetDeployment)),
	upsertAssetDeployment: admin('admin/billing/deployments/upsert', true).input(assetDeployment).output(assetDeployment),
	deleteAssetDeployment: admin('admin/billing/deployments/delete', true).input(v.strictObject({ deploymentId: id })).output(v.strictObject({ ok: v.literal(true) })),
	resolveTokenMetadata: admin('admin/billing/deployments/resolve').input(v.strictObject({ chainId, contractAddress: address })).output(tokenMetadata),
	testBillingChainRpc: admin('admin/billing/chains/test-rpc').input(v.strictObject({ chainId })).output(v.strictObject({ chainId, ok: v.literal(true) })),
	attachPriceDeployment: admin('admin/billing/prices/attach-deployment', true).input(v.strictObject({ sourcePriceId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)), deploymentId: id, offerId: id })).output(v.strictObject({ ok: v.literal(true) })),
	deleteCatalogPrice: admin('admin/billing/prices/delete', true).input(v.strictObject({ priceId: v.pipe(v.string(), v.minLength(1), v.maxLength(128)) })).output(v.strictObject({ ok: v.literal(true) })),
};
