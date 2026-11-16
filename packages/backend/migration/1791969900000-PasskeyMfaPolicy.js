/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PasskeyMfaPolicy1791969900000 {
	name = 'PasskeyMfaPolicy1791969900000';
	async up(queryRunner) {
		// Preserve the old signin policy only when introducing this column:
		// twoFactorEnabled plus an owned key already allowed passkey MFA.
		// Do not repeat this backfill in a later migration: false can then mean
		// the user explicitly disabled passkey MFA while retaining their keys.
		await queryRunner.query('ALTER TABLE "user_profile" ADD "passkeyMfaEnabled" boolean NOT NULL DEFAULT false');
		await queryRunner.query(`UPDATE "user_profile" AS profile
			SET "passkeyMfaEnabled" = true
			WHERE profile."twoFactorEnabled" = true
			AND EXISTS (
				SELECT 1 FROM "user_security_key" AS key
				WHERE key."userId" = profile."userId"
			)`);
	}
	async down(queryRunner) {
		// Serialize with policy mutations before checking, including a future
		// activation writer. Never discard an enabled policy during rollback.
		await queryRunner.query('LOCK TABLE "user_profile" IN ACCESS EXCLUSIVE MODE');
		const active = await queryRunner.query('SELECT 1 FROM "user_profile" WHERE "passkeyMfaEnabled" = true LIMIT 1');
		if (active.length > 0) throw new Error('Cannot remove enabled passkey MFA policy');
		await queryRunner.query('ALTER TABLE "user_profile" DROP COLUMN "passkeyMfaEnabled"');
	}
}
