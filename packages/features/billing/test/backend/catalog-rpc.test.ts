/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { encodeFunctionData, encodeFunctionResult, parseAbi } from 'viem';
import { createCatalogRpcReader } from '../../backend/catalog-rpc.js';
const abi = parseAbi(['function symbol() view returns (string)', 'function name() view returns (string)', 'function decimals() view returns (uint8)']);
const address = `0x${'1'.repeat(40)}`;

function mockReader(failSymbol = false, failDecimals = false) {
	const fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
		const request = JSON.parse(String(init?.body));
		let result = '0x1', error;
		if (request.method === 'eth_call') {
			const name = (['symbol', 'name', 'decimals'] as const).find(name => encodeFunctionData({ abi, functionName: name }) === request.params[0].data);
			if (!name || (failSymbol && name === 'symbol') || (failDecimals && name === 'decimals')) error = { code: -32000, message: 'synthetic private upstream detail' };
			else result = name === 'decimals' ? encodeFunctionResult({ abi, functionName: name, result: 6 }) : encodeFunctionResult({ abi, functionName: name, result: name === 'symbol' ? 'TEST' : 'Synthetic token' });
		}
		return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, ...(error ? { error } : { result }) }), { headers: { 'Content-Type': 'application/json' } });
	});
	return { reader: createCatalogRpcReader(async () => 'https://synthetic.example.test', fetch), fetch };
}

test('read-only metadata resolves required decimals and nullable optional token labels', async () => {
	const { reader, fetch } = mockReader(true);
	expect(await reader.metadata(1, address)).toEqual({ decimals: 6, tokenSymbol: null, tokenName: 'Synthetic token' });
	expect(fetch).toHaveBeenCalledTimes(3);
	for (const call of fetch.mock.calls) expect(JSON.parse(String(call[1]?.body)).method).toBe('eth_call');
});
test('metadata failure is sanitized and wrong RPC chain is rejected', async () => {
	await expect(mockReader(false, true).reader.metadata(1, address)).rejects.toMatchObject({ code: 'BILLING_UNAVAILABLE' });
	const { reader } = mockReader();
	expect(await reader.test(1)).toEqual({ chainId: 1, ok: true });
	await expect(reader.test(2)).rejects.toMatchObject({ code: 'BILLING_UNAVAILABLE' });
});
