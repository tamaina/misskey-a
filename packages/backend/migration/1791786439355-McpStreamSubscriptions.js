/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class McpStreamSubscriptions1791786439355 {
	name = 'McpStreamSubscriptions1791786439355';
	async up(queryRunner) { await queryRunner.query('ALTER TABLE "webhook" ADD "mcpStream" jsonb, ADD "mcpStreamSince" timestamp with time zone'); }
	async down(queryRunner) {
		await queryRunner.query('DELETE FROM "webhook" WHERE "mcpStream" IS NOT NULL');
		await queryRunner.query('ALTER TABLE "webhook" DROP COLUMN "mcpStream", DROP COLUMN "mcpStreamSince"');
	}
}
