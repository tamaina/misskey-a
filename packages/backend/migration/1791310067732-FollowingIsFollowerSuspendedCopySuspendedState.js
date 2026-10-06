/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowingIsFollowerSuspendedCopySuspendedState1791310067732 {
    name = 'FollowingIsFollowerSuspendedCopySuspendedState1791310067732'

    async up(queryRunner) {
			// Update existing records based on user suspension status
			await queryRunner.query(`
				UPDATE "following"
				SET "isFollowerSuspended" = "user"."isSuspended"
				FROM "user"
				WHERE "following"."followerId" = "user"."id"
			`);
	}

	async down(queryRunner) {
		await queryRunner.query(`
			UPDATE "following"
			SET "isFollowerSuspended" = false
		`);
	}
}
