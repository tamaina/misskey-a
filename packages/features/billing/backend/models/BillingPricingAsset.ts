/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { PricingAsset } from '../catalog.schema.js';
@Entity('billing_pricing_asset')
@Index('billing_pricing_asset_key', ['pricingAssetKey'], { unique: true })
export class MiBillingPricingAsset {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_pricing_asset_pk' }) public id: string;
	@Column('varchar', { length: 128 }) public pricingAssetKey: string;
	@Column('jsonb') public data: PricingAsset;
	@Column('timestamp with time zone') public updatedAt: Date;
	@Column({ ...id(), nullable: true }) public updatedByUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updatedByUserId', foreignKeyConstraintName: 'billing_pricing_asset_actor_fk' }) public updatedByUser: MiUser | null;
}
