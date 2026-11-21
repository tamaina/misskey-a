/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiFukushuQuestion } from './FukushuQuestion.js';
import type { StudyStateRecord } from '../../shared/study.schema.js';

@Entity('fukushu_study_state')
@Index('IDX_fukushu_study_state_deck', ['ownerId', 'deckId'])
export class MiFukushuStudyState {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_study_state' })
	public ownerId: string;

	@PrimaryColumn('varchar', { length: 256, primaryKeyConstraintName: 'PK_fukushu_study_state' })
	public questionId: string;

	@Column('varchar', { length: 256 })
	public deckId: string;

	@ManyToOne(() => MiFukushuQuestion, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_study_state_question' },
		{ name: 'questionId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_fukushu_study_state_question' },
	])
	public question: MiFukushuQuestion | null;

	@Column('integer', { default: 1 })
	public revision: number;

	@Column('jsonb')
	public data: StudyStateRecord;
}
