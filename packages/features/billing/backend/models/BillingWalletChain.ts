/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';

const integer = { type: 'bigint' as const, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } };
@Entity('billing_wallet_chain')
@Check('billing_wallet_chain_id_check', '"chainId" BETWEEN 1 AND 9007199254740991')
@Check('billing_wallet_chain_decimals_check', '"nativeCurrencyDecimals" BETWEEN 0 AND 255')
@Check('billing_wallet_chain_updatedAt_check', '"updatedAt" BETWEEN 0 AND 9007199254740991')
export class MiBillingWalletChain {
	@PrimaryColumn({ ...integer, primaryKeyConstraintName: 'billing_wallet_chain_pk' })
	public chainId: number;

	@Column('varchar', { length: 128 })
	public name: string;

	@Column('varchar', { length: 128 })
	public nativeCurrencyName: string;

	@Column('varchar', { length: 128 })
	public nativeCurrencySymbol: string;

	@Column('integer')
	public nativeCurrencyDecimals: number;

	@Column('varchar', { length: 2048, nullable: true })
	public blockExplorerUrl: string | null;

	@Column('boolean', { default: false })
	public isEnabled: boolean;

	/** Private, write-only operational setting. Never include in API DTOs or query logs. */
	@Column('varchar', { length: 2048, nullable: true, select: false })
	public rpcUrl: string | null;

	@Column(integer)
	public updatedAt: number;

	@Column({ ...id(), nullable: true })
	public updatedByUserId: string | null;

	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updatedByUserId', foreignKeyConstraintName: 'billing_wallet_chain_actor_fk' })
	public updatedByUser: MiUser | null;
}
