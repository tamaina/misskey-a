/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PasskeyMfaPolicy1791969900000 {
	name = 'PasskeyMfaPolicy1791969900000';
	async up(queryRunner) {
		// Existing registered keys never imply activation.
		await queryRunner.query('ALTER TABLE "user_profile" ADD "passkeyMfaEnabled" boolean NOT NULL DEFAULT false');
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
