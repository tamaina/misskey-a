/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { BillingState } from '../billing-state.js';
@Entity('billing_account_state')
export class MiBillingAccountState {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_account_state_pk' }) public userId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_account_state_user_fk' }) public user: MiUser;
	@Column('jsonb') public data: BillingState;
}
