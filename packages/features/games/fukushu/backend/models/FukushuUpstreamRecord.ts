/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';

@Entity('fukushu_upstream_record')
export class MiFukushuUpstreamRecord {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_upstream_record' }) public ownerId: string;
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_upstream_record' }) public store: string;
	@PrimaryColumn('varchar', { length: 64, primaryKeyConstraintName: 'PK_fukushu_upstream_record' }) public key: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_upstream_record_owner' }) public owner: MiUser | null;
	// JSON text preserves source strings (including escaped NUL/surrogates) without jsonb coercion.
	@Column('text') public data: string;
	@Column('bytea', { nullable: true }) public blob: Buffer | null;
	@Column('integer', { default: 0 }) public revision: number;
	@Column('integer', { nullable: true }) public chunkedSize: number | null;
	@Column('integer') public position: number;
	@Column('varchar', { length: 64 }) public sourceHash: string;
}
