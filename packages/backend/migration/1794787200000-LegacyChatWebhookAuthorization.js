/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LegacyChatWebhookAuthorization1794787200000 {
	name = 'LegacyChatWebhookAuthorization1794787200000';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "webhook" ADD "chatGeneration" uuid, ADD "chatTokenId" character varying(32)`);
		await queryRunner.query(`CREATE INDEX "IDX_webhook_chatTokenId" ON "webhook" ("chatTokenId")`);
		await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_webhook_chatTokenId" FOREIGN KEY ("chatTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE`);
		// Existing rows have no trustworthy record of who authorized chat access.
		// Keep other events running; owners can explicitly reselect chatMessage.
		await queryRunner.query(`UPDATE "webhook" SET "on" = array_remove("on", 'chatMessage') WHERE "mode" = 'legacy' AND 'chatMessage' = ANY("on")`);
	}
	async down(queryRunner) {
		// Never restore a permission-sensitive subscription during rollback.
		await queryRunner.query(`UPDATE "webhook" SET "on" = array_remove("on", 'chatMessage') WHERE "mode" = 'legacy' AND 'chatMessage' = ANY("on")`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_webhook_chatTokenId"`);
		await queryRunner.query(`DROP INDEX "IDX_webhook_chatTokenId"`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP "chatTokenId", DROP "chatGeneration"`);
	}
}
