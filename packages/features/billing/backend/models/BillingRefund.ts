/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { RefundData } from '../../shared/refund-types.js';
@Entity('billing_refund')
@Index('billing_refund_request_key', ['userId', 'requestKey'], { unique: true })
export class MiBillingRefund {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_refund_pk' }) public id: string;
	@Column({ ...id(), nullable: true }) public userId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_refund_user_fk' }) public user: MiUser | null;
	@Column('varchar', { length: 128 }) public requestKey: string;
	@Column('jsonb') public data: RefundData;
}
