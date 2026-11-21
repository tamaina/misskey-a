/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BrowserSessionHistory1794614400000 {
	name = 'BrowserSessionHistory1794614400000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "browser_session" ADD "lastIp" character varying(128), ADD "lastUserAgent" character varying(1024)`);
		await queryRunner.query(`ALTER TABLE "signin" ADD "browserSessionId" character varying(32)`);
		await queryRunner.query(`CREATE INDEX "IDX_signin_browserSessionId" ON "signin" ("browserSessionId")`);
		await queryRunner.query(`ALTER TABLE "signin" ADD CONSTRAINT "FK_signin_browserSessionId" FOREIGN KEY ("browserSessionId") REFERENCES "browser_session"("id") ON DELETE SET NULL`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "signin" DROP CONSTRAINT "FK_signin_browserSessionId"`);
		await queryRunner.query(`DROP INDEX "IDX_signin_browserSessionId"`);
		await queryRunner.query(`ALTER TABLE "signin" DROP COLUMN "browserSessionId"`);
		await queryRunner.query(`ALTER TABLE "browser_session" DROP COLUMN "lastUserAgent", DROP COLUMN "lastIp"`);
	}
}
