/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FukushuReminder1795040000000 {
	name = 'FukushuReminder1795040000000';
	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE fukushu_reminder (
			"ownerId" varchar(32) CONSTRAINT "PK_fukushu_reminder" PRIMARY KEY CONSTRAINT "FK_fukushu_reminder_owner" REFERENCES "user"(id) ON DELETE CASCADE,
			"localTime" time NOT NULL,
			zone text NOT NULL,
			"nextAt" timestamptz,
			"lastClaimedAt" timestamptz,
			"lastClaimedDay" date,
			"retryAt" timestamptz,
			"expiresAt" timestamptz
		)`);
		await queryRunner.query('CREATE INDEX "IDX_fukushu_reminder_next" ON fukushu_reminder ("nextAt", "ownerId") WHERE "nextAt" IS NOT NULL');
		await queryRunner.query('CREATE INDEX "IDX_fukushu_reminder_retry" ON fukushu_reminder ("retryAt", "ownerId") WHERE "retryAt" IS NOT NULL');
	}
	async down(queryRunner) {
		await queryRunner.query('DROP TABLE fukushu_reminder');
	}
}
