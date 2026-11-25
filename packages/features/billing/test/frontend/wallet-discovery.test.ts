/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test, expect, vi } from 'vitest';
import { discoverWallets } from '../../frontend/wallet-discovery.js';
import type { WalletConnector } from '../../frontend/wallet-client.js';

test('discovery requests no wallet access and deduplicates legacy/announced providers; disposal detaches', () => {
	const provider = { request: vi.fn() };
	const target = window as Window & { ethereum?: typeof provider };
	target.ethereum = provider;
	let wallets: readonly WalletConnector[] = [];
	const changed = vi.fn((value: readonly WalletConnector[]) => { wallets = value; });
	const detach = discoverWallets(target, changed);
	const announce = () => target.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: {
		info: { uuid: '00000000-0000-4000-8000-000000000001', name: 'Synthetic wallet' }, provider,
	} }));
	try {
		expect(wallets).toHaveLength(1); announce(); announce();
		expect(wallets).toHaveLength(1); expect(wallets[0].id).not.toBe('injected');
		expect(provider.request).not.toHaveBeenCalled();
		detach(); changed.mockClear(); announce(); expect(changed).not.toHaveBeenCalled();
	} finally { detach(); delete target.ethereum; }
});
