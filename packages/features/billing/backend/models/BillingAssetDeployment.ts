/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import { MiBillingWalletChain } from './BillingWalletChain.js';
import { MiBillingPricingAsset } from './BillingPricingAsset.js';
import type { AssetDeployment } from '../catalog.schema.js';
const integer = { type: 'bigint' as const, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } };
@Entity('billing_asset_deployment')
@Index('billing_asset_deployment_chain_contract', ['chainId', 'contractAddress'], { unique: true })
export class MiBillingAssetDeployment {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_asset_deployment_pk' }) public id: string;
	@Column({ ...id() }) public assetId: string;
	@ManyToOne(() => MiBillingPricingAsset, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'assetId', foreignKeyConstraintName: 'billing_asset_deployment_asset_fk' }) public asset: MiBillingPricingAsset;
	@Column(integer) public chainId: number;
	@ManyToOne(() => MiBillingWalletChain, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'chainId', foreignKeyConstraintName: 'billing_asset_deployment_chain_fk' }) public chain: MiBillingWalletChain;
	@Column('varchar', { length: 42 }) public contractAddress: string;
	@Column('jsonb') public data: AssetDeployment;
	@Column('timestamp with time zone') public updatedAt: Date;
	@Column({ ...id(), nullable: true }) public updatedByUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updatedByUserId', foreignKeyConstraintName: 'billing_asset_deployment_actor_fk' }) public updatedByUser: MiUser | null;
}
