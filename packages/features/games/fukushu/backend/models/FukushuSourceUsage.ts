/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';

@Entity('fukushu_source_usage')
export class MiFukushuSourceUsage {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_source_usage' }) public ownerId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_source_usage_owner' }) public owner: MiUser | null;
	@Column('integer') public count: number;
	@Column('integer') public logs: number;
	@Column('integer') public last: number;
	@Column('integer') public bytes: number;
	@Column('integer') public materialBytes: number;
	@Column('integer') public binaries: number;
}
