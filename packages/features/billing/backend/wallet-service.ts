/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { createPublicClient, getAddress, http, isAddress } from 'viem';
import { createSiweMessage, generateSiweNonce, verifySiweMessage } from 'viem/siwe';
import { createWalletRpcFetch, WALLET_RPC_TIMEOUT } from './wallet-rpc.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type * as v from 'valibot';
import type { webAuthnAuthenticationOptionsSchema, webAuthnAuthenticationResponseSchema } from '../../auth/backend/webauthn.schema.js';
import type { Hex } from 'viem';
import type { LinkedWallet, WalletChain, walletErrors } from './api.definition.js';

export const WALLET_CHALLENGE_TTL = 10 * 60 * 1000;
export interface WalletChallenge {
	nonce: string; userId: string; chainId: number; address: string;
	domain: string; uri: string; message: string; createdAt: number; expiresAt: number; usedAt: number | null;
}
export interface WalletRecord extends LinkedWallet { userId: string }
export interface WalletStore {
	list(userId: string): Promise<readonly WalletRecord[]>;
	find(chainId: number, address: string): Promise<WalletRecord | null>;
	insertChallenge(challenge: WalletChallenge): Promise<void>;
	getChallenge(nonce: string, userId: string): Promise<WalletChallenge | null>;
	/** In one transaction, lock/recheck challenge identity, owner, message, unused status and expiry at now;
	 * insert wallet with global UNIQUE(chainId, address), then consume challenge. Roll back both on failure.
	 * A replay or race returns null. No payment, balance or entitlement writes belong here. */
	complete(challenge: WalletChallenge, wallet: WalletRecord, now: number): Promise<WalletRecord | null>;
	/** Delete only WHERE id = walletId AND userId = principalId. */
	unlink(walletId: string, principalId: string): Promise<boolean>;
}
export type WalletAuthentication = { currentPassword?: string; twoFactorToken?: string; passkey?: v.InferOutput<typeof webAuthnAuthenticationResponseSchema> };
export interface WalletDependencies {
	chainSettings?: import('./wallet-chain-store.js').WalletChainSettingsStore;
	passkeyOptions?(userId: string): Promise<v.InferOutput<typeof webAuthnAuthenticationOptionsSchema>>;
	store: WalletStore;
	/** Server configuration's canonical public origin, never the request Host header. */
	origin: string;
	/** Owns the source's sensitive-action reauthentication. Must fail closed until a native adapter is supplied. */
	reauthenticate(userId: string, input: WalletAuthentication, credential?: string | null): Promise<void>;
	/** Enabled source chain catalog with configured RPC; no URLs/credentials in returned DTOs. */
	chains(): Promise<readonly WalletChain[]>;
	rpcUrl(chainId: number): Promise<string | null>;
	id(now: number): string;
	now(): number;
	nonce(): string;
	verify(challenge: WalletChallenge, signature: Hex, rpcUrl: string, now: number): Promise<boolean>;
}

function walletError(code: keyof typeof walletErrors) {
	return apiError({ code, message: 'Wallet registration could not be completed.', id: '2c3c4a97-3aca-4a28-b0d6-8359d6751956' });
}

/** Same SIWE library and RPC verifier as cfw-fileup; no signing or transfer operation. */
export function createWalletProof(native: Pick<HttpRequestService, 'send'>) {
	const fetchFn = createWalletRpcFetch(native);
	return {
		nonce: generateSiweNonce,
		async verify(challenge: WalletChallenge, signature: Hex, rpcUrl: string, now: number): Promise<boolean> {
			try {
				const client = createPublicClient({ transport: http(rpcUrl, { retryCount: 0, timeout: WALLET_RPC_TIMEOUT, fetchFn }) });
				return await verifySiweMessage(client, { address: getAddress(challenge.address), domain: challenge.domain,
																																							message: challenge.message, nonce: challenge.nonce, signature, time: new Date(now) });
			} catch { return false; } // Never propagate viem errors containing private RPC URLs.
		},
	};
}

export function createWalletService(deps: WalletDependencies) {
	const origin = new URL(deps.origin);

	function requireSecureOrigin() {
		if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
			throw new Error('Wallet registration requires a canonical HTTPS origin');
		}
	}

	return {
		async begin(userId: string, input: { chainId: number; address: string } & WalletAuthentication, credential?: string | null) {
			requireSecureOrigin();
			await deps.reauthenticate(userId, input, credential);
			if (!await deps.rpcUrl(input.chainId)) throw walletError('WALLET_CHAIN_UNSUPPORTED');
			if (!isAddress(input.address)) throw walletError('PAYMENT_TRANSACTION_INVALID');
			const address = input.address.toLowerCase();
			if (await deps.store.find(input.chainId, address)) throw walletError('WALLET_ALREADY_LINKED');
			const now = deps.now();
			const nonce = deps.nonce();
			const message = createSiweMessage({
				address: getAddress(address),
				chainId: input.chainId,
				domain: origin.host,
				uri: origin.origin,
				nonce,
				version: '1',
				statement: 'Link this wallet to your Misskey 9000 account.',
				issuedAt: new Date(now),
				expirationTime: new Date(now + WALLET_CHALLENGE_TTL),
			});
			await deps.store.insertChallenge({
				nonce, userId, chainId: input.chainId, address,
				domain: origin.host, uri: origin.origin, message,
				createdAt: now, expiresAt: now + WALLET_CHALLENGE_TTL, usedAt: null,
			});
			return { nonce, message };
		},
		async verify(userId: string, input: { nonce: string; message: string; signature: string }) {
			requireSecureOrigin();
			const challenge = await deps.store.getChallenge(input.nonce, userId);
			const now = deps.now();
			if (!challenge || challenge.nonce !== input.nonce || challenge.userId !== userId || challenge.usedAt !== null || challenge.expiresAt <= now
				|| challenge.message !== input.message || challenge.domain !== origin.host || challenge.uri !== origin.origin) {
				throw walletError('WALLET_CHALLENGE_NOT_FOUND');
			}
			const rpc = await deps.rpcUrl(challenge.chainId);
			if (!rpc) throw walletError('WALLET_CHAIN_UNSUPPORTED');
			let valid = false;
			try { valid = await deps.verify(challenge, input.signature as Hex, rpc, now); } catch { /* Fail closed on RPC/signature errors. */ }
			if (!valid) throw walletError('WALLET_SIGNATURE_INVALID');
			if (await deps.store.find(challenge.chainId, challenge.address)) throw walletError('WALLET_ALREADY_LINKED');
			const completedAt = deps.now();
			// Recheck expiry after external verification; the storage transaction must recheck too.
			if (challenge.expiresAt <= completedAt) throw walletError('WALLET_CHALLENGE_NOT_FOUND');
			const record: WalletRecord = {
				id: deps.id(completedAt), userId,
				chainId: challenge.chainId, address: challenge.address, label: null,
				createdAt: completedAt, updatedAt: completedAt,
			};
			const wallet = await deps.store.complete(challenge, record, completedAt);
			if (!wallet) throw walletError('WALLET_CHALLENGE_NOT_FOUND');
			if (wallet.userId !== userId || wallet.chainId !== challenge.chainId || wallet.address !== challenge.address) {
				throw new Error('Invalid wallet storage result');
			}
			return wallet;
		},
		async unlink(userId: string, walletId: string) {
			if (!await deps.store.unlink(walletId, userId)) throw walletError('WALLET_NOT_FOUND');
			return { ok: true as const };
		},
	};
}
