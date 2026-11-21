/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('billing_transaction_claim')
export class MiBillingTransactionClaim {
	@PrimaryColumn('bigint', { primaryKeyConstraintName: 'billing_transaction_claim_pk' }) public chainId: string;
	@PrimaryColumn('varchar', { length: 66, primaryKeyConstraintName: 'billing_transaction_claim_pk' }) public txHash: string;
	@Column('varchar', { length: 128 }) public ownerId: string;
}
