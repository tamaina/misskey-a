/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ContractRouterClient } from '@orpc/contract';
import type { walletContract } from '../backend/api.definition.js';

export type WalletClient = ContractRouterClient<typeof walletContract>;
export interface WalletProvider {
	on?(event: 'accountsChanged' | 'chainChanged' | 'disconnect', listener: () => void): void;
	removeListener?(event: 'accountsChanged' | 'chainChanged' | 'disconnect', listener: () => void): void;
	request(input: { method: string; params?: readonly unknown[] }): Promise<unknown>;
}
export interface WalletConnector { id: string; name: string; provider: WalletProvider }
export interface ConnectedWallet { address: string; chainId: number; connectorId: string }

export type WalletAuthInput = Pick<Parameters<WalletClient['begin']>[0], 'currentPassword' | 'twoFactorToken' | 'passkey'>;
