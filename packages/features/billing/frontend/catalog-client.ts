/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { ContractRouterClient } from '@orpc/contract';
import type { catalogAdminContract } from '../backend/catalog.contract.js';
export type CatalogAdminClient = ContractRouterClient<typeof catalogAdminContract>;
export const nativeCatalogClient: CatalogAdminClient = {
	listPricingAssets: input => misskeyApi('admin/billing/assets/list', input),
	upsertPricingAsset: input => misskeyApi('admin/billing/assets/upsert', input),
	deletePricingAsset: input => misskeyApi('admin/billing/assets/delete', input),
	listAssetDeployments: input => misskeyApi('admin/billing/deployments/list', input),
	upsertAssetDeployment: input => misskeyApi('admin/billing/deployments/upsert', input),
	deleteAssetDeployment: input => misskeyApi('admin/billing/deployments/delete', input),
	resolveTokenMetadata: input => misskeyApi('admin/billing/deployments/resolve', input),
	testBillingChainRpc: input => misskeyApi('admin/billing/chains/test-rpc', input),
	deleteBillingChain: input => misskeyApi('admin/billing/chains/delete', input),
	listCatalogPrices: input => misskeyApi('admin/billing/prices/list', input),
	attachPriceDeployment: input => misskeyApi('admin/billing/prices/attach-deployment', input),
	deleteCatalogPrice: input => misskeyApi('admin/billing/prices/delete', input),
};
