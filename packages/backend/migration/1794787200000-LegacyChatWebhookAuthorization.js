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
		// Preserve existing beta subscriptions without requiring reconfiguration.
		// Their original grant is unknown, so only later edits bind a scoped token.
		await queryRunner.query(`UPDATE "webhook" SET "chatGeneration" = gen_random_uuid() WHERE "mode" = 'legacy' AND 'chatMessage' = ANY("on")`);
	}
	async down(queryRunner) {
		// Rollback removes authorization metadata, not the user's event selection.
		await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_webhook_chatTokenId"`);
		await queryRunner.query(`DROP INDEX "IDX_webhook_chatTokenId"`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP "chatTokenId", DROP "chatGeneration"`);
	}
}
