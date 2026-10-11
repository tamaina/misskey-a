/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import * as v from 'valibot';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { linkedWallet, walletChain, walletChainSettings, walletContract } from './api.definition.js';
import { createWalletService } from './wallet-service.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { WalletDependencies, WalletRecord } from './wallet-service.js';

function publicWallet(row: WalletRecord) {
	return v.parse(linkedWallet, {
		id: row.id, chainId: row.chainId, address: row.address,
		label: row.label, createdAt: row.createdAt, updatedAt: row.updatedAt,
	});
}

/** Native account procedures; the host supplies persistence, configuration and reauthentication. */
export function createWalletRouter<Actor extends ApiActor>(deps: WalletDependencies) {
	const service = createWalletService(deps);
	const procedure = createApiProcedure<Actor>();
	return implement(walletContract).$context<ApiContext<Actor>>().router({
		listChainSettings: procedure(walletContract.listChainSettings).handler(async () => {
			if (!deps.chainSettings) throw new Error('Wallet chain administration unavailable');
			return v.parse(v.array(walletChainSettings), await deps.chainSettings.listSettings());
		}),
		upsertChainSettings: procedure(walletContract.upsertChainSettings).use(requirePrincipal<Actor>()).handler(async ({ input, context }) => {
			if (!deps.chainSettings) throw new Error('Wallet chain administration unavailable');
			try {
				return v.parse(walletChainSettings, await deps.chainSettings.upsertSettings(input, context.principal.id));
			} catch {
				// Driver exceptions may contain bound RPC credentials; never forward their detail/cause.
				throw new Error('Wallet chain settings could not be saved');
			}
		}),
		passkeyOptions: procedure(walletContract.passkeyOptions).use(requirePrincipal<Actor>()).handler(({ context }) => {
			if (!deps.passkeyOptions) throw new Error('Passkey authentication unavailable');
			return deps.passkeyOptions(context.principal.id);
		}),
		list: procedure(walletContract.list).use(requirePrincipal<Actor>()).handler(async ({ context }) => {
			const rows = await deps.store.list(context.principal.id);
			if (rows.some(row => row.userId !== context.principal.id)) throw new Error('Invalid wallet storage owner');
			return rows.map(publicWallet);
		}),
		chains: procedure(walletContract.chains).handler(async () => v.parse(v.array(walletChain), await deps.chains())),
		begin: procedure(walletContract.begin).use(requirePrincipal<Actor>()).handler(({ input, context }) => service.begin(context.principal.id, input, context.credential)),
		verify: procedure(walletContract.verify).use(requirePrincipal<Actor>()).handler(async ({ input, context }) => publicWallet(await service.verify(context.principal.id, input))),
		unlink: procedure(walletContract.unlink).use(requirePrincipal<Actor>()).handler(({ input, context }) => service.unlink(context.principal.id, input.walletId)),
	});
}
