/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createLocalJWKSet, jwtVerify } from 'jose';
import type { JSONWebKeySet } from 'jose';

export interface OidcProviderMetadata {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	jwks_uri: string;
	response_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	code_challenge_methods_supported: string[];
	token_endpoint_auth_methods_supported: string[];
}

function httpsUrl(value: string): void {
	const url = new URL(value);
	if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Invalid OIDC URL');
}

/** Validates protocol capabilities only. No discovery fetch or SSRF authorization. */
export function validateOidcMetadata(metadata: OidcProviderMetadata, configuredIssuer: string): void {
	for (const url of [metadata.issuer, metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri]) httpsUrl(url);
	if (new URL(metadata.issuer).search || metadata.issuer !== configuredIssuer) throw new Error('OIDC issuer mismatch');
	if (!metadata.response_types_supported.includes('code') ||
		!metadata.id_token_signing_alg_values_supported.includes('RS256') ||
		!metadata.code_challenge_methods_supported.includes('S256') ||
		!metadata.token_endpoint_auth_methods_supported.includes('client_secret_basic')) throw new Error('Unsupported OIDC capabilities');
}

export interface OidcIdentity {
	issuer: string;
	subject: string;
	verifiedEmail?: string;
}

/** Trusted keys must come from configured provider metadata, never token jku/x5u. */
export function createOidcIdTokenVerifier(trustedKeys: JSONWebKeySet) {
	const keySelector = createLocalJWKSet(trustedKeys);
	return async (token: string, expected: {
		issuer: string;
		clientId: string;
		nonce: string;
		trustVerifiedEmail: boolean;
		now?: Date;
	}): Promise<OidcIdentity> => {
		httpsUrl(expected.issuer);
		if (!expected.clientId || !expected.nonce) throw new Error('Missing OIDC transaction expectations');
		const now = expected.now ?? new Date();
		const { payload } = await jwtVerify(token, keySelector, {
			algorithms: ['RS256'], issuer: expected.issuer, audience: expected.clientId,
			requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', 'nonce'], currentDate: now,
		});
		if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 255 || /[^\x20-\x7E]/.test(payload.sub)) throw new Error('Invalid OIDC subject');
		if (payload.nonce !== expected.nonce) throw new Error('OIDC nonce mismatch');
		// This finite pilot accepts one intended audience; reject ambiguous multi-party tokens.
		if (payload.aud !== expected.clientId && !(Array.isArray(payload.aud) && payload.aud.length === 1 && payload.aud[0] === expected.clientId)) throw new Error('Unsupported OIDC audience');
		if (payload.azp !== undefined && payload.azp !== expected.clientId) throw new Error('OIDC authorized party mismatch');
		if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number' || payload.iat > now.getTime() / 1000 || payload.iat >= payload.exp) throw new Error('Invalid OIDC issued-at');
		return {
			issuer: expected.issuer, subject: payload.sub,
			...(expected.trustVerifiedEmail && payload.email_verified === true && typeof payload.email === 'string' && payload.email.length > 0
				? { verifiedEmail: payload.email } : {}),
		};
	};
}

/** UserInfo is supplementary; it must describe the already verified subject. */
export function validateOidcUserInfoSubject(identity: OidcIdentity, userInfo: { sub?: unknown }): void {
	if (userInfo.sub !== identity.subject) throw new Error('OIDC UserInfo subject mismatch');
}
