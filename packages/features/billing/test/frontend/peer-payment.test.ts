/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { parsePeerAmount, sendPeerTransfer } from '../../frontend/peer-client.js';
import { peerTransfer, preparePeerTransfer } from '../../backend/peer.contract.js';
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = `0x${'a'.repeat(64)}`;
const intent = { id: 'intent', token: { id: 'token', name: 'Synthetic', chainId: 123456, contractAddress: address(3), tokenSymbol: 'TEST', decimals: 6, confirmationsRequired: 3, isEnabled: true },
	fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7', senderUserId: 'alice', recipientUserId: 'bob', createdAt: 1000, expiresAt: Number.MAX_SAFE_INTEGER, status: 'pending' as const, txHash: null, logIndex: null, confirmedAt: null, data: '0xa9059cbb' + address(2).slice(2).padStart(64, '0') + '7'.padStart(64, '0') };

test('decimal input preserves precision and rejects rounding, zero and uint256 overflow', () => {
	expect(parsePeerAmount('123456789012345678901.234567', 6)).toBe('123456789012345678901234567');
	expect(parsePeerAmount('0.000007', 6)).toBe('7');
	for (const [amount, decimals] of [['0', 6], ['0.1', 0], ['1.0000001', 6], ['1e3', 6], [(2n ** 256n).toString(), 0]] as const) expect(() => parsePeerAmount(amount, decimals)).toThrow();
});
test('strict peer DTOs reject arbitrary memo, extra principal and overflow', () => {
	expect(v.safeParse(peerTransfer, intent).success).toBe(true);
	for (const amountBaseUnits of ['invalid', '1.5', '1e2']) expect(v.safeParse(peerTransfer, { ...intent, amountBaseUnits }).success).toBe(false);
	expect(v.safeParse(peerTransfer, { ...intent, memo: 'unproven note' }).success).toBe(false);
	const input = { requestKey: 'key', walletId: 'wallet', recipientUserId: 'bob', recipientAddress: address(2), tokenId: 'token', amountBaseUnits: '7' };
	expect(v.safeParse(preparePeerTransfer, { ...input, senderUserId: 'someone' }).success).toBe(false);
	expect(v.safeParse(preparePeerTransfer, { ...input, amountBaseUnits: (2n ** 256n).toString() }).success).toBe(false);
});
test('explicit send invokes only the selected browser wallet with the unsigned exact transfer', async () => {
	const request = vi.fn(async (input:{ method: string }) => input.method === 'eth_chainId' ? '0x1e240' : input.method === 'eth_requestAccounts' ? [address(1)] : hash);
	expect(request).not.toHaveBeenCalled();
	expect(await sendPeerTransfer({ request }, intent)).toBe(hash);
	expect(request).toHaveBeenLastCalledWith({ method: 'eth_sendTransaction', params: [{ from: address(1), to: address(3), data: intent.data, value: '0x0', chainId: '0x1e240' }] });
});
test('wrong chain, wrong payer, expired or already-submitted intent never sends', async () => {
	for (const [chain, accounts, changed] of [['0x1', [address(1)], intent], ['0x1e240', [address(9)], intent], ['0x1e240', [address(1)], { ...intent, expiresAt: 0 }], ['0x1e240', [address(1)], { ...intent, txHash: hash }]] as const) {
		const request = vi.fn(async(input:{ method: string }) => input.method === 'eth_chainId' ? chain : accounts);
		await expect(sendPeerTransfer({ request }, changed)).rejects.toThrow();
		expect(request.mock.calls.some(([input]) => input.method === 'eth_sendTransaction')).toBe(false);
	}
});

test('calldata cannot spoof the reviewed recipient/amount or append an unproven memo', async () => {
	const request = vi.fn(async() => '0x1e240');
	for (const data of [intent.data + 'abcd', '0xa9059cbb' + address(9).slice(2).padStart(64, '0') + '7'.padStart(64, '0')]) await expect(sendPeerTransfer({ request }, { ...intent, data })).rejects.toThrow();
	expect(request).not.toHaveBeenCalled();
});
