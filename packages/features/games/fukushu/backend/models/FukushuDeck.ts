/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import type { FukushuMaterial } from '../../shared/material.schema.js';

@Entity('fukushu_deck')
export class MiFukushuDeck {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_deck' })
	public ownerId: string;

	@PrimaryColumn('varchar', { length: 256, primaryKeyConstraintName: 'PK_fukushu_deck' })
	public id: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_deck_owner' })
	public owner: MiUser | null;

	@Column('integer', { default: 1 })
	public revision: number;

	@Column('timestamp with time zone', { nullable: true })
	public archivedAt: Date | null;

	@Column('jsonb')
	public data: FukushuMaterial['deck'];
}
