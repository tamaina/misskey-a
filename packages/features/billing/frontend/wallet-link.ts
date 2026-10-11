/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { WalletChain, LinkedWallet } from '../backend/api.definition.js';
import type { ConnectedWallet, WalletAuthInput, WalletClient, WalletConnector } from './wallet-client.js';

export type WalletStep = 'connect' | 'switch' | 'authenticate' | 'sign' | 'verify';
export class WalletLinkCancelled extends Error { }

/** cfw-fileup's connect -> switch -> begin -> personal_sign -> verify flow.
 * Cancellation stops the next step; it cannot undo an already submitted verify request. */
export async function linkWallet(input: {
	client: WalletClient; connector: WalletConnector; chain: WalletChain;
	auth: WalletAuthInput;
	/** Fresh native authentication happens only after slow wallet selection/switching. */
	authenticate?(): Promise<WalletAuthInput>;
	cancelled(): boolean; progress(step: WalletStep): void; connected(wallet: ConnectedWallet): void;
}): Promise<LinkedWallet> {
	function check(): void { if (input.cancelled()) throw new WalletLinkCancelled(); }

	const provider = input.connector.provider;
	check();
	input.progress('connect');
	const accounts = await provider.request({ method: 'eth_requestAccounts' });
	check();
	if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) throw new Error('Invalid wallet account');
	const address = accounts[0];
	const chain = await provider.request({ method: 'eth_chainId' });
	check();
	if (typeof chain !== 'string' || !/^0x[0-9a-fA-F]+$/.test(chain)) throw new Error('Invalid wallet chain');
	if (Number(BigInt(chain)) !== input.chain.chainId) {
		input.progress('switch');
		// Public RPC metadata / wallet_addEthereumChain needs a reviewed chain catalog adapter.
		// Do not pass server RPC URLs or credentials to the wallet provider.
		await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${input.chain.chainId.toString(16)}` }] });
		check();
		const switched = await provider.request({ method: 'eth_chainId' });
		check();
		if (typeof switched !== 'string' || !/^0x[0-9a-fA-F]+$/.test(switched) || BigInt(switched) !== BigInt(input.chain.chainId)) throw new Error('Wallet chain did not change');
	}
	input.connected({ address, chainId: input.chain.chainId, connectorId: input.connector.id });
	let auth = input.auth;
	if (input.authenticate) {
		input.progress('authenticate');
		auth = await input.authenticate();
		check();
	}
	const challenge = await input.client.begin({ chainId: input.chain.chainId, address, ...auth });
	check();
	input.progress('sign');
	const signature = await provider.request({ method: 'personal_sign', params: [challenge.message, address] });
	check();
	if (typeof signature !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(signature)) throw new Error('Invalid wallet signature');
	input.progress('verify');
	return input.client.verify({ ...challenge, signature });
}
