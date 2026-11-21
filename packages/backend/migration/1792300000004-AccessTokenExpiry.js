/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class AccessTokenExpiry1792300000004 {
	name = 'AccessTokenExpiry1792300000004';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "access_token" ADD "expiresAt" timestamptz`);
		await queryRunner.query(`CREATE TABLE "oauth_approval" ("id" varchar(32) NOT NULL, "userId" varchar(32) NOT NULL, "sessionId" varchar(32) NOT NULL, "sudoGrantId" varchar(43) NOT NULL, "policyStamp" varchar(64) NOT NULL, "grantStamp" varchar(64) NOT NULL, "deadline" timestamptz NOT NULL, CONSTRAINT "PK_oauth_approval" PRIMARY KEY ("id"), CONSTRAINT "FK_oauth_approval_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE, CONSTRAINT "FK_oauth_approval_session" FOREIGN KEY ("sessionId") REFERENCES "browser_session"("id") ON DELETE CASCADE)`);
		await queryRunner.query(`CREATE INDEX "IDX_oauth_approval_deadline" ON "oauth_approval" ("deadline")`);
	}
	async down(queryRunner) {
		await queryRunner.query(`LOCK TABLE "access_token", "oauth_approval" IN ACCESS EXCLUSIVE MODE`);
		if ((await queryRunner.query(`SELECT 1 FROM "access_token" WHERE "expiresAt" IS NOT NULL LIMIT 1`)).length || (await queryRunner.query(`SELECT 1 FROM "oauth_approval" WHERE "deadline" > CURRENT_TIMESTAMP LIMIT 1`)).length) throw new Error('Revoke expiring tokens and finish or expire pending approvals before rollback');
		await queryRunner.query(`DROP TABLE "oauth_approval"`);
		await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "expiresAt"`);
	}
}
