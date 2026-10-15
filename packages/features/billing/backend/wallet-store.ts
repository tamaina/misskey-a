/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { requireDeclaredResidence } from './residence-store.js';
import { MiBillingWallet } from './models/BillingWallet.js';
import { MiBillingWalletChallenge } from './models/BillingWalletChallenge.js';
import type { DataSource } from 'typeorm';
import type { WalletChallenge, WalletRecord, WalletStore } from './wallet-service.js';

/** PostgreSQL owns both the single-use proof and globally unique wallet ownership. */
export function createPostgresWalletStore(db: DataSource, clock: () => number = Date.now): WalletStore {
	const wallets = db.getRepository(MiBillingWallet);
	const challenges = db.getRepository(MiBillingWalletChallenge);
	return {
		list: userId => wallets.find({ where: { userId }, order: { createdAt: 'ASC', id: 'ASC' } }),
		find: (chainId, address) => wallets.findOneBy({ chainId, address }),
		insertChallenge: async challenge => { await challenges.insert(challenge); },
		getChallenge: (nonce, userId) => challenges.findOneBy({ nonce, userId }),
		async complete(expected: WalletChallenge, wallet: WalletRecord, now: number) {
			try {
				return await db.transaction(async tx => {
					const challenge = await tx.getRepository(MiBillingWalletChallenge).findOne({
						where: { nonce: expected.nonce, userId: wallet.userId }, lock: { mode: 'pessimistic_write' },
					});
					if (!challenge) return null;
					await requireDeclaredResidence(tx, wallet.userId);
					// Sample after all guards and locks: waiting cannot extend a proof's lifetime.
					const completedAt = Math.max(now, clock());
					if (expected.usedAt !== null || !challenge || challenge.usedAt !== null || challenge.expiresAt <= completedAt
						|| challenge.userId !== expected.userId || challenge.chainId !== expected.chainId
						|| challenge.address !== expected.address || challenge.message !== expected.message
						|| challenge.domain !== expected.domain || challenge.uri !== expected.uri
						|| challenge.createdAt !== expected.createdAt || challenge.expiresAt !== expected.expiresAt
						|| wallet.chainId !== challenge.chainId || wallet.address !== challenge.address) return null;
					const inserted = { ...wallet, createdAt: completedAt, updatedAt: completedAt };
					await tx.getRepository(MiBillingWallet).insert(inserted);
					await tx.getRepository(MiBillingWalletChallenge).update({ nonce: challenge.nonce }, { usedAt: completedAt });
					return inserted;
				});
			} catch (error) {
				if (error instanceof Error && 'driverError' in error) {
					const driver = error.driverError as { code?: string; constraint?: string };
					if (driver.code === '23505' && driver.constraint === 'billing_wallet_chain_address_key') return null;
				}
				throw error;
			}
		},
		unlink: async (id, userId) => (await wallets.delete({ id, userId })).affected === 1,
	};
}
