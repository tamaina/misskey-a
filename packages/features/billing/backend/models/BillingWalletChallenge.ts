/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';

const integer = { type: 'bigint' as const, transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } };
@Entity('billing_wallet_challenge')
@Index('billing_wallet_challenge_user_idx', ['userId'])
@Check('billing_wallet_challenge_chain_check', '"chainId" BETWEEN 1 AND 9007199254740991')
@Check('billing_wallet_challenge_address_check', '"address" ~ \'^0x[0-9a-f]{40}$\'')
@Index('billing_wallet_challenge_expires_idx', ['expiresAt'])
@Check('billing_wallet_challenge_createdAt_check', '"createdAt" BETWEEN 0 AND 9007199254740991')
@Check('billing_wallet_challenge_expiresAt_check', '"expiresAt" BETWEEN 0 AND 9007199254740991')
@Check('billing_wallet_challenge_usedAt_check', '"usedAt" BETWEEN 0 AND 9007199254740991')
export class MiBillingWalletChallenge {
	@PrimaryColumn({ type: 'varchar', length: 128, primaryKeyConstraintName: 'billing_wallet_challenge_pk' })
	public nonce: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_wallet_challenge_user_fk' })
	public user: MiUser | null;

	@Column(integer)
	public chainId: number;

	@Column('varchar', { length: 42 })
	public address: string;

	@Column('varchar', { length: 2048, nullable: false })
	public domain: string;

	@Column('varchar', { length: 2048, nullable: false })
	public uri: string;

	@Column('varchar', { length: 4096, nullable: false })
	public message: string;

	@Column({ ...integer, nullable: false })
	public createdAt: number;

	@Column({ ...integer, nullable: false })
	public expiresAt: number;

	@Column({ ...integer, nullable: true })
	public usedAt: number | null;
}
