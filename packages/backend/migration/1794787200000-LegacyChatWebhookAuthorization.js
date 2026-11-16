/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LegacyChatWebhookAuthorization1794787200000 {
	name = 'LegacyChatWebhookAuthorization1794787200000';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "webhook" ADD "chatTokenId" character varying(32)`);
		await queryRunner.query(`CREATE INDEX "IDX_webhook_chatTokenId" ON "webhook" ("chatTokenId")`);
		await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_webhook_chatTokenId" FOREIGN KEY ("chatTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE`);
		// Existing subscriptions remain unchanged and unbound to historical grants.
	}
	async down(queryRunner) {
		// Rollback removes authorization metadata, not the user's event selection.
		await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_webhook_chatTokenId"`);
		await queryRunner.query(`DROP INDEX "IDX_webhook_chatTokenId"`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP "chatTokenId"`);
	}
}
