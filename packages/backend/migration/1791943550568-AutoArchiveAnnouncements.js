/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Port of misskey-dev/misskey afe9db2694ba820ac1b93155881f39e35ffe01d1.
export class AutoArchiveAnnouncements1791943550568 {
	name = 'AutoArchiveAnnouncements1791943550568';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "announcement" ADD "autoArchiveAt" TIMESTAMP WITH TIME ZONE`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "autoArchiveAt"`);
	}
}
