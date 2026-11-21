/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiFukushuUpstreamRecord } from './FukushuUpstreamRecord.js';

/** Permanent storage for large attachments. Legacy inline bytea values remain readable. */
@Entity('fukushu_upstream_chunk')
export class MiFukushuUpstreamChunk {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_upstream_chunk' }) public ownerId: string;
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_upstream_chunk' }) public store: string;
	@PrimaryColumn('varchar', { length: 64, primaryKeyConstraintName: 'PK_fukushu_upstream_chunk' }) public key: string;
	@PrimaryColumn('integer', { primaryKeyConstraintName: 'PK_fukushu_upstream_chunk' }) public part: number;
	@ManyToOne(() => MiFukushuUpstreamRecord, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_upstream_chunk_record' },
		{ name: 'store', referencedColumnName: 'store', foreignKeyConstraintName: 'FK_fukushu_upstream_chunk_record' },
		{ name: 'key', referencedColumnName: 'key', foreignKeyConstraintName: 'FK_fukushu_upstream_chunk_record' },
	])
	public record: MiFukushuUpstreamRecord | null;
	@Column('bytea') public bytes: Buffer;
}
