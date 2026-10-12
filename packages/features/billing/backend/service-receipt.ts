/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicClient, decodeEventLog, http, parseAbiItem, TransactionReceiptNotFoundError } from 'viem';
import { createWalletRpcFetch, WALLET_RPC_TIMEOUT } from './wallet-rpc.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { Hex } from 'viem';

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
export interface TransferEvidence { logIndex: number; contractAddress: string; fromAddress: string; toAddress: string; amountBaseUnits: string }
export interface ReceiptEvidence { chainId: number; txHash: string; timestamp: number; transfers: TransferEvidence[] }
export type ReceiptResult = { status: 'pending' } | { status: 'invalid' } | { status: 'confirmed'; evidence: ReceiptEvidence };
export type ReceiptReader = (chainId: number, txHash: string, confirmations: number) => Promise<ReceiptResult>;

/** Read only, using the existing native proxy/private-address and bounded RPC policy. */
export function createServiceReceiptReader(native: Pick<HttpRequestService, 'send'>, rpcUrl: (chainId: number) => Promise<string | null>): ReceiptReader {
	return async (chainId, txHash, confirmations) => {
		const url = await rpcUrl(chainId);
		if (!url) return { status: 'pending' };
		const client = createPublicClient({ transport: http(url, { fetchFn: createWalletRpcFetch(native), retryCount: 0, timeout: WALLET_RPC_TIMEOUT }) });
		try {
			if (await client.getChainId() !== chainId) return { status: 'invalid' };
			const receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
			if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== txHash) return { status: 'invalid' };
			const tip = await client.getBlockNumber({ cacheTime: 0 });
			if (tip < receipt.blockNumber || tip - receipt.blockNumber + 1n < BigInt(confirmations)) return { status: 'pending' };
			const block = await client.getBlock({ blockNumber: receipt.blockNumber });
			// Reject a receipt from a replaced block; no permanent-finality claim is made.
			if (block.hash !== receipt.blockHash) return { status: 'pending' };
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
			return { status: 'confirmed', evidence: { chainId, txHash, timestamp, transfers } };
		} catch (error) {
			if (error instanceof TransactionReceiptNotFoundError) return { status: 'pending' };
			// Upstream details may contain private RPC URLs; never log or expose them.
			return { status: 'pending' };
		}
	};
}

/** UTC calendar clamp follows cfw-fileup addPaymentDuration. */
export function addServiceDuration(base: number, value: number, unit: 'days' | 'months' | 'years'): number {
	if (unit === 'days') return base + value * 86400000;
	const date = new Date(base);
	const month = date.getUTCMonth() + value * (unit === 'years' ? 12 : 1);
	const year = date.getUTCFullYear() + Math.floor(month / 12);
	const targetMonth = month % 12;
	return Date.UTC(year, targetMonth, Math.min(date.getUTCDate(), new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate()), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}

export function matchesOrder(evidence: ReceiptEvidence, order: { offer: { chainId: number; contractAddress: string; recipientAddress: string; amountBaseUnits: string }; payerAddress: string; txHash: string | null; createdAt: number; expiresAt: number }): boolean {
	return evidence.chainId === order.offer.chainId && evidence.txHash === order.txHash && evidence.timestamp + 2000 >= order.createdAt && evidence.timestamp - 2000 <= order.expiresAt && evidence.transfers.some(log => log.contractAddress === order.offer.contractAddress && log.fromAddress === order.payerAddress && log.toAddress === order.offer.recipientAddress && BigInt(log.amountBaseUnits) >= BigInt(order.offer.amountBaseUnits));
}
