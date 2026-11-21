/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiFukushuDeck } from './FukushuDeck.js';
import type { FukushuMaterial } from '../../shared/material.schema.js';

@Entity('fukushu_question')
@Index('IDX_fukushu_question_deck', ['ownerId', 'deckId'])
export class MiFukushuQuestion {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_question' })
	public ownerId: string;

	@PrimaryColumn('varchar', { length: 256, primaryKeyConstraintName: 'PK_fukushu_question' })
	public id: string;

	@Column('varchar', { length: 256 })
	public deckId: string;

	@ManyToOne(() => MiFukushuDeck, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_question_deck' },
		{ name: 'deckId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_fukushu_question_deck' },
	])
	public deck: MiFukushuDeck | null;

	@Column('integer')
	public position: number;

	@Column('integer', { default: 1 })
	public currentVersion: number;

	@Column('jsonb')
	public data: FukushuMaterial['questions'][number];
}
