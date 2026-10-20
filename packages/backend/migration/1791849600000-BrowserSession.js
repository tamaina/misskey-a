/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BrowserSession1791849600000 {
	name = 'BrowserSession1791849600000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "browser_session" (
			"id" varchar(32) NOT NULL,
			"userId" varchar(32) NOT NULL,
			"tokenHash" varchar(64) NOT NULL,
			"createdAt" timestamp with time zone NOT NULL,
			"lastUsedAt" timestamp with time zone NOT NULL,
			"revokedAt" timestamp with time zone,
			"sudoUntil" timestamp with time zone,
			CONSTRAINT "PK_browser_session" PRIMARY KEY ("id"),
			CONSTRAINT "FK_browser_session_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
		)`);
		await queryRunner.query('CREATE INDEX "IDX_browser_session_userId" ON "browser_session" ("userId")');
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_browser_session_tokenHash" ON "browser_session" ("tokenHash")');
	}

	async down(queryRunner) {
		// Once adopted, rolling this back invalidates all new browser sessions.
		await queryRunner.query('DROP TABLE "browser_session"');
	}
}
