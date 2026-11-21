/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn, Check } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';

@Entity('mail_account')
@Check('CHK_mail_account_used', '"usedBytes" >= 0')
export class MiMailAccount {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_mail_account' })
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'FK_mail_account_user' })
	public user: MiUser;

	@Column('boolean', { default: false })
	public enabled: boolean;

	// PostgreSQL bigint is a decimal string: never coerce an unbounded value to Number.
	@Column('bigint', { default: 0 })
	public usedBytes: string;
}

@Entity('mail_raw')
export class MiMailRaw {
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_mail_raw' })
	public id: string;

	@Index('IDX_mail_raw_objectKey', { unique: true })
	@Column('varchar', { length: 128 })
	public objectKey: string;

	@Column('varchar', { length: 64 })
	public sha256: string;

	@Column('integer')
	public size: number;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('varchar', { length: 16 })
	public state: 'staging' | 'ready' | 'deleting';
}

@Entity('mail_delivery')
@Index('IDX_mail_delivery_retry', ['deliveryId', 'recipient'], { unique: true })
@Index('IDX_mail_delivery_owner', ['userId', 'createdAt'])
export class MiMailDelivery {
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_mail_delivery' })
	public id: string;

	@Column('varchar', { length: 200 })
	public deliveryId: string;

	@Column('varchar', { length: 320 })
	public recipient: string;

	@Column('varchar', { length: 320 })
	public envelopeFrom: string;

	@Column('varchar', { length: 32 })
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mail_delivery_user' })
	public user: MiUser;

	@Column('uuid', { nullable: true })
	public rawId: string | null;

	@ManyToOne(() => MiMailRaw, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mail_delivery_raw' })
	public raw: MiMailRaw | null;

	// Kept after deletion as a retry tombstone, to prevent resurrection/double charging.
	@Column('varchar', { length: 64 })
	public sha256: string;

	@Column('integer')
	public size: number;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone', { nullable: true })
	public readAt: Date | null;

	@Column('timestamp with time zone', { nullable: true })
	public deletedAt: Date | null;

	@Column('boolean', { default: true })
	public localStored: boolean;

	@Column('varchar', { length: 16, nullable: true })
	public localError: 'quota' | 'disabled' | null;

	@Column('varchar', { length: 16 })
	public parseState: 'pending' | 'parsed' | 'failed';

	@Column('jsonb', { nullable: true })
	public parsed: Record<string, unknown> | null;
}

@Entity('mail_outbox')
@Index('IDX_mail_outbox_delivery', ['deliveryId', 'kind'], { unique: true })
export class MiMailOutbox {
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_mail_outbox' })
	public id: string;

	@Column('uuid')
	public deliveryId: string;

	@ManyToOne(() => MiMailDelivery, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mail_outbox_delivery' })
	public delivery: MiMailDelivery;

	@Column('varchar', { length: 16 })
	public kind: 'parse';

	@Column('timestamp with time zone')
	public createdAt: Date;
}
