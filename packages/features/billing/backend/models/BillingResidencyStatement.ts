/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
@Entity('billing_residency_statement')
@Index('billing_residency_statement_active_country', ['country'], { unique: true, where: '"isEnabled" = true' })
export class MiBillingResidencyStatement {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_residency_statement_pk' }) public id: string;
	@Column('varchar', { length: 2 }) public country: string;
	@Column('varchar', { length: 4096 }) public statement: string;
	@Column('boolean') public isEnabled: boolean;
	@Column('timestamp with time zone') public createdAt: Date;
	@Column('timestamp with time zone', { nullable: true }) public retiredAt: Date | null;
}
