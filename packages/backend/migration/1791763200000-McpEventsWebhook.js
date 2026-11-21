/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class McpEventsWebhook1791763200000 {
	name = 'McpEventsWebhook1791763200000';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "webhook"
			ADD "mode" character varying(16) NOT NULL DEFAULT 'legacy',
			ADD "mcpTokenId" character varying(32),
			ADD "mcpExpiresAt" TIMESTAMP WITH TIME ZONE,
			ADD "mcpGeneration" uuid,
			ADD "mcpPreviousSecret" character varying(1024),
			ADD "mcpPreviousSecretUntil" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`CREATE INDEX "IDX_webhook_mcpTokenId" ON "webhook" ("mcpTokenId")`);
		await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_webhook_mcpTokenId" FOREIGN KEY ("mcpTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE`);
	}
	async down(queryRunner) {
		await queryRunner.query(`DELETE FROM "webhook" WHERE "mode" = 'mcp'`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_webhook_mcpTokenId"`);
		await queryRunner.query(`DROP INDEX "IDX_webhook_mcpTokenId"`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP "mcpPreviousSecretUntil", DROP "mcpPreviousSecret", DROP "mcpGeneration", DROP "mcpExpiresAt", DROP "mcpTokenId", DROP "mode"`);
	}
}
