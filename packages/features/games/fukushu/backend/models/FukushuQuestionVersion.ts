/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiFukushuQuestion } from './FukushuQuestion.js';
import type { FukushuMaterial } from '../../shared/material.schema.js';

@Entity('fukushu_question_version')
export class MiFukushuQuestionVersion {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_question_version' })
	public ownerId: string;

	@PrimaryColumn('varchar', { length: 256, primaryKeyConstraintName: 'PK_fukushu_question_version' })
	public questionId: string;

	@PrimaryColumn('integer', { primaryKeyConstraintName: 'PK_fukushu_question_version' })
	public version: number;

	@ManyToOne(() => MiFukushuQuestion, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_question_version_question' },
		{ name: 'questionId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_fukushu_question_version_question' },
	])
	public question: MiFukushuQuestion | null;

	@Column('jsonb')
	public data: FukushuMaterial['questions'][number];

	@Column('timestamp with time zone')
	public recordedAt: Date;

	@Column('varchar', { length: 16 })
	public kind: 'baseline' | 'explanation';

	@Column('integer')
	public byteSize: number;
}
