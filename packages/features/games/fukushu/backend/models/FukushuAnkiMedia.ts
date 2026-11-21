/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { MiFukushuDeck } from './FukushuDeck.js';
import type { AnkiMediaAsset } from '../../shared/anki-media.schema.js';

@Entity('fukushu_anki_media')
@Unique('UQ_fukushu_anki_media_deck_type', ['ownerId', 'deckId', 'mimeType'])
@Check('CHK_fukushu_anki_media_mime', '"mimeType" IN (\'image/png\', \'audio/wav\')')
@Check('CHK_fukushu_anki_media_id', `"id" ~ '^[a-f0-9]{64}$'`)
@Check('CHK_fukushu_anki_media_bytes', 'octet_length("data") BETWEEN 1 AND 262144')
export class MiFukushuAnkiMedia {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_fukushu_anki_media' })
	public ownerId: string;

	@PrimaryColumn('varchar', { length: 256, primaryKeyConstraintName: 'PK_fukushu_anki_media' })
	public deckId: string;

	@PrimaryColumn('varchar', { length: 64, primaryKeyConstraintName: 'PK_fukushu_anki_media' })
	public id: string;

	@Column('varchar', { length: 16 })
	public mimeType: AnkiMediaAsset['mimeType'];

	@Column('bytea')
	public data: Buffer;

	@ManyToOne(() => MiFukushuDeck, { onDelete: 'CASCADE' })
	@JoinColumn([
		{ name: 'ownerId', referencedColumnName: 'ownerId', foreignKeyConstraintName: 'FK_fukushu_anki_media_deck' },
		{ name: 'deckId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_fukushu_anki_media_deck' },
	])
	public deck: MiFukushuDeck | null;
}
