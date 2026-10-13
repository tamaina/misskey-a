/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ContractRouterClient } from '@orpc/contract';
import * as v from 'valibot';
import { peerTransfer } from '../backend/peer.contract.js';
import type { peerPaymentContract, PeerTransfer } from '../backend/peer.contract.js';
import type { WalletProvider } from './wallet-client.js';
export type PeerPaymentClient = ContractRouterClient<typeof peerPaymentContract>;
export function parsePeerAmount(value: string, decimals: number): string {
	if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || value.length > 340 || !/^[0-9]+(?:\.[0-9]+)?$/.test(value)) throw new Error('Invalid amount');
	const [whole, fraction = ''] = value.split('.');
	if (fraction.length > decimals) throw new Error('Amount precision');
	const units = BigInt(whole + fraction.padEnd(decimals, '0'));
	if (units <= 0n || units >= 2n ** 256n) throw new Error('Amount range');
	return units.toString();
}
/** Called only by the explicit native send button; the browser wallet owns approval/signing. */
export async function sendPeerTransfer(provider: WalletProvider, intent: PeerTransfer): Promise<string> {
	intent = v.parse(peerTransfer, intent);
	const expectedData = '0xa9059cbb' + intent.toAddress.toLowerCase().slice(2).padStart(64, '0') + BigInt(intent.amountBaseUnits).toString(16).padStart(64, '0');
	if (intent.data !== expectedData) throw new Error('Transfer data mismatch');
	if (intent.status !== 'pending' || intent.txHash || Date.now() >= intent.expiresAt) throw new Error('Intent unavailable');
	const chain = await provider.request({ method: 'eth_chainId' });
	if (typeof chain !== 'string' || !/^0x[0-9a-f]+$/i.test(chain) || BigInt(chain) !== BigInt(intent.token.chainId)) throw new Error('Wrong wallet chain');
	const accounts = await provider.request({ method: 'eth_requestAccounts' });
	if (!Array.isArray(accounts) || !accounts.some(value => typeof value === 'string' && value.toLowerCase() === intent.fromAddress)) throw new Error('Wrong payer');
	if (Date.now() >= intent.expiresAt) throw new Error('Intent expired during connection');
	const result = await provider.request({ method: 'eth_sendTransaction', params: [{ from: intent.fromAddress, to: intent.token.contractAddress, data: intent.data, value: '0x0', chainId: `0x${intent.token.chainId.toString(16)}` }] });
	if (typeof result !== 'string' || !/^0x[0-9a-f]{64}$/i.test(result)) throw new Error('Invalid transaction hash');
	return result.toLowerCase();
}
