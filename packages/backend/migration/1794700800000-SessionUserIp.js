/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SessionUserIp1794700800000 {
	name = 'SessionUserIp1794700800000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_ip" ADD "lastSeenAt" timestamp with time zone, ADD "browserSessionId" character varying(32)`);
		await queryRunner.query(`UPDATE "user_ip" SET "lastSeenAt" = "createdAt"`);
		await queryRunner.query(`ALTER TABLE "user_ip" ALTER COLUMN "lastSeenAt" SET NOT NULL`);
		await queryRunner.query(`DROP INDEX "IDX_361b500e06721013c124b7b6c5"`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_ip_session_unique" ON "user_ip" ("userId", "ip", (COALESCE("browserSessionId", '')))`);
		await queryRunner.query(`CREATE INDEX "IDX_user_ip_browserSessionId" ON "user_ip" ("browserSessionId")`);
		await queryRunner.query(`ALTER TABLE "user_ip" ADD CONSTRAINT "FK_user_ip_browserSessionId" FOREIGN KEY ("browserSessionId") REFERENCES "browser_session"("id") ON DELETE SET NULL`);
		// Preserve historical unlinked rows; session usage has its own first/last observation.
		await queryRunner.query(`INSERT INTO "user_ip" ("userId", "ip", "browserSessionId", "createdAt", "lastSeenAt")
			SELECT "userId", "lastIp", "id", "lastUsedAt", "lastUsedAt" FROM "browser_session" WHERE "lastIp" IS NOT NULL
			ON CONFLICT ("userId", "ip", (COALESCE("browserSessionId", ''))) DO UPDATE SET
			"createdAt" = LEAST("user_ip"."createdAt", EXCLUDED."createdAt"), "lastSeenAt" = GREATEST("user_ip"."lastSeenAt", EXCLUDED."lastSeenAt")`);
		// SET NULL can collide with an existing unlinked row (or another deleted session).
		// Merge observations before the FK action, preserving the first and last timestamps.
		await queryRunner.query(`CREATE FUNCTION merge_deleted_session_ips() RETURNS trigger LANGUAGE plpgsql AS $$
		BEGIN
			INSERT INTO "user_ip" ("userId", "ip", "browserSessionId", "createdAt", "lastSeenAt")
			SELECT "userId", "ip", NULL, "createdAt", "lastSeenAt" FROM "user_ip" WHERE "browserSessionId" = OLD."id"
			ON CONFLICT ("userId", "ip", (COALESCE("browserSessionId", ''))) DO UPDATE SET
			"createdAt" = LEAST("user_ip"."createdAt", EXCLUDED."createdAt"), "lastSeenAt" = GREATEST("user_ip"."lastSeenAt", EXCLUDED."lastSeenAt");
			DELETE FROM "user_ip" WHERE "browserSessionId" = OLD."id";
			RETURN OLD;
		END $$`);
		await queryRunner.query(`CREATE TRIGGER "TR_merge_deleted_session_ips" BEFORE DELETE ON "browser_session" FOR EACH ROW EXECUTE FUNCTION merge_deleted_session_ips()`);
		await queryRunner.query(`ALTER TABLE "browser_session" DROP COLUMN "lastIp"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "browser_session" ADD "lastIp" character varying(128)`);
		await queryRunner.query(`UPDATE "browser_session" AS session SET "lastIp" = (
			SELECT "ip" FROM "user_ip" WHERE "browserSessionId" = session."id" ORDER BY "lastSeenAt" DESC, "id" DESC LIMIT 1)`);
		await queryRunner.query(`DROP TRIGGER "TR_merge_deleted_session_ips" ON "browser_session"`);
		await queryRunner.query(`DROP FUNCTION merge_deleted_session_ips()`);
		await queryRunner.query(`ALTER TABLE "user_ip" DROP CONSTRAINT "FK_user_ip_browserSessionId"`);
		await queryRunner.query(`DROP INDEX "IDX_user_ip_session_unique"`);
		await queryRunner.query(`DROP INDEX "IDX_user_ip_browserSessionId"`);
		// Collapse session buckets for the old schema, keeping the earliest first-seen row.
		await queryRunner.query(`WITH first_rows AS (
			SELECT "id", row_number() OVER (PARTITION BY "userId", "ip" ORDER BY "createdAt", "id") AS n FROM "user_ip"
		) DELETE FROM "user_ip" WHERE "id" IN (SELECT "id" FROM first_rows WHERE n > 1)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_361b500e06721013c124b7b6c5" ON "user_ip" ("userId", "ip")`);
		await queryRunner.query(`ALTER TABLE "user_ip" DROP COLUMN "browserSessionId", DROP COLUMN "lastSeenAt"`);
	}
}
