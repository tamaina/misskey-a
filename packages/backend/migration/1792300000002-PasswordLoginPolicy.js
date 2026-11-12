/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class PasswordLoginPolicy1792300000002 {
	name = 'PasswordLoginPolicy1792300000002';
	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" ADD "passwordLoginDisabled" boolean NOT NULL DEFAULT false');
	}
	async down(queryRunner) {
		await queryRunner.query('LOCK TABLE "user_profile" IN ACCESS EXCLUSIVE MODE');
		// Do not silently re-enable password login on a rollback of an active policy.
		const active = await queryRunner.query('SELECT 1 FROM "user_profile" WHERE "passwordLoginDisabled" = true LIMIT 1');
		if (active.length) throw new Error('Restore password login explicitly before rolling back its policy');
		await queryRunner.query('ALTER TABLE "user_profile" DROP COLUMN "passwordLoginDisabled"');
	}
}
