/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement, ORPCError } from '@orpc/server';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { peerPaymentContract } from './peer.contract.js';
import { publicPeerTransfer } from './peer-store.js';
import type { PeerPaymentStore } from './peer-store.js';
import type { ReceiptReader } from './transfer-confirmation.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
export function createPeerPaymentRouter<Actor extends ApiActor>(deps: { store: PeerPaymentStore; readReceipt: ReceiptReader; rpcUrl(chainId: number): Promise<string | null> }) {
	const procedure = createApiProcedure<Actor>(), account = requirePrincipal<Actor>();
	return implement(peerPaymentContract).$context<ApiContext<Actor>>().router({
		listSettings: procedure(peerPaymentContract.listSettings).handler(() => deps.store.listTokens()),
		saveSettings: procedure(peerPaymentContract.saveSettings).handler(async ({ input }) => {
			if (input.isEnabled && !await deps.rpcUrl(input.chainId)) throw new ORPCError('PEER_UNAVAILABLE');
			return deps.store.saveToken({ ...input, contractAddress: input.contractAddress.toLowerCase() });
		}),
		listTokens: procedure(peerPaymentContract.listTokens).handler(async () => {
			const tokens = [];
			for (const token of await deps.store.listTokens()) if (token.isEnabled && await deps.rpcUrl(token.chainId)) tokens.push(token);
			return tokens;
		}),
		ownPublication: procedure(peerPaymentContract.ownPublication).use(account).handler(({ context }) => deps.store.ownPublication(context.principal.id)),
		publish: procedure(peerPaymentContract.publish).use(account).handler(({ context, input }) => deps.store.publish(context.principal.id, input.walletId, input.isPublic)),
		publicWallets: procedure(peerPaymentContract.publicWallets).handler(({ input }) => deps.store.publicWallets(input.userId)),
		prepare: procedure(peerPaymentContract.prepare).use(account).handler(async ({ context, input }) => {
			const token = (await deps.store.listTokens()).find(row => row.id === input.tokenId);
			if (!token || !await deps.rpcUrl(token.chainId)) throw new ORPCError('PEER_UNAVAILABLE');
			return publicPeerTransfer(await deps.store.prepare(context.principal.id, { ...input, recipientAddress: input.recipientAddress.toLowerCase() }));
		}),
		start: procedure(peerPaymentContract.start).use(account).handler(async ({ context, input }) => publicPeerTransfer(await deps.store.start(context.principal.id, input.intentId))),
		check: procedure(peerPaymentContract.check).use(account).handler(async ({ context, input }) => {
			const row = await deps.store.submit(context.principal.id, input.intentId, input.txHash?.toLowerCase());
			if (row.status !== 'pending' || !row.txHash) return publicPeerTransfer(row);
			const receipt = await deps.readReceipt(row.chainId, row.txHash, row.terms.token.confirmationsRequired);
			return publicPeerTransfer(await deps.store.apply(context.principal.id, row.id, row.txHash, receipt, input.logIndex));
		}),
		list: procedure(peerPaymentContract.list).use(account).handler(async ({ context }) => (await deps.store.list(context.principal.id)).map(publicPeerTransfer)),
	});
}
