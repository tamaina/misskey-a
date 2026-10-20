/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';

const integer = { type: 'bigint' as const, transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } };
@Entity('billing_wallet')
@Index('billing_wallet_user_idx', ['userId'])
@Check('billing_wallet_chain_check', '"chainId" BETWEEN 1 AND 9007199254740991')
@Check('billing_wallet_address_check', '"address" ~ \'^0x[0-9a-f]{40}$\'')
@Index('billing_wallet_chain_address_key', ['chainId', 'address'], { unique: true })
@Check('billing_wallet_createdAt_check', '"createdAt" BETWEEN 0 AND 9007199254740991')
@Check('billing_wallet_updatedAt_check', '"updatedAt" BETWEEN 0 AND 9007199254740991')
export class MiBillingWallet {
	@Column('boolean', { default: false }) public isPublicForPayments: boolean;
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_wallet_pk' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_wallet_user_fk' })
	public user: MiUser | null;

	@Column(integer)
	public chainId: number;

	@Column('varchar', { length: 42 })
	public address: string;

	@Column('varchar', { length: 128, nullable: true })
	public label: string | null;

	@Column({ ...integer, nullable: false })
	public createdAt: number;

	@Column({ ...integer, nullable: false })
	public updatedAt: number;
}
