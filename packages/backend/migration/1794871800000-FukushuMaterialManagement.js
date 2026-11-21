/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FukushuMaterialManagement1794871800000 {
	name = 'FukushuMaterialManagement1794871800000';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "fukushu_deck" ADD "revision" integer NOT NULL DEFAULT 1');
		await queryRunner.query('ALTER TABLE "fukushu_deck" ADD "archivedAt" TIMESTAMP WITH TIME ZONE');
	}

	async down(queryRunner) {
		// Preserve every deck/card; downgrade loses archive visibility and concurrency state.
		await queryRunner.query('ALTER TABLE "fukushu_deck" DROP COLUMN "archivedAt"');
		await queryRunner.query('ALTER TABLE "fukushu_deck" DROP COLUMN "revision"');
	}
}
