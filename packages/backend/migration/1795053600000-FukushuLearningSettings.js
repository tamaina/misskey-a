/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuLearningSettings1795053600000 {
	name = 'FukushuLearningSettings1795053600000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE fukushu_learning_settings ("ownerId" varchar(32) NOT NULL CONSTRAINT "FK_fukushu_learning_settings_owner" REFERENCES "user"(id) ON DELETE CASCADE, data jsonb NOT NULL, CONSTRAINT "PK_fukushu_learning_settings" PRIMARY KEY ("ownerId"))`);
	}
	async down(queryRunner) {
		const [saved] = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM fukushu_learning_settings) OR EXISTS (SELECT 1 FROM fukushu_review_log WHERE "desiredRetention" <> 0.9) AS used`);
		if (saved.used) throw new Error('Saved learning settings and historical retention must be preserved.');
		await queryRunner.query('DROP TABLE fukushu_learning_settings');
	}
}
