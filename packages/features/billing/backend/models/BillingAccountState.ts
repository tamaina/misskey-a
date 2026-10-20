/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { BillingState } from '../billing-state.js';
@Entity('billing_account_state')
export class MiBillingAccountState {
	/** Historical billing key; deliberately not an account-deletion foreign key. */
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_account_state_pk' }) public userId: string;
	@Column('jsonb') public data: BillingState;
}
