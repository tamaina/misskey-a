/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class DeletionIntent1792300000003 {
	name = 'DeletionIntent1792300000003';
	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" ADD "deletionIntentId" varchar(43)');
	}
	async down(queryRunner) {
		await queryRunner.query('LOCK TABLE "user_profile" IN ACCESS EXCLUSIVE MODE');
		const pending = await queryRunner.query('SELECT 1 FROM "user_profile" WHERE "deletionIntentId" IS NOT NULL LIMIT 1');
		if (pending.length) throw new Error('Complete pending account deletion before rolling back its intent');
		await queryRunner.query('ALTER TABLE "user_profile" DROP COLUMN "deletionIntentId"');
	}
}
