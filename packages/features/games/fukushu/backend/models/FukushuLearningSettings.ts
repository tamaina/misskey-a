/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import type { LearningSettings } from '../../shared/upstream-records.schema.js';

// Before the first source archive or GIFT, preferences must not occupy a source ID.
@Entity('fukushu_learning_settings')
export class MiFukushuLearningSettings {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_learning_settings' }) public ownerId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_learning_settings_owner' }) public owner: MiUser | null;
	@Column('jsonb') public data: LearningSettings;
}
