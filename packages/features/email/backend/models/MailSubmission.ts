/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiMailRaw } from './Mail.js';

@Entity('mail_forwarding')
export class MiMailForwarding {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_mail_forwarding' })
	public userId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId', foreignKeyConstraintName: 'FK_mail_forwarding_user' })
	public user: MiUser;
	@Column('varchar', { length: 254, nullable: true })
	public address: string | null;
	@Column('boolean', { default: false })
	public enabled: boolean;
	@Column('boolean', { default: true })
	public keepLocalCopy: boolean;
	@Column('integer', { default: 0 })
	public revision: number;
	@Column('timestamp with time zone', { nullable: true })
	public verifiedAt: Date | null;
	@Column('varchar', { length: 64, nullable: true, select: false })
	public tokenHash: string | null;
	@Column('timestamp with time zone', { nullable: true })
	public expiresAt: Date | null;
	@Column('timestamp with time zone')
	public updatedAt: Date;
}

@Entity('mail_submission')
@Index('IDX_mail_submission_key', ['userId', 'idempotencyKey'], { unique: true })
@Index('IDX_mail_submission_due', ['state', 'nextAttemptAt'])
export class MiMailSubmission {
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_mail_submission' })
	public id: string;
	@Column('varchar', { length: 32 })
	public userId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mail_submission_user' })
	public user: MiUser;
	@Column('varchar', { length: 200 })
	public idempotencyKey: string;
	@Column('varchar', { length: 64 })
	public contentHash: string;
	@Column('uuid', { nullable: true })
	public rawId: string | null;
	@ManyToOne(() => MiMailRaw, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mail_submission_raw' })
	public raw: MiMailRaw | null;
	@Column('varchar', { length: 16 })
	public kind: 'send' | 'forward' | 'confirmation';
	@Column('uuid', { nullable: true })
	public deliveryId: string | null;
	@Column('integer', { nullable: true })
	public forwardingRevision: number | null;
	@Column('varchar', { length: 254 })
	public envelopeFrom: string;
	@Column('jsonb')
	public recipients: string[];
	@Column('jsonb')
	public metadata: { subject: string; to: string[]; cc: string[]; bcc: string[] };
	@Column('varchar', { length: 16 })
	public state: 'queued' | 'sending' | 'submitted' | 'failed' | 'unknown' | 'cancelled';
	@Column('uuid', { nullable: true })
	public attemptId: string | null;
	@Column('timestamp with time zone', { nullable: true })
	public leaseUntil: Date | null;
	@Column('timestamp with time zone')
	public createdAt: Date;
	@Column('timestamp with time zone')
	public expiresAt: Date;
	@Column('timestamp with time zone')
	public nextAttemptAt: Date;
	@Column('integer', { default: 0 })
	public attempts: number;
	@Column('integer')
	public size: number;
	@Column('boolean', { default: false })
	public charged: boolean;
	@Column('timestamp with time zone', { nullable: true })
	public deletedAt: Date | null;
	@Column('jsonb', { default: {} })
	public result: { accepted?: string[]; rejected?: string[]; retryableRecipients?: string[]; reason?: string | null };
}
