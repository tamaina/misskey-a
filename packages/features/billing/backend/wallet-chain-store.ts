/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiBillingWalletChain } from './models/BillingWalletChain.js';
import type { DataSource } from 'typeorm';
import type { WalletChainSettings, WalletChainSettingsInput } from './api.definition.js';

export interface WalletChainSettingsStore {
	listSettings(): Promise<WalletChainSettings[]>;
	upsertSettings(input: WalletChainSettingsInput, actorId: string): Promise<WalletChainSettings>;
}

function publicChain(row: MiBillingWalletChain) {
	return { chainId: row.chainId, name: row.name, nativeCurrencyName: row.nativeCurrencyName,
										nativeCurrencySymbol: row.nativeCurrencySymbol, nativeCurrencyDecimals: row.nativeCurrencyDecimals,
										blockExplorerUrl: row.blockExplorerUrl };
}

/** A single persistent catalog for native administration and wallet registration.
 * RPC writes use bound parameters and suppress parameters in all native SQL log paths.
 */
export function createPostgresWalletChainStore(db: DataSource, now = Date.now) {
	const repository = db.getRepository(MiBillingWalletChain);
	const settingsQuery = () => repository.createQueryBuilder('chain').addSelect('chain."rpcUrl" IS NOT NULL', 'hasRpc').orderBy('chain.chainId', 'ASC');

	async function listSettings(): Promise<WalletChainSettings[]> {
		const { entities, raw } = await settingsQuery().getRawAndEntities();
		return entities.map((row, index) => ({ ...publicChain(row), isEnabled: row.isEnabled, hasRpc: raw[index].hasRpc === true }));
	}

	return {
		listSettings,
		async chains() {
			return (await listSettings()).filter(row => row.isEnabled && row.hasRpc).map(({ isEnabled, hasRpc, ...chain }) => chain);
		},
		async rpcUrl(chainId: number) {
			const row = await repository.createQueryBuilder('chain').select('chain.rpcUrl').where('chain.chainId = :chainId', { chainId }).andWhere('chain.isEnabled = true').getOne();
			return row?.rpcUrl ?? null;
		},
		async upsertSettings(input: WalletChainSettingsInput, actorId: string): Promise<WalletChainSettings> {
			const runner = db.createQueryRunner();
			runner.data.billingWalletRpc = true;
			try {
				const { rpcUrl, ...metadata } = input;
				// Omission retains the private URL; explicit null clears it. ON CONFLICT is atomic.
				const values = { ...metadata, updatedAt: now(), updatedByUserId: actorId, ...(rpcUrl !== undefined ? { rpcUrl } : {}) };
				const columns = Object.keys(values);
				await runner.manager.createQueryBuilder().insert().into(MiBillingWalletChain).values(values)
					.orUpdate(columns.filter(column => column !== 'chainId'), ['chainId']).execute();
			} finally {
				await runner.release();
			}
			const row = (await listSettings()).find(chain => chain.chainId === input.chainId);
			if (!row) throw new Error('Wallet chain settings could not be saved');
			return row;
		},
	};
}
