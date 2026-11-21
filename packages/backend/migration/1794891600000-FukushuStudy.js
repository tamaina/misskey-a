/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FukushuStudy1794891600000 {
	name = 'FukushuStudy1794891600000';

	async up(queryRunner) {
		await queryRunner.query('CREATE TABLE "fukushu_study_state" ("ownerId" character varying(32) NOT NULL, "questionId" character varying(256) NOT NULL, "deckId" character varying(256) NOT NULL, "revision" integer NOT NULL DEFAULT 1, "data" jsonb NOT NULL, CONSTRAINT "PK_fukushu_study_state" PRIMARY KEY ("ownerId", "questionId"), CONSTRAINT "FK_fukushu_study_state_question" FOREIGN KEY ("ownerId", "questionId") REFERENCES "fukushu_question"("ownerId", "id") ON DELETE CASCADE ON UPDATE NO ACTION)');
		await queryRunner.query('CREATE INDEX "IDX_fukushu_study_state_deck" ON "fukushu_study_state" ("ownerId", "deckId")');
		await queryRunner.query('CREATE TABLE "fukushu_review_log" ("ownerId" character varying(32) NOT NULL, "id" uuid NOT NULL, "questionId" character varying(256) NOT NULL, "deckId" character varying(256) NOT NULL, "questionVersion" integer NOT NULL, "stateRevision" integer NOT NULL, "reviewedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "data" jsonb NOT NULL, "before" jsonb NOT NULL, "after" jsonb NOT NULL, "request" jsonb NOT NULL, "schedulerVersion" character varying(32) NOT NULL, "desiredRetention" double precision NOT NULL, "enableFuzz" boolean NOT NULL, "byteSize" integer NOT NULL, CONSTRAINT "PK_fukushu_review_log" PRIMARY KEY ("ownerId", "id"), CONSTRAINT "FK_fukushu_review_log_version" FOREIGN KEY ("ownerId", "questionId", "questionVersion") REFERENCES "fukushu_question_version"("ownerId", "questionId", "version") ON DELETE CASCADE ON UPDATE NO ACTION)');
		await queryRunner.query('CREATE INDEX "IDX_fukushu_review_log_deck_time" ON "fukushu_review_log" ("ownerId", "deckId", "reviewedAt", "id")');
	}

	async down(queryRunner) {
		await queryRunner.query(`DO $$ BEGIN
			LOCK TABLE "fukushu_study_state", "fukushu_review_log" IN ACCESS EXCLUSIVE MODE;
			IF EXISTS (SELECT 1 FROM "fukushu_study_state") OR EXISTS (SELECT 1 FROM "fukushu_review_log") THEN
				RAISE EXCEPTION 'Cannot revert FukushuStudy: saved study state and history must be preserved';
			END IF;
			DROP TABLE "fukushu_review_log";
			DROP TABLE "fukushu_study_state";
		END $$`);
	}
}
