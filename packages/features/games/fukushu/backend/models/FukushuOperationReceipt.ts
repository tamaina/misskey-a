/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';

@Entity('fukushu_operation_receipt')
export class MiFukushuOperationReceipt {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_operation_receipt' }) public ownerId: string;
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_fukushu_operation_receipt' }) public id: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_operation_receipt_owner' }) public owner: MiUser | null;
	@Column('text') public request: string;
	@Column('text') public result: string;
}
