/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FukushuQuestionVersions1794880800000 {
	name = 'FukushuQuestionVersions1794880800000';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "fukushu_question" ADD "currentVersion" integer NOT NULL DEFAULT 1');
		await queryRunner.query('CREATE TABLE "fukushu_question_version" ("ownerId" character varying(32) NOT NULL, "questionId" character varying(256) NOT NULL, "version" integer NOT NULL, "data" jsonb NOT NULL, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "kind" character varying(16) NOT NULL, "byteSize" integer NOT NULL, CONSTRAINT "PK_fukushu_question_version" PRIMARY KEY ("ownerId", "questionId", "version"), CONSTRAINT "FK_fukushu_question_version_question" FOREIGN KEY ("ownerId", "questionId") REFERENCES "fukushu_question"("ownerId", "id") ON DELETE CASCADE ON UPDATE NO ACTION)');
	}

	async down(queryRunner) {
		// Check and drop atomically, including when called without a migration transaction.
		// Never erase saved versions to downgrade: the caller must retain this schema.
		await queryRunner.query(`DO $$ BEGIN
			LOCK TABLE "fukushu_question_version" IN ACCESS EXCLUSIVE MODE;
			IF EXISTS (SELECT 1 FROM "fukushu_question_version") THEN
				RAISE EXCEPTION 'Cannot revert FukushuQuestionVersions: saved card versions must be preserved';
			END IF;
			DROP TABLE "fukushu_question_version";
			ALTER TABLE "fukushu_question" DROP COLUMN "currentVersion";
		END $$`);
	}
}
