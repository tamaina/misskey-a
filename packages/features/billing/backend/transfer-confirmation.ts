/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicClient, decodeEventLog, http, parseAbiItem, TransactionReceiptNotFoundError } from 'viem';
import * as v from 'valibot';
import { createWalletRpcFetch, WALLET_RPC_TIMEOUT } from './wallet-rpc.js';
import { receiptEvidenceSchema, receiptRequestSchema } from './transfer.schema.js';
import type { TransferEvidence, ReceiptEvidence } from './transfer.schema.js';
export type { TransferEvidence, ReceiptEvidence } from './transfer.schema.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { Hex } from 'viem';

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
export type ReceiptResult = { status: 'pending' } | { status: 'invalid' } | { status: 'confirmed'; evidence: ReceiptEvidence };
export type ReceiptReader = (chainId: number, txHash: string, confirmations: number) => Promise<ReceiptResult>;

/** Read only, using the existing native proxy/private-address and bounded RPC policy. */
export function createTransferReceiptReader(native: Pick<HttpRequestService, 'send'>, rpcUrl: (chainId: number) => Promise<string | null>): ReceiptReader {
	return async (chainId, txHash, confirmations) => {
		if (!v.safeParse(receiptRequestSchema, { chainId, txHash, confirmations }).success) return { status: 'pending' };
		const url = await rpcUrl(chainId);
		if (!url) return { status: 'pending' };
		const client = createPublicClient({ transport: http(url, { fetchFn: createWalletRpcFetch(native), retryCount: 0, timeout: WALLET_RPC_TIMEOUT }) });
		try {
			if (await client.getChainId() !== chainId) return { status: 'pending' };
			const receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
			if (receipt.transactionHash.toLowerCase() !== txHash) return { status: 'pending' };
			const tip = await client.getBlockNumber({ cacheTime: 0 });
			if (tip < receipt.blockNumber || tip - receipt.blockNumber + 1n < BigInt(confirmations)) return { status: 'pending' };
			const block = await client.getBlock({ blockNumber: receipt.blockNumber });
			// Reject a receipt from a replaced block; no permanent-finality claim is made.
			if (block.hash !== receipt.blockHash) return { status: 'pending' };
			// Only a confirmed canonical revert can fail this order; RPC/chain uncertainty is retryable.
			if (receipt.status !== 'success') return { status: 'invalid' };
			const timestamp = Number(block.timestamp) * 1000;
			if (!Number.isSafeInteger(timestamp) || timestamp < 0) return { status: 'invalid' };
			const transfers: TransferEvidence[] = [];
			for (const log of receipt.logs) {
				if (log.removed || log.blockHash !== receipt.blockHash || log.transactionHash !== receipt.transactionHash || log.logIndex === null) continue;
				try {
					const decoded = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics, strict: true });
					if (decoded.args.value === 0n) continue;
					transfers.push({ logIndex: log.logIndex, contractAddress: log.address.toLowerCase(), fromAddress: decoded.args.from.toLowerCase(), toAddress: decoded.args.to.toLowerCase(), amountBaseUnits: decoded.args.value.toString() });
				} catch { /* Unrelated or malformed event. */ }
			}
			return { status: 'confirmed', evidence: v.parse(receiptEvidenceSchema, { chainId, txHash, timestamp, transfers, blockHash: receipt.blockHash.toLowerCase(), blockNumber: receipt.blockNumber.toString() }) };
		} catch (error) {
			if (error instanceof TransactionReceiptNotFoundError) return { status: 'pending' };
			// Upstream details may contain private RPC URLs; never log or expose them.
			return { status: 'pending' };
		}
	};
}
