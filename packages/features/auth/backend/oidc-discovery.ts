/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createClientMetadataFetcher } from './oauth/ClientMetadataFetcher.js';
import { validateOidcMetadata } from './oidc-verification.js';
import type { ClientMetadataNetwork } from './oauth/ClientMetadataFetcher.js';
import type { OidcProviderMetadata } from './oidc-verification.js';

export interface ConfiguredOidcProvider {
	id: string;
	version: string;
	issuer: string;
	clientId: string;
	enabled: boolean;
}

/** Finite public-network pilot: no internal IdPs or cross-origin provider endpoints. */
export function createOidcDiscovery(network?: ClientMetadataNetwork) {
	const fetchMetadata = createClientMetadataFetcher(network);
	return async (provider: ConfiguredOidcProvider): Promise<OidcProviderMetadata> => {
		if (provider.enabled !== true) throw new Error('OIDC provider disabled');
		const issuer = new URL(provider.issuer);
		if (issuer.protocol !== 'https:' || issuer.username || issuer.password || issuer.search || issuer.hash || provider.issuer.includes('#')) throw new Error('Invalid OIDC issuer');
		const url = `${provider.issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
		const response = await fetchMetadata(url);
		if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error('OIDC discovery requires JSON');
		const metadata = await response.json() as OidcProviderMetadata;
		validateOidcMetadata(metadata, provider.issuer);
		for (const endpoint of [metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri]) {
			if (new URL(endpoint).origin !== issuer.origin) throw new Error('Cross-origin OIDC endpoint unsupported');
		}
		return metadata;
	};
}
