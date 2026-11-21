/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';

@Entity('fukushu_reminder')
@Index('IDX_fukushu_reminder_next', ['nextAt', 'ownerId'], { where: '"nextAt" IS NOT NULL' })
@Index('IDX_fukushu_reminder_retry', ['retryAt', 'ownerId'], { where: '"retryAt" IS NOT NULL' })
export class MiFukushuReminder {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_reminder' }) public ownerId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_reminder_owner' }) public owner: MiUser | null;
	@Column('time') public localTime: string;
	@Column('text') public zone: string;
	@Column('timestamptz', { nullable: true }) public nextAt: Date | null;
	@Column('timestamptz', { nullable: true }) public lastClaimedAt: Date | null;
	@Column('date', { nullable: true }) public lastClaimedDay: string | null;
	@Column('timestamptz', { nullable: true }) public expiresAt: Date | null;
	@Column('timestamptz', { nullable: true }) public retryAt: Date | null;
}
