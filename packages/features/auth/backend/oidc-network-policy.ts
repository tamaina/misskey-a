/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import ipaddr from 'ipaddr.js';
import { publicAddress } from './oauth/ClientMetadataFetcher.js';

/** Server configuration only; provider administrators cannot broaden this policy. */
export function oidcAddress(address: string, allowedPrivateNetworks: readonly string[]): string {
	try { return publicAddress(address); } catch {
		if (address.includes('%') || !ipaddr.isValid(address)) throw new Error('Invalid OIDC address');
		const parsed = ipaddr.process(address);
		for (const value of allowedPrivateNetworks) {
			const range = ipaddr.parseCIDR(value);
			if (parsed.kind() === range[0].kind() && parsed.match(range)) return parsed.toNormalizedString();
		}
		throw new Error('OIDC address outside server network policy');
	}
}
