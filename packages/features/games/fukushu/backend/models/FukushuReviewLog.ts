/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiFukushuQuestionVersion } from './FukushuQuestionVersion.js';
import type { ReviewLogRecord, StoredFsrsCard, StudyReviewInput } from '../../shared/study.schema.js';

@Entity('fukushu_review_log')
@Index('IDX_fukushu_review_log_deck_time', ['ownerId', 'deckId', 'reviewedAt', 'id'])
export class MiFukushuReviewLog {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_review_log' })
	public ownerId: string;

	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_fukushu_review_log' })
	public id: string;

	@Column('varchar', { length: 256 })
	public questionId: string;

	@Column('varchar', { length: 256 })
	public deckId: string;

	@Column('integer')
	public questionVersion: number;

	@ManyToOne(() => MiFukushuQuestionVersion, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_review_log_version' },
		{ name: 'questionId', referencedColumnName: 'questionId', foreignKeyConstraintName: 'FK_fukushu_review_log_version' },
		{ name: 'questionVersion', referencedColumnName: 'version', foreignKeyConstraintName: 'FK_fukushu_review_log_version' },
	])
	public versionRecord: MiFukushuQuestionVersion | null;

	@Column('integer')
	public stateRevision: number;

	@Column('timestamp with time zone')
	public reviewedAt: Date;

	@Column('jsonb')
	public data: ReviewLogRecord;

	@Column('jsonb')
	public before: StoredFsrsCard;

	@Column('jsonb')
	public after: StoredFsrsCard;

	@Column('jsonb')
	public request: StudyReviewInput;

	@Column('varchar', { length: 32 })
	public schedulerVersion: string;

	@Column('double precision')
	public desiredRetention: number;

	@Column('boolean')
	public enableFuzz: boolean;

	@Column('integer')
	public byteSize: number;
}
