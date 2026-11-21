/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FukushuMaterial1794838800000 {
	name = 'FukushuMaterial1794838800000';

	async up(queryRunner) {
		await queryRunner.query('CREATE TABLE "fukushu_deck" ("ownerId" character varying(32) NOT NULL, "id" character varying(256) NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "PK_fukushu_deck" PRIMARY KEY ("ownerId", "id"), CONSTRAINT "FK_fukushu_deck_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION)');
		await queryRunner.query('CREATE TABLE "fukushu_question" ("ownerId" character varying(32) NOT NULL, "id" character varying(256) NOT NULL, "deckId" character varying(256) NOT NULL, "position" integer NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "PK_fukushu_question" PRIMARY KEY ("ownerId", "id"), CONSTRAINT "FK_fukushu_question_deck" FOREIGN KEY ("ownerId", "deckId") REFERENCES "fukushu_deck"("ownerId", "id") ON DELETE CASCADE ON UPDATE NO ACTION)');
		await queryRunner.query('CREATE INDEX "IDX_fukushu_question_deck" ON "fukushu_question" ("ownerId", "deckId")');
	}

	async down(queryRunner) {
		// This rollback drops only the new feature's data; export it before downgrade.
		await queryRunner.query('DROP TABLE "fukushu_question"');
		await queryRunner.query('DROP TABLE "fukushu_deck"');
	}
}
