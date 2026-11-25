/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { CountryEligibilityEvidence } from '../country-eligibility.js';
import type { DeclaredResidence } from '../residence.schema.js';
import type { ReceiptSnapshot } from '../policy.schema.js';
import type { PaymentQuote } from '../../shared/payment-quote.js';
import type { ServiceOffer } from '../api.definition.js';
const integer = { type: 'bigint' as const, transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } };
@Entity('billing_service_order')
@Index('billing_service_order_request_key', ['userId', 'requestKey'], { unique: true })
@Index('billing_service_order_transaction_key', ['chainId', 'txHash'], { unique: true, where: '"status" = \'paid\'' })
@Index('billing_service_order_status_paid_at', ['status', 'paidAt'])
@Index('billing_service_order_user_id', ['userId', 'id'])
@Check('billing_service_order_status_check', '"status" IN (\'pending\',\'paid\',\'expired\',\'failed\')')
@Check('billing_service_order_period_check', '("status" = \'paid\' AND ("txHash" IS NOT NULL OR "cashAmountBaseUnits" = \'0\') AND "paidAt" IS NOT NULL AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt") OR ("status" <> \'paid\' AND "paidAt" IS NULL AND "startsAt" IS NULL AND "endsAt" IS NULL)')
export class MiBillingServiceOrder {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_service_order_pk' }) public id: string;
	@Column('jsonb', { nullable: true }) public countryEligibility: CountryEligibilityEvidence | null;
	@Column('jsonb', { nullable: true }) public declaredResidence: DeclaredResidence | null;

	@Column({ ...id(), nullable: true }) public userId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'billing_service_order_user_fk' }) public user: MiUser | null;
	@Column('varchar', { length: 128 }) public requestKey: string;
	@Column({ ...id() }) public walletId: string;
	@Column('jsonb') public offer: ServiceOffer;
	@Column('jsonb', { nullable: true }) public receiptSnapshot: ReceiptSnapshot | null;
	@Column('jsonb', { nullable: true }) public quote: PaymentQuote | null;
	@Column({ ...integer, nullable: true }) public billingRevision: number | null;
	@Column('varchar', { length: 78, nullable: true }) public cashAmountBaseUnits: string | null;
	@Column(integer) public chainId: number;
	@Column('varchar', { length: 42 }) public payerAddress: string;
	@Column('varchar', { length: 16, default: 'pending' }) public status: 'pending' | 'paid' | 'expired' | 'failed';
	@Column('varchar', { length: 66, nullable: true }) public txHash: string | null;
	@Column(integer) public createdAt: number;
	@Column(integer) public expiresAt: number;
	@Column({ ...integer, nullable: true }) public paidAt: number | null;
	@Column({ ...integer, nullable: true }) public startsAt: number | null;
	@Column({ ...integer, nullable: true }) public endsAt: number | null;
}
