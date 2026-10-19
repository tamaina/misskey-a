/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { createOidcIdTokenVerifier, validateOidcMetadata } from './oidc-verification.js';
import { createOidcPinnedJsonRequester, oidcHttpsUrl } from './oidc-pinned-transport.js';
import type { JSONWebKeySet } from 'jose';
import type { ClientMetadataNetwork } from './oauth/ClientMetadataFetcher.js';
import type { ConfiguredOidcProvider } from './oidc-discovery.js';
import type { OidcProviderMetadata, OidcIdentity } from './oidc-verification.js';
import type { PendingOidcTransaction } from './oidc-transaction-store.js';

/** #121 cannot produce these additional bindings yet. No runtime bridge/cast exists. */
export interface BoundOidcExchangeTransaction extends PendingOidcTransaction {
	redirectUri: string;
	codeChallenge: string;
}
export interface OidcExchangeProvider extends ConfiguredOidcProvider { redirectUri: string; }

function record(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid JSON object');
	return value as Record<string, unknown>;
}

function bounded(value: unknown, maximum = 2048): asserts value is string {
	if (typeof value !== 'string' || !value || value.length > maximum) throw new Error('Invalid field');
}

function publicKeys(value: unknown): JSONWebKeySet {
	const keys = record(value).keys;
	if (!Array.isArray(keys) || !keys.length || keys.length > 32) throw new Error('Invalid JWKS');
	const rsa: JSONWebKeySet['keys'] = [];
	for (const value of keys) {
		const key = record(value);
		if (['k', 'd', 'p', 'q', 'dp', 'dq', 'qi', 'oth'].some(field => key[field] !== undefined)) throw new Error('Private JWKS');
		let operations: string[] | undefined;
		if (key.key_ops !== undefined) {
			if (!Array.isArray(key.key_ops) || key.key_ops.length > 8) throw new Error('Invalid key operations');
			operations = [];
			for (const operation of key.key_ops) {
				bounded(operation, 16);
				if (!['sign', 'verify', 'encrypt', 'decrypt', 'wrapKey', 'unwrapKey', 'deriveKey', 'deriveBits'].includes(operation) ||
					operations.includes(operation)) throw new Error('Invalid key operation');
				operations.push(operation);
			}
			if (!operations.includes('verify')) continue;
		}
		if (key.kty !== 'RSA' || (key.use !== undefined && key.use !== 'sig') || (key.alg !== undefined && key.alg !== 'RS256')) continue;
		bounded(key.n, 2048); bounded(key.e, 12);
		if (!/^[A-Za-z0-9_-]+$/.test(key.n) || !/^[A-Za-z0-9_-]+$/.test(key.e)) throw new Error('Invalid RSA fields');
		const modulus = Buffer.from(key.n, 'base64url');
		const exponent = Buffer.from(key.e, 'base64url');
		if (modulus.length < 256 || modulus.length > 1024 || !modulus[0] || exponent.length < 1 || exponent.length > 8 || !exponent[0]) throw new Error('Invalid RSA size');
		if (key.kid !== undefined) bounded(key.kid, 256);
		rsa.push({ kty: 'RSA', n: key.n, e: key.e, alg: 'RS256', use: 'sig', ...(operations ? { key_ops: operations } : {}), ...(typeof key.kid === 'string' ? { kid: key.kid } : {}) });
	}
	if (!rsa.length) throw new Error('No trusted RSA key');
	return { keys: rsa };
}

const formValue = (value: string) => new URLSearchParams({ value }).toString().slice('value='.length);

/** Unconnected protocol adapter. Inputs must be server-owned; result is identity,
 * never a local login grant. Future completion must recheck provider and local MFA/session. */
export function createOidcTokenExchange(network?: ClientMetadataNetwork) {
	const requestJson = createOidcPinnedJsonRequester(network);
	return async (providerInput: OidcExchangeProvider, metadataInput: OidcProviderMetadata,
		transactionInput: BoundOidcExchangeTransaction, codeInput: string, secretInput: string): Promise<OidcIdentity> => {
		const deadlineAt = performance.now() + 5000;
		try {
			// Snapshot every input before the first await; none is captured as long-lived state.
			const provider = { ...providerInput };
			const metadata = {
				...metadataInput, response_types_supported: [...metadataInput.response_types_supported],
				id_token_signing_alg_values_supported: [...metadataInput.id_token_signing_alg_values_supported],
				code_challenge_methods_supported: [...metadataInput.code_challenge_methods_supported],
				token_endpoint_auth_methods_supported: [...metadataInput.token_endpoint_auth_methods_supported],
			};
			const transaction = { ...transactionInput, purpose: { ...transactionInput.purpose } };
			const code = codeInput; const secret = secretInput;
			if (provider.enabled !== true) throw new Error('Disabled provider');
			for (const field of [
				provider.id, provider.version, provider.issuer, provider.clientId, provider.redirectUri,
				transaction.providerId, transaction.providerVersion, transaction.issuer, transaction.clientId,
				transaction.redirectUri, transaction.nonce]) bounded(field);
			bounded(code, 4096); bounded(secret);
			validateOidcMetadata(metadata, provider.issuer);
			const issuer = oidcHttpsUrl(provider.issuer);
			if (provider.issuer.includes('?')) throw new Error('Invalid issuer');
			oidcHttpsUrl(provider.redirectUri);
			for (const endpoint of [metadata.token_endpoint, metadata.jwks_uri]) {
				if (oidcHttpsUrl(endpoint).origin !== issuer.origin) throw new Error('Cross-origin provider');
			}
			if (transaction.providerId !== provider.id || transaction.providerVersion !== provider.version ||
				transaction.issuer !== provider.issuer || transaction.clientId !== provider.clientId ||
				transaction.redirectUri !== provider.redirectUri) throw new Error('Binding mismatch');
			if (typeof transaction.codeVerifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(transaction.codeVerifier) ||
				createHash('sha256').update(transaction.codeVerifier).digest('base64url') !== transaction.codeChallenge) throw new Error('PKCE mismatch');
			const form = new URLSearchParams({
				grant_type: 'authorization_code', code, redirect_uri: provider.redirectUri,
				code_verifier: transaction.codeVerifier,
			}).toString();
			const authorization = `Basic ${Buffer.from(`${formValue(provider.clientId)}:${formValue(secret)}`).toString('base64')}`;
			const response = record(await requestJson(metadata.token_endpoint, { method: 'POST', form, authorization }, deadlineAt));
			if (response.error !== undefined) throw new Error('Provider error');
			bounded(response.id_token, 16384); bounded(response.access_token, 16384);
			if (typeof response.token_type !== 'string' || response.token_type.toLowerCase() !== 'bearer') throw new Error('Unsupported token response');
			const keys = publicKeys(await requestJson(metadata.jwks_uri, { method: 'GET' }, deadlineAt));
			const identity = await createOidcIdTokenVerifier(keys)(response.id_token, {
				issuer: provider.issuer, clientId: provider.clientId, nonce: transaction.nonce, trustVerifiedEmail: false,
			});
			if (performance.now() >= deadlineAt) throw new Error('Expired exchange');
			return identity;
		} catch {
			throw new Error('OIDC token exchange failed');
		}
	};
}
