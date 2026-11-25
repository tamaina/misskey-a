/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createPublicClient, http, parseAbi } from 'viem';
import { ORPCError } from '@orpc/server';
const abi = parseAbi(['function symbol() view returns (string)', 'function name() view returns (string)', 'function decimals() view returns (uint8)']);
export function createCatalogRpcReader(rpcUrl: (chainId: number) => Promise<string | null>, fetch: typeof globalThis.fetch) {
	async function client(chainId: number) {
		const url = await rpcUrl(chainId);
		if (!url) throw new ORPCError('BILLING_UNAVAILABLE');
		return createPublicClient({ transport: http(url, { fetchFn: fetch, retryCount: 0, timeout: 10000 }) });
	}

	return {
		async metadata(chainId: number, contractAddress: string) {
			try {
				const reader = await client(chainId), address = contractAddress.toLowerCase() as `0x${string}`;
				const [symbol, name, decimals] = await Promise.allSettled([
					reader.readContract({ address, abi, functionName: 'symbol' }), reader.readContract({ address, abi, functionName: 'name' }), reader.readContract({ address, abi, functionName: 'decimals' }),
				]);
				if (decimals.status !== 'fulfilled' || !Number.isInteger(decimals.value) || decimals.value < 0 || decimals.value > 255) throw new Error('Invalid metadata');
				return { tokenSymbol: symbol.status === 'fulfilled' && symbol.value.length > 0 && symbol.value.length <= 32 ? symbol.value : null, tokenName: name.status === 'fulfilled' && name.value.length > 0 && name.value.length <= 128 ? name.value : null, decimals: decimals.value };
			} catch { throw new ORPCError('BILLING_UNAVAILABLE'); }
		},
		async test(chainId: number) {
			try { if (await (await client(chainId)).getChainId() !== chainId) throw new Error('Wrong chain'); return { chainId, ok: true as const }; } catch { throw new ORPCError('BILLING_UNAVAILABLE'); }
		},
	};
}
