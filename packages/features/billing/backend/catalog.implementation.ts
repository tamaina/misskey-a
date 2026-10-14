/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement, ORPCError } from '@orpc/server';
import { createApiProcedure } from '../../api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../api/backend/transport/middleware.js';
import { catalogAdminContract } from './catalog.contract.js';
import type { createCatalogAdminStore } from './catalog-store.js';
import type { createCatalogRpcReader } from './catalog-rpc.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export function createCatalogAdminRouter<Actor extends ApiActor>(store: ReturnType<typeof createCatalogAdminStore>, rpc: ReturnType<typeof createCatalogRpcReader>, rpcUrl: (chainId: number) => Promise<string | null>) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(catalogAdminContract).$context<ApiContext<Actor>>().router({
		listCatalogPrices: procedure(catalogAdminContract.listCatalogPrices).handler(() => store.listPrices()),
		deleteBillingChain: procedure(catalogAdminContract.deleteBillingChain).use(account).handler(({ input, context }) => store.deleteChain(input.chainId, context.principal.id)),
		listPricingAssets: procedure(catalogAdminContract.listPricingAssets).handler(() => store.listAssets()),
		upsertPricingAsset: procedure(catalogAdminContract.upsertPricingAsset).use(account).handler(({ input, context }) => store.upsertAsset(input, context.principal.id)),
		deletePricingAsset: procedure(catalogAdminContract.deletePricingAsset).use(account).handler(({ input, context }) => store.deleteAsset(input.assetId, context.principal.id)),
		listAssetDeployments: procedure(catalogAdminContract.listAssetDeployments).handler(() => store.listDeployments()),
		upsertAssetDeployment: procedure(catalogAdminContract.upsertAssetDeployment).use(account).handler(async ({ input, context }) => {
			if (input.isEnabled && !await rpcUrl(input.chainId)) throw new ORPCError('BILLING_UNAVAILABLE');
			return store.upsertDeployment(input, context.principal.id);
		}),
		deleteAssetDeployment: procedure(catalogAdminContract.deleteAssetDeployment).use(account).handler(({ input, context }) => store.deleteDeployment(input.deploymentId, context.principal.id)),
		resolveTokenMetadata: procedure(catalogAdminContract.resolveTokenMetadata).handler(({ input }) => rpc.metadata(input.chainId, input.contractAddress)),
		testBillingChainRpc: procedure(catalogAdminContract.testBillingChainRpc).handler(({ input }) => rpc.test(input.chainId)),
		attachPriceDeployment: procedure(catalogAdminContract.attachPriceDeployment).use(account).handler(({ input, context }) => store.attach(input.sourcePriceId, input.deploymentId, input.offerId, context.principal.id)),
		deleteCatalogPrice: procedure(catalogAdminContract.deleteCatalogPrice).use(account).handler(({ input, context }) => store.deletePrice(input.priceId, context.principal.id)),
	});
}
