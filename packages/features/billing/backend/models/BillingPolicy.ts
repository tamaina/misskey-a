/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { BillingPolicy } from '../policy.schema.js';
@Entity('billing_policy')
export class MiBillingPolicy {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_policy_pk' }) public id: string;
	@Column('integer') public revision: number;
	@Column('jsonb') public policy: BillingPolicy;
	@Column('timestamp with time zone') public updatedAt: Date;
	@Column({ ...id(), nullable: true }) public updatedByUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updatedByUserId', foreignKeyConstraintName: 'billing_policy_actor_fk' }) public updatedByUser: MiUser | null;
}
