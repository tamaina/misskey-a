/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class McpAntennaEvents1791763200001 {
	name = 'McpAntennaEvents1791763200001';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "webhook" ADD "mcpAntennaId" character varying(32)`);
		await queryRunner.query(`CREATE INDEX "IDX_webhook_mcpAntennaId" ON "webhook" ("mcpAntennaId")`);
		await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_webhook_mcpAntennaId" FOREIGN KEY ("mcpAntennaId") REFERENCES "antenna"("id") ON DELETE CASCADE`);
	}
	async down(queryRunner) {
		await queryRunner.query(`DELETE FROM "webhook" WHERE "mcpAntennaId" IS NOT NULL`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_webhook_mcpAntennaId"`);
		await queryRunner.query(`DROP INDEX "IDX_webhook_mcpAntennaId"`);
		await queryRunner.query(`ALTER TABLE "webhook" DROP "mcpAntennaId"`);
	}
}
