/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { Response as NativeResponse } from 'node-fetch';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import { receiptEvidenceSchema } from '../../backend/transfer.schema.js';
import { createTransferReceiptReader } from '../../backend/transfer-confirmation.js';

const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}` as `0x${string}`;
const hash = `0x${'a'.repeat(64)}`;
const blockHash = `0x${'b'.repeat(64)}`;
const event = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
const log = { address: address(3), blockHash, blockNumber: '0xa', transactionHash: hash, transactionIndex: '0x0', logIndex: '0x2', removed: false,
														topics: encodeEventTopics({ abi: [event], eventName: 'Transfer', args: { from: address(1), to: address(2) } }), data: encodeAbiParameters([{ type: 'uint256' }], [7n]) };

function fixture(options: { chain?: number; status?: string; tip?: number; canonical?: string; logs?: unknown[]; missing?: boolean; fail?: boolean } = {}) {
	const send = vi.fn(async (_url: string, input: { body?: string }) => {
		if (options.fail) throw new Error('https://synthetic-secret@rpc.example.test');
		const request = JSON.parse(input.body ?? '{}');
		const results: Record<string, unknown> = {
			eth_chainId: `0x${(options.chain ?? 123456).toString(16)}`,
			eth_getTransactionReceipt: options.missing ? null : { transactionHash: hash, blockHash, blockNumber: '0xa', transactionIndex: '0x0', from: address(1), to: address(3), contractAddress: null,
																																																									status: options.status ?? '0x1', type: '0x2', logs: options.logs ?? [log], gasUsed: '0x5208', cumulativeGasUsed: '0x5208', effectiveGasPrice: '0x1', logsBloom: `0x${'0'.repeat(512)}` },
			eth_blockNumber: `0x${(options.tip ?? 12).toString(16)}`,
			eth_getBlockByNumber: { hash: options.canonical ?? blockHash, number: '0xa', timestamp: '0x3e8', transactions: [], gasUsed: '0x1', gasLimit: '0x1', size: '0x1', difficulty: '0x0', totalDifficulty: '0x0' },
		};
		return new NativeResponse(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: results[request.method] }), { status: 200 });
	});
	return { send, read: createTransferReceiptReader({ send }, async () => 'https://rpc.example.test') };
}

test('actual viem receipt decoding and confirmation through bounded native transport', async () => {
	const { read, send } = fixture();
	const result = await read(123456, hash, 3);
	expect(result).toEqual({ status: 'confirmed', evidence: { chainId: 123456, txHash: hash, timestamp: 1000000, blockHash, blockNumber: '10',
																																																											transfers: [{ logIndex: 2, contractAddress: address(3), fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' }] } });
	expect(send).toHaveBeenCalledTimes(4);
	expect(send.mock.calls[0][1]).toMatchObject({ timeout: 10000, size: 262144, follow: 0, redirect: 'error' });
});

test('RPC chain mismatch is retryable; only confirmed canonical revert is invalid', async () => {
	expect(await fixture({ chain: 9 }).read(123456, hash, 1)).toEqual({ status: 'pending' });
	expect(await fixture({ status: '0x0' }).read(123456, hash, 1)).toEqual({ status: 'invalid' });
});

test('missing receipt, insufficient confirmations, replaced block or RPC failure remain pending', async () => {
	for (const options of [{ missing: true }, { tip: 10 }, { canonical: hash }, { fail: true }]) expect(await fixture(options).read(123456, hash, 3)).toEqual({ status: 'pending' });
});

test('removed or malformed logs cannot become transfer evidence', async () => {
	const result = await fixture({ logs: [{ ...log, removed: true }, { ...log, topics: [] }, { ...log, blockHash: hash }] }).read(123456, hash, 1);
	expect(result).toMatchObject({ status: 'confirmed', evidence: { transfers: [] } });
});

test('same requested hash recovers after RPC chain configuration is corrected', async () => {
	const options = { chain: 9 }; const { read } = fixture(options);
	expect(await read(123456, hash, 3)).toEqual({ status: 'pending' });
	options.chain = 123456;
	expect(await read(123456, hash, 3)).toMatchObject({ status: 'confirmed', evidence: { txHash: hash } });
});

test('unconfirmed reverted receipt can become a confirmed canonical success', async () => {
	const options = { status: '0x0', tip: 10 }; const { read } = fixture(options);
	expect(await read(123456, hash, 3)).toEqual({ status: 'pending' });
	options.status = '0x1'; options.tip = 12;
	expect(await read(123456, hash, 3)).toMatchObject({ status: 'confirmed', evidence: { txHash: hash } });
});

test('orphaned revert is retryable even with sufficient depth; canonical success recovers', async () => {
	const options = { status: '0x0', canonical: hash }; const { read } = fixture(options);
	expect(await read(123456, hash, 3)).toEqual({ status: 'pending' });
	options.status = '0x1'; options.canonical = blockHash;
	expect(await read(123456, hash, 3)).toMatchObject({ status: 'confirmed', evidence: { txHash: hash } });
});

test('malformed requests never initiate RPC or acquire a claim', async () => {
	const { read, send } = fixture();
	for (const [chain, tx, confirmations] of [[0, hash, 1], [123456, 'arbitrary', 1], [123456, hash, 0], [123456, hash, 1.5]] as const) {
		expect(await read(chain, tx, confirmations)).toEqual({ status: 'pending' });
	}
	expect(send).not.toHaveBeenCalled();
});

test('evidence contract excludes extra fields and noncanonical/overflow amounts', () => {
	const evidence = { chainId: 123456, txHash: hash, timestamp: 1000000, transfers: [{ logIndex: 2, contractAddress: address(3), fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' }] };
	expect(v.safeParse(receiptEvidenceSchema, evidence).success).toBe(true);
	expect(v.safeParse(receiptEvidenceSchema, { ...evidence, balance: '7' }).success).toBe(false);
	for (const amountBaseUnits of ['0', '01', '-1', 'invalid', '1.5', '1e2', (2n ** 256n).toString()]) expect(v.safeParse(receiptEvidenceSchema, { ...evidence, transfers: [{ ...evidence.transfers[0], amountBaseUnits }] }).success).toBe(false);
});
