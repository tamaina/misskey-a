/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuAnkiMedia1795305600000 {
	name = 'FukushuAnkiMedia1795305600000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "fukushu_anki_media" (
			"ownerId" character varying(32) NOT NULL,
			"deckId" character varying(256) NOT NULL,
			"id" character varying(64) NOT NULL,
			"mimeType" character varying(16) NOT NULL,
			"data" bytea NOT NULL,
			CONSTRAINT "PK_fukushu_anki_media" PRIMARY KEY ("ownerId", "deckId", "id"),
			CONSTRAINT "UQ_fukushu_anki_media_deck_type" UNIQUE ("ownerId", "deckId", "mimeType"),
			CONSTRAINT "CHK_fukushu_anki_media_mime" CHECK ("mimeType" IN ('image/png', 'audio/wav')),
			CONSTRAINT "CHK_fukushu_anki_media_id" CHECK ("id" ~ '^[a-f0-9]{64}$'),
			CONSTRAINT "CHK_fukushu_anki_media_bytes" CHECK (octet_length("data") BETWEEN 1 AND 262144),
			CONSTRAINT "FK_fukushu_anki_media_deck" FOREIGN KEY ("ownerId", "deckId") REFERENCES "fukushu_deck"("ownerId", "id") ON DELETE CASCADE ON UPDATE NO ACTION
		)`);
	}

	async down(queryRunner) {
		// An older build cannot preserve these attachments. Do not silently
		// remove data still referenced by cards or historical versions.
		await queryRunner.query('LOCK TABLE "fukushu_anki_media" IN ACCESS EXCLUSIVE MODE');
		await queryRunner.query(`DO $$ BEGIN
			IF EXISTS (SELECT 1 FROM "fukushu_anki_media") THEN
				RAISE EXCEPTION 'Fukushu Anki media must be backed up and its decks removed before reverting this migration';
			END IF;
		END $$`);
		await queryRunner.query('DROP TABLE "fukushu_anki_media"');
	}
}
