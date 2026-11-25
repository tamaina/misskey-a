/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { WalletConnector, WalletProvider } from './wallet-client.js';

/** Discovery does not request accounts or signatures. Detach only this page's listeners. */
export function discoverWallets(target: Window, changed: (wallets: readonly WalletConnector[]) => void): () => void {
	const wallets = new Map<string, WalletConnector>();
	const announce = (event: Event) => {
		const detail = (event as CustomEvent<{ info?: { uuid?: unknown; name?: unknown }; provider?: WalletProvider }>).detail;
		if (!detail?.provider || typeof detail.provider.request !== 'function' || typeof detail.info?.uuid !== 'string'
			|| !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detail.info.uuid) || typeof detail.info.name !== 'string' || detail.info.name.length > 128) return;
		if (wallets.has(detail.info.uuid)) return;
		if (wallets.get('injected')?.provider === detail.provider) wallets.delete('injected');
		wallets.set(detail.info.uuid, { id: detail.info.uuid, name: detail.info.name, provider: detail.provider });
		changed([...wallets.values()]);
	};
	target.addEventListener('eip6963:announceProvider', announce);
	target.dispatchEvent(new Event('eip6963:requestProvider'));
	const legacy = (target as Window & { ethereum?: WalletProvider }).ethereum;
	if (legacy && typeof legacy.request === 'function' && ![...wallets.values()].some(wallet => wallet.provider === legacy)) {
		wallets.set('injected', { id: 'injected', name: 'Browser wallet', provider: legacy });
	}
	changed([...wallets.values()]);
	return () => target.removeEventListener('eip6963:announceProvider', announce);
}
