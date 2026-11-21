/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { addServiceDuration, matchesOrder } from '../../backend/service-receipt.js';
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = `0x${'a'.repeat(64)}`, blockHash = `0x${'b'.repeat(64)}`;

test('order token/payer/recipient/amount and two-second window are all required', () => {
	const evidence = { chainId: 123456, txHash: hash, timestamp: 1000000, transfers: [{ logIndex: 2, contractAddress: address(3), fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' }] };
	const order = { offer: { chainId: 123456, contractAddress: address(3), recipientAddress: address(2), amountBaseUnits: '7' }, payerAddress: address(1), txHash: hash, createdAt: 1002000, expiresAt: 1005000 };
	expect(matchesOrder(evidence, order)).toBe(true);
	for (const changed of [{ ...order, payerAddress: address(4) }, { ...order, txHash: blockHash }, { ...order, createdAt: 1002001 }, { ...order, expiresAt: 997999 }, { ...order, offer: { ...order.offer, amountBaseUnits: '8' } }, { ...order, offer: { ...order.offer, contractAddress: address(4) } }, { ...order, offer: { ...order.offer, recipientAddress: address(4) } }]) expect(matchesOrder(evidence, changed)).toBe(false);
});

test('UTC calendar durations preserve time and clamp month/year ends', () => {
	const jan = Date.parse('2024-01-31T12:34:56.789Z');
	expect(new Date(addServiceDuration(jan, 1, 'months')).toISOString()).toBe('2024-02-29T12:34:56.789Z');
	expect(new Date(addServiceDuration(Date.parse('2024-02-29T12:34:56Z'), 1, 'years')).toISOString()).toBe('2025-02-28T12:34:56.000Z');
	expect(addServiceDuration(jan, 2, 'days')).toBe(jan + 172800000);
});
