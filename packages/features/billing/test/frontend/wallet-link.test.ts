/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test, expect, vi } from 'vitest';
import { linkWallet, WalletLinkCancelled } from '../../frontend/wallet-link.js';
import type { WalletClient } from '../../frontend/wallet-client.js';

const address = '0x0000000000000000000000000000000000000001';
const chain = { chainId: 123456, name: 'Test', nativeCurrencyName: 'Test', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null };
const challenge = { nonce: 'nonce0001', message: 'Synthetic ownership proof; no transfer' };
const wallet = { id: 'wallet1', chainId: chain.chainId, address, label: null, createdAt: 1, updatedAt: 1 };

function fixture() {
	const calls: string[] = [];
	let currentChain = '0x1';
	let cancelled = false;
	const client: WalletClient = {
		list: vi.fn(async () => []), chains: vi.fn(async () => [chain]), unlink: vi.fn(async () => ({ ok: true as const })),
		begin: vi.fn(async () => { calls.push('begin'); return challenge; }),
		verify: vi.fn(async () => { calls.push('verify'); return wallet; }),
	};
	const request = vi.fn(async (input: { method: string; params?: readonly unknown[] }): Promise<unknown> => {
		calls.push(input.method);
		if (input.method === 'eth_requestAccounts') return [address];
		if (input.method === 'eth_chainId') return currentChain;
		if (input.method === 'wallet_switchEthereumChain') { currentChain = '0x1e240'; return null; }
		if (input.method === 'personal_sign') return '0x1234';
		throw new Error('Unexpected request');
	});
	return { client, calls, request, cancel: () => { cancelled = true; }, input: {
		client, connector: { id: 'synthetic', name: 'Synthetic wallet', provider: { request } }, chain,
		auth: { currentPassword: 'synthetic password' }, cancelled: () => cancelled, progress: vi.fn(), connected: vi.fn(),
	} };
}

test('source linking flow signs the exact server message after verified switch, without transfer requests', async () => {
	const f = fixture(); expect(await linkWallet(f.input)).toEqual(wallet);
	expect(f.calls).toEqual(['eth_requestAccounts', 'eth_chainId', 'wallet_switchEthereumChain', 'eth_chainId', 'begin', 'personal_sign', 'verify']);
	expect(f.request).toHaveBeenCalledWith({ method: 'personal_sign', params: [challenge.message, address] });
	expect(f.client.verify).toHaveBeenCalledWith({ ...challenge, signature: '0x1234' });
	expect(f.input.connected).toHaveBeenCalledWith({ address, chainId: 123456, connectorId: 'synthetic' });
});

test.each(['eth_requestAccounts', 'wallet_switchEthereumChain', 'personal_sign'])('cancellation after pending %s stops before verify', async method => {
	const f = fixture(); const request = f.request.getMockImplementation()!;
	f.request.mockImplementation(async input => { const output = await request(input); if (input.method === method) f.cancel(); return output; });
	await expect(linkWallet(f.input)).rejects.toBeInstanceOf(WalletLinkCancelled);
	expect(f.client.verify).not.toHaveBeenCalled();
	if (method !== 'personal_sign') expect(f.client.begin).not.toHaveBeenCalled();
});

test('switch failure, rejected signature and unchanged chain do not register an address', async () => {
	for (const mode of ['switch', 'signature', 'chain']) {
		const f = fixture(); const request = f.request.getMockImplementation()!;
		f.request.mockImplementation(async input => {
			if (mode === 'switch' && input.method === 'wallet_switchEthereumChain') throw new Error('4902 unsupported chain');
			if (mode === 'signature' && input.method === 'personal_sign') throw new Error('User rejected');
			if (mode === 'chain' && input.method === 'wallet_switchEthereumChain') return null;
			return request(input);
		});
		await expect(linkWallet(f.input)).rejects.toThrow(); expect(f.client.verify).not.toHaveBeenCalled();
	}
});
