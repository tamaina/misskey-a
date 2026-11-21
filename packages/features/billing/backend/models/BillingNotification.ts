/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
/** Source notification reservation: a failed/unknown send is never automatically resent. */
@Entity('billing_notification')
export class MiBillingNotification {
	@PrimaryColumn('varchar', { length: 128, primaryKeyConstraintName: 'billing_notification_pk' }) public eventKey: string;
	@Column({ ...id(), nullable: true }) public userId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_notification_user_fk' }) public user: MiUser | null;
	@Column('timestamp with time zone') public createdAt: Date;
}
