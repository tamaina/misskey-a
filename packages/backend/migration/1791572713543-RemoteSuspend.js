/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoteSuspend1791572713543 {
    name = 'RemoteSuspend1791572713543'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isRemoteSuspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isSuspended" IS 'Whether the User is suspended by the local moderators.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isRemoteSuspended" IS 'Whether the User is suspended by the remote moderators.'`);
    }

    async down(queryRunner) {
        // The remaining local flag becomes the sole suspension authority again.
        await queryRunner.query(`UPDATE "following" AS f SET "isFollowerSuspended" = u."isSuspended" FROM "user" AS u WHERE f."followerId" = u.id AND f."isFollowerSuspended" IS DISTINCT FROM u."isSuspended"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isSuspended" IS 'Whether the User is suspended.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isRemoteSuspended"`);
    }
}
